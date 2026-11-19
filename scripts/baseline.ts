import { writeFileSync } from 'node:fs';

const URL = process.env.URL ?? 'http://localhost:8080/ai/ask/stream';
const TOKEN = process.env.TOKEN;
const IN_PRICE = Number(process.env.IN_PRICE_PER_M);   // $ per 1M input tokens
const OUT_PRICE = Number(process.env.OUT_PRICE_PER_M); // $ per 1M output tokens

if (!TOKEN || Number.isNaN(IN_PRICE) || Number.isNaN(OUT_PRICE)) {
  console.error('Set TOKEN, IN_PRICE_PER_M and OUT_PRICE_PER_M env vars.');
  process.exit(1);
}

// Tomar docs er upor real question
const onTopic: string[] = [
  'How many days do I have to get a refund?',
  'What happens after 30 days for refunds?',
  'How long does standard delivery take?',
  'How much extra is express delivery?',
  'What are the support hours?',
  'Which days is support available?',
  'What is the support email?',
  'Can I get store credit instead of a refund?',
  'Is express delivery available in Bangladesh?',
  'What time zone does support use?',
];

// Docs er baire question: threshold tune korar jonno
const offTopic: string[] = [
  'What is the capital of France?',
  'Who won the 2022 World Cup?',
  'How do I bake a chocolate cake?',
  'Explain quantum computing in one sentence.',
];

type Done = {
  model: string;
  promptTokens?: number;
  completionTokens?: number;
  ttftMs?: number;
  latencyMs: number;
};

function parseDone(sse: string): Done | null {
  for (const block of sse.split('\n\n')) {
    if (!block.startsWith('event: done')) continue;
    const dataLine = block.split('\n').find((l) => l.startsWith('data: '));
    if (dataLine) return JSON.parse(dataLine.slice(6));
  }
  return null;
}

function parseTopDistance(sse: string): number | null {
  const block = sse.split('\n\n').find((b) => b.startsWith('event: sources'));
  const line = block?.split('\n').find((l) => l.startsWith('data: '));
  const sources: { distance: number }[] = line ? JSON.parse(line.slice(6)) : [];
  return sources.length ? sources[0].distance : null;
}

function percentile(sorted: number[], p: number): number {
  if (!sorted.length) return NaN;
  const idx = Math.min(sorted.length - 1, Math.ceil(p * sorted.length) - 1);
  return sorted[idx];
}

async function ask(q: string) {
  const res = await fetch(URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ question: q }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

const rows: string[] = [
  'group,question,topDistance,promptTokens,completionTokens,ttftMs,latencyMs,costUsd',
];
const latencies: number[] = [];
const costs: number[] = [];
const promptTokens: number[] = [];
const completionTokens: number[] = [];

// ---- On-topic ----
for (const q of onTopic) {
  try {
    const text = await ask(q);
    const done = parseDone(text);
    const top = parseTopDistance(text);

    if (!done || done.promptTokens == null || done.completionTokens == null) {
      console.error(`NO USAGE (on-topic): ${q}`);
      console.error(text.slice(0, 400));
      continue;
    }

    const cost =
      (done.promptTokens * IN_PRICE + done.completionTokens * OUT_PRICE) / 1e6;
    latencies.push(done.latencyMs);
    costs.push(cost);
    promptTokens.push(done.promptTokens);
    completionTokens.push(done.completionTokens);

    rows.push(
      [
        'on',
        `"${q.replaceAll('"', '""')}"`,
        top?.toFixed(3) ?? '',
        done.promptTokens,
        done.completionTokens,
        Math.round(done.ttftMs ?? 0),
        Math.round(done.latencyMs),
        cost.toFixed(6),
      ].join(','),
    );
    console.log(
      `ok   top=${top?.toFixed(3)}  ${Math.round(done.latencyMs)}ms  $${cost.toFixed(6)}  ${q}`,
    );
  } catch (err) {
    console.error(`FAILED: ${q} (${(err as Error).message})`);
  }
}

// ---- Off-topic (distance dekhar jonno) ----
console.log('\n--- Off-topic (threshold tuning) ---');
for (const q of offTopic) {
  try {
    const text = await ask(q);
    const top = parseTopDistance(text);
    rows.push(`off,"${q}",${top?.toFixed(3) ?? ''},,,,,`);
    console.log(`off  top=${top?.toFixed(3) ?? 'none (filtered)'}  ${q}`);
  } catch (err) {
    console.error(`FAILED: ${q} (${(err as Error).message})`);
  }
}

latencies.sort((a, b) => a - b);
const avg = (a: number[]) => a.reduce((x, y) => x + y, 0) / (a.length || 1);

writeFileSync('baseline-results.csv', rows.join('\n'));

console.log('\n--- Summary (on-topic) ---');
console.log(`Queries ok: ${latencies.length}/${onTopic.length}`);
console.log(`P50 latency: ${Math.round(percentile(latencies, 0.5))} ms`);
console.log(`P95 latency: ${Math.round(percentile(latencies, 0.95))} ms`);
console.log(`Avg prompt tokens: ${Math.round(avg(promptTokens))}`);
console.log(`Avg completion tokens: ${Math.round(avg(completionTokens))}`);
console.log(`Avg cost/query: $${avg(costs).toFixed(6)}`);
console.log('Saved: baseline-results.csv');
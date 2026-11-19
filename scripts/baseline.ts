import { writeFileSync } from 'node:fs';

const URL = process.env.URL ?? 'http://localhost:8080/ai/ask/stream';
const TOKEN = process.env.TOKEN;
const IN_PRICE = Number(process.env.IN_PRICE_PER_M);  // $ per 1M input tokens
const OUT_PRICE = Number(process.env.OUT_PRICE_PER_M); // $ per 1M output tokens

if (!TOKEN || Number.isNaN(IN_PRICE) || Number.isNaN(OUT_PRICE)) {
  console.error('Set TOKEN, IN_PRICE_PER_M and OUT_PRICE_PER_M env vars.');
  process.exit(1);
}

// Tomar nijer 10 ta real question (docs e ja ingest kora ache tar upor)
const questions: string[] = [
  'Question 1',
  'Question 2',
  'Question 3',
  'Question 4',
  'Question 5',
  'Question 6',
  'Question 7',
  'Question 8',
  'Question 9',
  'Question 10',
];

type Done = {
  model: string;
  promptTokens?: number;
  completionTokens?: number;
  ttftMs?: number;
  latencyMs: number;
};

/** SSE text theke "done" event er data ber kore. */
function parseDone(sse: string): Done | null {
  for (const block of sse.split('\n\n')) {
    if (!block.startsWith('event: done')) continue;
    const dataLine = block.split('\n').find((l) => l.startsWith('data: '));
    if (dataLine) return JSON.parse(dataLine.slice(6));
  }
  return null;
}

function percentile(sorted: number[], p: number): number {
  if (!sorted.length) return NaN;
  const idx = Math.min(sorted.length - 1, Math.ceil(p * sorted.length) - 1);
  return sorted[idx];
}

const rows: string[] = [
  'question,model,promptTokens,completionTokens,ttftMs,latencyMs,costUsd',
];
const latencies: number[] = [];
const costs: number[] = [];

for (const q of questions) {
  const res = await fetch(URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ question: q }),
  });

  if (!res.ok) {
    console.error(`FAILED (${res.status}): ${q}`);
    continue;
  }

  const done = parseDone(await res.text());
  if (!done || done.promptTokens == null || done.completionTokens == null) {
    console.error(`No usage data for: ${q}`);
    continue;
  }

  const cost =
    (done.promptTokens * IN_PRICE + done.completionTokens * OUT_PRICE) / 1e6;

  latencies.push(done.latencyMs);
  costs.push(cost);
  rows.push(
    [
      `"${q.replaceAll('"', '""')}"`,
      done.model,
      done.promptTokens,
      done.completionTokens,
      Math.round(done.ttftMs ?? 0),
      Math.round(done.latencyMs),
      cost.toFixed(6),
    ].join(','),
  );
  console.log(
    `ok  ${Math.round(done.latencyMs)}ms  $${cost.toFixed(6)}  ${q}`,
  );
}

latencies.sort((a, b) => a - b);
const avgCost = costs.reduce((a, b) => a + b, 0) / (costs.length || 1);

writeFileSync('baseline-results.csv', rows.join('\n'));

console.log('\n--- Summary ---');
console.log(`Queries ok: ${latencies.length}/${questions.length}`);
console.log(`P50 latency: ${Math.round(percentile(latencies, 0.5))} ms`);
console.log(`P95 latency: ${Math.round(percentile(latencies, 0.95))} ms`);
console.log(`Avg cost/query: $${avgCost.toFixed(6)}`);
console.log('Saved: baseline-results.csv');
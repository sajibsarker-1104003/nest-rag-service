# Benchmarks

Cost and latency baseline for `POST /ai/ask/stream`. Produced with `scripts/baseline.ts` (see [testing](testing.md)).

## Setup
| Item | Value |
| ---- | ----- |
| Chat model | openai/gpt-oss-120b |
| Provider | Groq |
| Embedding model | deepvk/USER-bge-m3 (local) |
| top-k | 5 |
| Similarity threshold | none |
| Documents in DB | 4 (small test set) |
| Input price | TODO USD per 1M tokens |
| Output price | TODO USD per 1M tokens |

## Smoke test (single query, via Swagger)
Question: "How long does express delivery take and what does it cost?"

| Metric | Value |
| ------ | ----- |
| promptTokens | 212 |
| completionTokens | 81 (the answer itself is about 20 tokens; the rest is hidden reasoning) |
| ttftMs | about 1388 |
| latencyMs | about 1467 |

This is one query, not a baseline.

## Baseline (10 queries)
TODO: run `yarn baseline` and fill in the results.

| Metric | Value |
| ------ | ----- |
| Queries ok | TODO / 10 |
| P50 latency | TODO ms |
| P95 latency | TODO ms |
| Average cost per query | TODO USD |
| Average prompt tokens | TODO |
| Average completion tokens | TODO |

Raw results: `baseline-results.csv` (not committed).

## Assessment criteria
- TODO: run the module for 2 weeks in a test environment and check for memory leaks.
- TODO: record P95 latency and per-query cost after the threshold and chunking changes, and compare with this baseline.

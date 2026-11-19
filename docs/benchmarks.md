# Benchmarks

Cost and latency baseline for `POST /ai/ask/stream`. Produced with `scripts/baseline.ts` (see [testing](testing.md)). Date of run: 2026-11-19.

## Setup
| Item | Value |
| ---- | ----- |
| Chat model | openai/gpt-oss-120b |
| Provider | Groq |
| Embedding model | deepvk/USER-bge-m3 (local) |
| top-k | 5 |
| Similarity threshold | cosine distance <= 0.45 (`RAG_MAX_DISTANCE`) |
| Documents in DB | small test set (refund, shipping and support documents) |
| Input price | 0.15 USD per 1M tokens (check against the provider's current pricing) |
| Output price | 0.60 USD per 1M tokens (check against the provider's current pricing) |
| Machine | local development machine, one request at a time |

## Baseline (10 on-topic queries, threshold 0.45)
| Metric | Value |
| ------ | ----- |
| Queries ok | 10 / 10 |
| P50 latency | 813 ms |
| P95 latency | 1285 ms |
| Average latency | about 885 ms |
| Average prompt tokens | 141 |
| Average completion tokens | 86 |
| Average cost per query | 0.000073 USD (about 0.07 USD per 1,000 queries) |

With only 10 queries, P95 is the slowest single query, so treat it as a rough number.

### Per query
| Question | Top distance | Latency (ms) | Cost (USD) |
| -------- | ------------ | ------------ | ---------- |
| How many days do I have to get a refund? | 0.246 | 783 | 0.000057 |
| What happens after 30 days for refunds? | 0.229 | 813 | 0.000065 |
| How long does standard delivery take? | 0.341 | 686 | 0.000052 |
| How much extra is express delivery? | 0.356 | 884 | 0.000052 |
| What are the support hours? | 0.297 | 798 | 0.000065 |
| Which days is support available? | 0.283 | 782 | 0.000062 |
| What is the support email? | 0.315 | 860 | 0.000053 |
| Can I get store credit instead of a refund? | 0.254 | 1285 | 0.000161 |
| Is express delivery available in Bangladesh? | 0.260 | 1011 | 0.000100 |
| What time zone does support use? | 0.411 | 945 | 0.000063 |

The most expensive and slowest query ("store credit") is worth checking in `baseline-results.csv` for its prompt and completion token split. `gpt-oss-120b` is a reasoning model, so output tokens include hidden reasoning.

## Off-topic queries (threshold check)
All 4 off-topic questions were filtered out: no document was within the threshold, so the service answered `No relevant documents found.` without calling the LLM (no token cost).

| Question | Result |
| -------- | ------ |
| What is the capital of France? | filtered |
| Who won the 2022 World Cup? | filtered |
| How do I bake a chocolate cake? | filtered |
| Explain quantum computing in one sentence. | filtered |

## Threshold notes
- On-topic top distances ranged from 0.229 to 0.411. In earlier manual tests, unrelated documents had distances of 0.51 and above.
- The threshold of 0.45 sits between those two groups, but the margin above the highest on-topic query (0.411, "time zone") is only about 0.04. A differently phrased question could be filtered by mistake.
- The distances of the filtered off-topic documents were not recorded, so the lower end of the "unrelated" range is based on the earlier manual tests only.
- Smoke test before the threshold (one query, 4 documents sent as context): 212 prompt tokens. Average prompt tokens with the threshold: 141. These are different questions, so this is a hint, not a controlled comparison.

## Limitations of this baseline
- No run with the threshold disabled, so there is no controlled before/after comparison yet.
- Small document set and only 10 queries.
- Sequential requests only; no load test.

## Next
- TODO: log the distances of filtered documents to tune the threshold with more data.
- TODO: repeat the baseline after chunking and compare.
- TODO: run the module for 2 weeks in a test environment and check memory use, P95 latency and cost.

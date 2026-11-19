# Testing

| Type | Command |
| ---- | ------- |
| Unit | `yarn test` |
| E2E  | `yarn test:e2e` |
| Coverage | `yarn test:cov` |
| Cost and latency baseline | `yarn baseline` |

TODO: how e2e tests get a database (Docker Compose, test DB, etc.).

## Manual testing with Swagger
1. Call the login endpoint, copy the `access_token`, click **Authorize** and paste it (no `Bearer` prefix).
2. Ingest a few documents with `POST /ai/documents`:
   ```json
   { "content": "Our refund policy: customers can request a full refund within 30 days of purchase. After 30 days, only store credit is offered." }
   ```
3. Ask with `POST /ai/ask`:
   ```json
   { "question": "How many days do I have to get a refund?" }
   ```
   Expected: an answer that uses the document, and `sources` sorted by ascending distance (closest first).
4. Ask with `POST /ai/ask/stream` using the same body. Expected: `sources`, then many `token` events, then `done` with token counts and latency.

Swagger UI shows the streamed response only after it has finished. To see tokens arrive one by one:
```bash
curl -N -X POST http://localhost:8080/ai/ask/stream \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"question":"How long does express delivery take?"}'
```

### Edge cases to check
| Case | Expected |
| ---- | -------- |
| No or invalid JWT | `401`, normal JSON error, not an SSE stream |
| Question unrelated to the documents | Model says it does not know (until a similarity threshold exists, unrelated documents are still sent as context) |
| Empty documents table | `sources` is empty and the answer is `No relevant documents found.` |
| Client disconnects during a stream (Ctrl+C in curl) | No server error, upstream LLM request is aborted |

## Baseline script
`scripts/baseline.ts` sends a fixed list of questions to `/ai/ask/stream`, reads token usage and latency from the `done` event, and prints P50, P95 and average cost per query. It writes `baseline-results.csv`.

```bash
TOKEN=<jwt> IN_PRICE_PER_M=<usd> OUT_PRICE_PER_M=<usd> yarn baseline
```
Results are recorded in [benchmarks](benchmarks.md).

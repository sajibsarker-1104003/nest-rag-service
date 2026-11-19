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
   Expected: an answer that uses the document, and `sources` with only the documents within the distance threshold, closest first.
4. Ask with `POST /ai/ask/stream` using the same body. Expected: status 200, `sources`, then many `token` events, then `done` with token counts and latency.

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
| Empty, whitespace-only, missing or non-string `question` / `content` | `400` with a validation message, also for `/ai/ask/stream` (before the stream starts) |
| Question unrelated to the documents | `sources: []` and `No relevant documents found.`, no chat model call |
| Empty documents table | Same as above |
| Client disconnects during a stream (Ctrl+C in curl) | No server error, upstream LLM request is aborted |

## Baseline script
`scripts/baseline.ts` sends two groups of questions to `/ai/ask/stream`:
- **On-topic** questions about the ingested documents. It reads token usage and latency from the `done` event and prints P50, P95, average tokens and average cost per query.
- **Off-topic** questions. It only records the top distance. With the threshold on, they are filtered, so no usage is reported; this is expected, not a failure.

It writes `baseline-results.csv` (not committed).

```bash
TOKEN=<jwt> IN_PRICE_PER_M=<usd> OUT_PRICE_PER_M=<usd> yarn baseline
```
If an on-topic question shows `NO USAGE`, the script prints the start of the raw response. Typical causes: no document within the threshold (raise `RAG_MAX_DISTANCE` or check the question), or an `error` event from the chat provider. Edit the question lists at the top of the script to match your own documents.

Results are recorded in [benchmarks](benchmarks.md).

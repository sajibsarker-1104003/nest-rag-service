# ADR-0006: Filter retrieved documents by maximum cosine distance

- Status: Accepted
- Date: 2026-11-19

## Context
Retrieval returned the 5 nearest documents for every question, even when none were related. Those unrelated documents were sent to the chat model as context, which cost tokens and could confuse the answer. In manual tests, related documents had a cosine distance of about 0.23 to 0.41 and unrelated documents 0.51 or more.

## Decision
After the pgvector search, drop every document whose cosine distance is greater than `RAG_MAX_DISTANCE` (default 0.45). If no document is left, return `No relevant documents found.` without calling the chat model. The filter is in `AiService.retrieve()`, so both `/ai/ask` and `/ai/ask/stream` use it.

## Consequences
- Unrelated questions cost no chat tokens. In the baseline run, all 4 off-topic questions were filtered.
- The `sources` field only lists documents that were actually used.
- The threshold depends on the embedding model and the documents. Changing either one needs a re-tune.
- The margin is small: the highest on-topic distance seen was 0.411, against a threshold of 0.45. A rephrased question can be filtered by mistake.
- The filter runs in application code after the query, so the database still scans for the 5 nearest rows. Moving it into SQL is possible later.
- TODO: log the distances of filtered documents and tune the value on a larger evaluation set.

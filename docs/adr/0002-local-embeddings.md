# ADR-0002: Generate embeddings with a local model

- Status: Accepted
- Date: 2026-11-18

## Context
Embeddings are needed for every ingested document and every question.

## Decision
Run an OpenAI-compatible embedding server locally and call it with the OpenAI SDK (EMBEDDING_BASE_URL). Model: deepvk/USER-bge-m3 (1024 dimensions). The service rejects vectors whose length is not 1024.

## Consequences
- No per-request embedding cost and document text stays on our infrastructure.
- Requires hosting and resourcing the embedding server.
- Retrieval quality depends on the model. TODO: record why this model was chosen and how it performs on the target language.
- Because the client is OpenAI-compatible, the model or provider can be swapped by configuration, provided it outputs 1024 dimensions.

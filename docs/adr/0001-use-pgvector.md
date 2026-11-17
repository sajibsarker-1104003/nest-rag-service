# ADR-0001: Use PostgreSQL with pgvector for vector storage

- Status: Accepted
- Date: 2026-11-18

## Context
The service needs similarity search over document embeddings (1024 dimensions) and already needs PostgreSQL for relational data.

## Decision
Store embeddings in PostgreSQL using pgvector, with cosine distance for ranking. Prisma 8 models this as `Embedding1024 = pgvector.Vector(1024)`.

## Consequences
- One technology to run and back up; no separate vector database.
- Query uses standard SQL operators via Prisma's query builder.
- Performance at scale depends on a vector index (HNSW/IVFFlat). TODO: confirm and document.
- Dimension is fixed at 1024, so changing the embedding model needs a migration and re-embedding.

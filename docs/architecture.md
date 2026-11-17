# Architecture

## Components
- **NestJS API**: HTTP layer, JWT auth, validation
- **Embedding model (local)**: TODO name, dimensions
- **PostgreSQL + pgvector**: stores documents, chunks, and vectors

## Ingestion flow
```mermaid
sequenceDiagram
  participant C as Client
  participant A as NestJS API
  participant E as Local embeddings
  participant D as PostgreSQL + pgvector
  C->>A: Upload document (JWT)
  A->>A: Split into chunks
  A->>E: Generate embeddings
  E-->>A: Vectors
  A->>D: Store chunks + vectors
  A-->>C: Ingestion result
```

## Query flow
```mermaid
sequenceDiagram
  participant C as Client
  participant A as NestJS API
  participant E as Local embeddings
  participant D as PostgreSQL + pgvector
  C->>A: Ask question (JWT)
  A->>E: Embed question
  E-->>A: Query vector
  A->>D: Similarity search (top-k)
  D-->>A: Relevant chunks
  A-->>C: Result / answer
```

## Retrieval parameters
| Parameter | Value |
| --------- | ----- |
| Chunk size / overlap | TODO |
| Embedding model / dimensions | TODO |
| Similarity metric | TODO (cosine / L2 / inner product) |
| Vector index | TODO (HNSW / IVFFlat) |
| top-k | TODO |

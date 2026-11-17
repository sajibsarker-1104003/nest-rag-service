# Configuration

All settings come from environment variables. Copy `.env.example` to `.env`. Never commit `.env`.

| Variable | Required | Description | Default |
| -------- | -------- | ----------- | ------- |
| USERS_DATABASE_URL | yes | PostgreSQL for users | none |
| DOCS_DATABASE_URL | yes | PostgreSQL with pgvector for documents | none |
| JWT_SECRET | yes | Secret used to sign JWTs; use a long random value | none |
| PORT | no | HTTP port | 8080 (set in .env.example) |
| EMBEDDING_BASE_URL | no | OpenAI-compatible embeddings server | http://localhost:8091/v1 |
| EMBEDDING_MODEL | no | Embedding model; must output 1024 dimensions | deepvk/USER-bge-m3 |
| CHAT_BASE_URL | no | OpenAI-compatible chat endpoint | https://api.groq.com/openai/v1 |
| CHAT_API_KEY | yes | API key for the chat provider | none |
| CHAT_MODEL | no | Chat model | llama-3.3-70b-versatile (code fallback) |
| OBSERVE_APP_KEY / OBSERVE_APP_SECRET | no | NestJS Observe telemetry | none |

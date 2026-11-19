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
| CHAT_MODEL | no | Chat model. Set it explicitly (see note below) | llama-3.3-70b-versatile (code fallback) |
| OBSERVE_APP_KEY / OBSERVE_APP_SECRET | no | NestJS Observe telemetry | none |

## Note on `CHAT_MODEL`
The code falls back to `llama-3.3-70b-versatile` when `CHAT_MODEL` is not set, but the documented and tested model is `openai/gpt-oss-120b`. Always set `CHAT_MODEL` explicitly in `.env` and `.env.example`, otherwise cost and latency numbers (see [benchmarks](benchmarks.md)) refer to a different model than expected.

```
CHAT_MODEL=openai/gpt-oss-120b
```

## Variables for the baseline script
`scripts/baseline.ts` reads these from the shell, not from `.env`:

| Variable | Required | Description | Default |
| -------- | -------- | ----------- | ------- |
| TOKEN | yes | JWT used to call `/ai/ask/stream` | none |
| IN_PRICE_PER_M | yes | Input price in USD per 1M tokens | none |
| OUT_PRICE_PER_M | yes | Output price in USD per 1M tokens | none |
| URL | no | Stream endpoint to call | http://localhost:8080/ai/ask/stream |

# ADR-0005: Stream answers over Server-Sent Events

- Status: Accepted
- Date: 2026-11-19

## Context
LLM answers take seconds to generate. Returning the full answer in one response makes the client wait with no feedback. Clients also need the sources and the token usage of each request, and we need per-request cost and latency data for a baseline.

## Decision
Add `POST /ai/ask/stream`, protected by `JwtAuthGuard`, that streams the answer as Server-Sent Events (`text/event-stream`).

- Events: `sources` (first), `token` (many), `done` (model, token usage, `ttftMs`, `latencyMs`), `error`.
- The chat call uses `stream: true` with `stream_options: { include_usage: true }`.
- If the client disconnects, the upstream LLM request is aborted through an `AbortController`.
- The existing `POST /ai/ask` stays for clients that want one JSON response.
- SSE was chosen over WebSocket because the data flows in one direction only and SSE works over plain HTTP, so the existing JWT guard and proxies keep working.

## Consequences
- Lower time to first token for the user. Token usage and latency are logged for every streamed request.
- NestJS `@Sse()` supports only GET, so the endpoint uses `@Res()` and writes events manually. The question is sent in a POST body.
- Errors raised before the stream starts (auth, validation) are normal HTTP errors. Errors after it starts can only be sent as an `error` event.
- Reverse proxies must not buffer the response; the endpoint sends `X-Accel-Buffering: no`.
- With a reasoning model such as `openai/gpt-oss-120b`, the first token can arrive late because of reasoning time. `ttftMs` is close to `latencyMs`.
- Swagger UI cannot show tokens arriving; use `curl -N`.

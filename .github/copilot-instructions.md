# Copilot instructions

See AGENTS.md for project conventions. Additionally:
- Stack: NestJS, Prisma, PostgreSQL + pgvector, Vitest, yarn
- TypeScript strict; no `any`
- Controllers thin; logic in services
- New endpoints need a DTO with validation and tests
- Conventional commits (feat:, fix:, docs:, chore:)

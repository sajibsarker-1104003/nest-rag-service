# Contributing

## Workflow
1. Create a branch from `main`: `feat/...`, `fix/...`, `docs/...`
2. Use Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`
3. Run lint, tests, and build locally before opening a PR
4. Open a PR using the template; keep PRs small and focused

## Standards
- TypeScript strict; avoid `any`
- Controllers stay thin; business logic lives in services
- New endpoints need a validated DTO and tests
- Significant technical decisions get an ADR in `docs/adr/`

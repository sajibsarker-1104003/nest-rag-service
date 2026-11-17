# ADR-0003: Separate databases and Prisma configs for users and documents

- Status: Accepted
- Date: 2026-11-18

## Context
User accounts and vectorized documents have different needs: only the docs database requires the pgvector extension, and the two data sets are not related by foreign keys.

## Decision
Use two databases, each with its own Prisma config, contract and migrations (prisma.users.config.ts, prisma.docs.config.ts).

## Consequences
- Independent migrations, scaling and backup policy per database.
- No cross-database foreign keys, so ownership of documents cannot be enforced by the database alone.
- Two connection strings to manage (USERS_DATABASE_URL, DOCS_DATABASE_URL).
- TODO: add the original reason for the split if it differs from the above.

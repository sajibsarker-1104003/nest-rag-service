# ADR-0004: JWT authentication with bcrypt password hashing

- Status: Accepted
- Date: 2026-11-18

## Context
The API needs stateless authentication.

## Decision
Passwords are hashed with bcryptjs (cost factor 10). Login returns a signed JWT with payload { sub: userId, email }. The signing secret comes from JWT_SECRET.

## Consequences
- Stateless, simple to scale horizontally.
- Tokens cannot be revoked before expiry unless a denylist is added. TODO: document token expiry.
- JWT_SECRET must be long and random; never commit it.

---
paths:
  - "src/auth/**"
  - "src/api/**"
  - "src/middleware/**"
  - "**/auth*"
  - "**/login*"
  - "**/password*"
  - "**/token*"
  - "**/session*"
---

# Security Rules — Auth & API

These rules apply when working in authentication, API, or middleware code.

## Mandatory Checks Before Any Change

- [ ] Who calls this code? Is authentication required before reaching it?
- [ ] What data does this code return? Could it expose more than intended?
- [ ] Does user input reach this code? Is it validated and sanitized?

## Input Validation

- Validate all user input at the boundary — before it enters business logic
- Use allowlists (permitted values), not denylists (blocked values)
- Never trust client-supplied IDs for authorization — always verify server-side

## SQL Safety

- Always use parameterized queries or prepared statements
- Never concatenate user input into SQL strings
- Log failed auth attempts — never log passwords or tokens

## Auth Patterns

- Verify authentication before authorization
- Authorization checks must happen server-side, never trust client state
- Use constant-time comparison for secrets and tokens
- Invalidate sessions on logout — do not rely only on token expiry

## Secrets

- Never log secrets, passwords, tokens, or PII
- Never return secrets in API responses
- Store secrets in environment variables, never in code or config files committed to git

## Response Safety

- Return generic error messages to clients on auth failure ("Invalid credentials")
- Log detailed errors server-side only
- Do not reveal whether a user exists on login failure (prevents enumeration)

---
name: security-and-hardening
description: Use when touching authentication, authorization, payment flows, file I/O, shell command construction, user input handling, or any code in security-sensitive paths. Auto-triggers on changes to auth/, payments/, or any file importing crypto, jwt, bcrypt, or stripe.
---

# Security & Hardening

OWASP Top 10 + dependency hygiene. Default-deny, validate at boundaries.

## Always-on checklist

When touching any user-input path:

### Input validation
- Validate at the boundary (HTTP handler, CLI parser, message receiver)
- Whitelist over blacklist (specify what's allowed, reject the rest)
- Reject early, before any side effect
- Don't validate twice — internal callers can trust validated input

### Output encoding
- HTML output → escape via framework's built-in (never string concat)
- SQL → parameterized queries, never string interpolation
- Shell → use array form (`exec(["cmd", arg1])`) never `exec(f"cmd {arg}")`
- JSON → use the library, don't hand-build
- File paths → resolve + check still inside allowed root (no `..` escape)

### Authentication
- Secrets via environment / secret manager, never in source
- Tokens have expiry — enforce server-side
- Compare tokens with constant-time compare (`timingSafeEqual`)
- Hash passwords with bcrypt/argon2, not SHA/MD5
- Don't log tokens, sessions, or password fields

### Authorization
- Check authorization on **every** mutating endpoint (not just routes — handlers)
- Default-deny: explicit allow per role/scope
- Don't trust client-supplied user IDs — derive from session
- Don't return 200 for unauthorized — return 403 (or 404 to prevent enumeration)

### Dependencies
- Run `npm audit` / `pip-audit` / `cargo audit` on PRs
- Pin direct dependencies (caret OK, but lockfile committed)
- Review transitive deps when count or weight surprises you
- Subscribe to advisories for security-critical packages (auth, crypto, parsers)

## Common pitfalls

| Pattern | Why it's bad | Fix |
|---|---|---|
| `eval(userInput)` | Arbitrary code execution | Never. Refactor the design. |
| `exec(f"cmd {userInput}")` | Shell injection | Array form: `exec(["cmd", userInput])` |
| `db.query(f"SELECT * WHERE id={id}")` | SQL injection | Parameterized: `db.query("... WHERE id=?", [id])` |
| `redirect(req.query.url)` | Open redirect | Whitelist allowed destinations |
| `path.join(root, req.params.file)` | Path traversal | Resolve + check inside `root` |
| Comparing secrets with `==` | Timing attack | `crypto.timingSafeEqual` or equivalent |
| `console.log(token)` for "debugging" | Leak in logs | Don't. Even temporarily. |

## When to escalate

- Anything touching payment flows → independent review (`security-reviewer` agent)
- New cryptographic code → don't roll your own, use a vetted library
- New auth / session logic → review against the framework's docs, not memory
- Significant dependency added → check its maintainer status + recent advisories

## Anti-rationalization

| Excuse | Counter |
|---|---|
| "It's just an internal tool" | Internal users go rogue. Internal tools get exposed. Validate anyway. |
| "The framework handles that" | Verify. Frameworks have CVEs too. |
| "I'll add auth later" | Auth-later is auth-never. Add it now. |
| "This is a one-off script" | One-off scripts get rerun in CI six months later. Harden now. |

## Done when

- All inputs validated at the boundary
- All outputs encoded for their sink
- Auth + authz checked on mutating paths
- No secrets in source, no secrets in logs
- Dependencies audit-clean

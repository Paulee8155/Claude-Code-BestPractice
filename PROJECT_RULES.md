# PROJECT_RULES.md — Project-Specific Rules

This file extends `CLAUDE.md` with project-specific conventions.
Copy this template into each new project and fill in the relevant sections.
Delete sections that do not apply.

---

## Project Identity

```
Project Name:    [e.g. MyApp]
Project Type:    [webapp | api | cli | library | automation | internal-tool | saas]
Primary Language: [e.g. TypeScript, Python, Go]
Status:          [active | maintenance | MVP | prototype]
```

---

## Tech Stack

Fill in `.claude/templates/tech-stack.md` with the full stack details.
Reference here only what Claude must know to work correctly.

```
Runtime:         [e.g. Node.js 20, Python 3.12, Go 1.22]
Framework:       [e.g. Next.js 14, FastAPI, Gin]
Database:        [e.g. PostgreSQL 16, SQLite, MongoDB]
ORM/Query:       [e.g. Prisma, SQLAlchemy, GORM]
Auth:            [e.g. Clerk, Auth.js, custom JWT]
Deployment:      [e.g. Vercel, Railway, Docker + VPS]
Package manager: [e.g. npm, pnpm, poetry, go mod]
```

---

## Repository Structure

Describe the top-level directories and their purpose.
Only list directories that are non-obvious.

```
src/             [main application code]
tests/           [test suite]
docs/            [documentation]
scripts/         [utility scripts]
```

---

## Naming Conventions

```
Files:           [e.g. kebab-case, snake_case, PascalCase]
Components:      [e.g. PascalCase React components]
Functions:       [e.g. camelCase]
Database tables: [e.g. snake_case, plural]
CSS classes:     [e.g. BEM, Tailwind utilities only]
```

---

## Code Style

```
Indentation:     [e.g. 2 spaces, 4 spaces, tabs]
Line length:     [e.g. 100 characters]
Formatter:       [e.g. Prettier, Black, gofmt]
Linter:          [e.g. ESLint, Ruff, golangci-lint]
Type checking:   [e.g. TypeScript strict mode, mypy]
```

---

## Testing

```
Framework:       [e.g. Vitest, Jest, pytest, Go testing]
Command:         [e.g. npm test, pytest, go test ./...]
Coverage target: [e.g. 80%]
Test location:   [e.g. co-located *.test.ts, tests/ directory]
```

Required before every commit:
- [ ] All tests pass
- [ ] No new type errors
- [ ] Linter clean

---

## Environment

```
Required env vars:
  DATABASE_URL   — PostgreSQL connection string
  [VAR_NAME]     — [description]

Dev setup:       [e.g. cp .env.example .env, then npm install]
Start command:   [e.g. npm run dev]
```

---

## Sensitive Areas

List code areas that require extra care:

- `[path/to/auth]` — authentication logic, security-critical
- `[path/to/payments]` — payment processing, never touch without tests
- `[path/to/migrations]` — database migrations, always reversible

---

## External Services

List integrated external services Claude should know about:

| Service | Purpose | Docs |
|---|---|---|
| [e.g. Stripe] | [e.g. Payments] | [URL] |
| [e.g. Sendgrid] | [e.g. Email] | [URL] |

---

## Project-Specific Rules

Add any rules that override or extend the base CLAUDE.md here.

Example:
- All API routes must be documented in `docs/api.md` after changes.
- Database migrations must be reversible (always include a `down` migration).
- Do not use `any` type in TypeScript — use `unknown` and narrow.
- Feature flags are in `src/config/flags.ts` — check before implementing new features.

---

## Known Issues / Constraints

Document known technical debt or constraints Claude should work around:

- [e.g. The auth module uses an old pattern — do not refactor without a separate task]
- [e.g. CI is slow — do not rely on CI to catch issues, run tests locally]

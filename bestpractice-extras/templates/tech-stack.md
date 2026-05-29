# Tech Stack — [Project Name]

Fill in this template when starting a new project. Reference it from `PROJECT_RULES.md`.

---

## Runtime & Language

| Field | Value |
|---|---|
| Language | [TypeScript / Python / Go / Rust / ...] |
| Runtime | [Node.js 20 / Python 3.12 / Go 1.22 / ...] |
| Package manager | [npm / pnpm / yarn / poetry / pip / go mod / ...] |
| Monorepo tool | [Turborepo / Nx / none] |

---

## Framework & Libraries

| Layer | Technology | Version |
|---|---|---|
| Web framework | [Next.js / FastAPI / Express / Gin / ...] | [x.y] |
| UI components | [shadcn/ui / MUI / Tailwind / ...] | [x.y] |
| State management | [Zustand / Redux / none] | [x.y] |
| Form handling | [react-hook-form / Formik / ...] | [x.y] |
| HTTP client | [fetch / axios / ky / httpx / ...] | [x.y] |

---

## Data

| Layer | Technology | Version |
|---|---|---|
| Database | [PostgreSQL / MySQL / SQLite / MongoDB / ...] | [x.y] |
| ORM / Query builder | [Prisma / Drizzle / SQLAlchemy / GORM / ...] | [x.y] |
| Migrations | [Prisma / Alembic / golang-migrate / ...] | [x.y] |
| Cache | [Redis / Valkey / none] | [x.y] |
| File storage | [S3 / Cloudflare R2 / local / ...] | — |

---

## Auth & Security

| Layer | Technology |
|---|---|
| Auth provider | [Clerk / Auth.js / custom / ...] |
| Session storage | [JWT / database sessions / cookies] |
| Role system | [RBAC / ABAC / none] |

---

## Infrastructure

| Layer | Technology |
|---|---|
| Hosting | [Vercel / Railway / Fly.io / AWS / VPS / ...] |
| CI/CD | [GitHub Actions / GitLab CI / ...] |
| Containerization | [Docker / none] |
| Secrets management | [Vault / AWS Secrets / .env files] |
| Monitoring | [Sentry / Datadog / none] |
| Logging | [Pino / Winston / structlog / ...] |

---

## Testing

| Layer | Technology | Command |
|---|---|---|
| Unit tests | [Vitest / Jest / pytest / go test] | [npm test] |
| Integration tests | [same / Supertest / httptest] | [npm run test:int] |
| E2E tests | [Playwright / Cypress / none] | [npm run test:e2e] |
| Type checking | [tsc / mypy / none] | [npm run typecheck] |
| Linting | [ESLint / Ruff / golangci-lint] | [npm run lint] |

---

## Key Commands

```bash
# Install dependencies
[npm install / pip install / go mod download]

# Start development server
[npm run dev / uvicorn app:main --reload / go run .]

# Run tests
[npm test / pytest / go test ./...]

# Build for production
[npm run build / python -m build / go build .]

# Lint
[npm run lint / ruff check . / golangci-lint run]
```

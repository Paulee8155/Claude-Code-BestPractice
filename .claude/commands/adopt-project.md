---
description: Analyze the existing codebase and fill PROJECT_RULES.md, state/, and rules from real project facts.
---

# /adopt-project

You are adopting an EXISTING codebase into this harness. Your job: read the actual project, then fill the harness templates with **real, verified facts** — never placeholders, never guesses.

## What to do

### Step 1 — Discover the project

Read these in order (skip what doesn't exist):
- `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `Gemfile`, `composer.json`, `pom.xml`, `build.gradle` — primary stack signals
- `README.md`, `CONTRIBUTING.md`, `docs/` — purpose, conventions
- `.github/workflows/`, `.gitlab-ci.yml`, `Makefile`, `Dockerfile` — build/test/deploy commands
- `.eslintrc*`, `.prettierrc*`, `pyproject.toml [tool.ruff]`, `rustfmt.toml` — code style
- `tsconfig.json`, `mypy.ini` — type system rules
- Top-level directory layout (depth 2)
- `.env.example`, `.env.sample` — required env vars
- Existing `CLAUDE.md` files in the project (if any)
- Any backup at `.harness-backup/` (previous CLAUDE.md / state — preserve user's prior context)

Use `Glob` and `Read`. Do not run code. Read enough to be confident, not exhaustively.

### Step 2 — Fill PROJECT_RULES.md

Open `PROJECT_RULES.md`. Replace every `[bracketed placeholder]` with a verified value from Step 1.

Rules:
- **No guesses.** If you can't determine a field from the codebase, ask the user one specific question (e.g. "I see a Stripe SDK import — confirm payments are critical to flag in Sensitive Areas?")
- **Delete sections that don't apply.** If the project has no DB, remove the DB row. If no external services, remove that section.
- **Sensitive Areas:** identify auth, payments, migrations, secrets-handling code by grepping for telltale imports (`stripe`, `auth`, `bcrypt`, `jwt`, `migration`, `crypto`).
- **Project-Specific Rules:** infer 3-5 concrete rules from the codebase patterns (e.g. if all routes are in `src/api/`, write that as a rule; if tests are co-located, document that).
- **Known Issues:** check for `TODO`, `FIXME`, `HACK`, `XXX` in code — pick the 3 most significant for the harness to know about.

### Step 3 — Fill state/context.md

Replace the template with:
- **What is this project?** 2-3 sentences derived from README + package.json description
- **Current focus:** check `git log -20 --oneline` for recent themes; if unclear, ask
- **Recent decisions:** check for `docs/adr/` or `docs/decisions/` — link them; if none, leave a stub

### Step 4 — Add project-specific .claude/rules/

For each major area you found, create a focused rule file at `.claude/rules/<area>.md` with frontmatter:

```yaml
---
paths:
  - "src/api/**"
---
```

Examples worth creating only if the project actually has them:
- `api-routes.md` — naming conventions, response shapes, error handling
- `database.md` — migration rules, query patterns
- `frontend.md` — component conventions, state management
- `testing.md` — test layout, fixtures, what to mock

**Do not create rules for areas the project doesn't have.** Empty rules are noise.

### Step 5 — Restore prior context

If `.harness-backup/<timestamp>/` exists:
- Compare the user's old `CLAUDE.md` against the harness one. Anything custom (project-specific instructions, not generic harness rules) → merge into `PROJECT_RULES.md` "Project-Specific Rules" section.
- If old `state/` had real content (not template stubs), merge it into the new `state/` files.

### Step 6 — Report

Tell the user:
- Which files you filled and what values you used
- Which fields you guessed vs verified (be honest)
- Open questions you couldn't answer from the code (max 5, ranked by importance)
- Suggested next step (usually: review PROJECT_RULES.md, then start working)

## Don't

- Don't invent stack components that aren't in the dependency files
- Don't write rules contradicting existing project conventions
- Don't delete files outside the harness — only modify harness templates
- Don't run tests, builds, or installs as part of adoption
- Don't skip the backup-merge step if `.harness-backup/` exists

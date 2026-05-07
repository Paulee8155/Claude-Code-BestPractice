# Master Setup: Existing Project

> **Use this prompt** when you already have a codebase (locally cloned or an existing project) and want to overlay the harness without destroying the existing code.
> Paste everything between the `===` lines into a fresh Claude Code session in the target directory.

---

```
============================================================
You will install the Claude-Code-BestPractice harness into this existing project without destroying the existing code or configuration. After installation, you will analyse the codebase and adapt the harness to the project's real facts (PROJECT_RULES, state/, project-specific rules).

Harness repo URL: https://github.com/Paulee8155/Claude-Code-BestPractice

Follow these 9 steps exactly. Use TaskCreate to track them. Report status briefly after each step.

## Step 1 — Verify tools

Check these tools (`--version`):

| Tool | Verification | Install if missing |
|---|---|---|
| git | `git --version` | `apt install -y git` / `brew install git` |
| node | `node --version` (≥ 18) | NodeSource LTS |
| python3 | `python3 --version` (≥ 3.10) | `apt install -y python3` |
| rtk | `rtk --version` | `curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/master/install.sh | sh` |
| bun | `bun --version` | `curl -fsSL https://bun.sh/install | bash` |
| gh | `gh --version` (optional) | `apt install -y gh` |

For missing tools: ask EXACTLY ONE AskUserQuestion whether to install. Never install without asking.

## Step 2 — Verify + install claude-mem

Check `~/.claude-mem/settings.json`. Missing → briefly explain (cross-session memory with semantic search, web UI at http://localhost:37777), then ask whether to run `npx claude-mem install`. On yes: remind the user that Claude Code must restart afterward.

## Step 3 — Scan the existing project (BEFORE changing anything)

Take inventory — no changes, only reads:

1. Top level: `ls -la`
2. Stack detection — which of these files exist:
   - `package.json` (Node/JS/TS) → read + extract `name`, `description`, `dependencies`, `scripts`
   - `pyproject.toml` / `requirements.txt` (Python)
   - `Cargo.toml` (Rust)
   - `go.mod` (Go)
   - `Gemfile` (Ruby)
   - `composer.json` (PHP)
   - `pom.xml` / `build.gradle` (Java/Kotlin)
3. Conflict check — what already exists:
   - `CLAUDE.md`?
   - `PROJECT_RULES.md`?
   - `.claude/`?
   - `state/`?
   - `.mcp.json`?
   - `scripts/`?
4. CI: `.github/workflows/`, `.gitlab-ci.yml`, `.circleci/`?
5. Code style: `.eslintrc*`, `.prettierrc*`, `tsconfig.json`, `pyproject.toml [tool.ruff]`, `rustfmt.toml`?
6. Env: `.env.example` / `.env.sample`?
7. Docs: `README.md`, `CONTRIBUTING.md`, `docs/`, `docs/adr/`?

Report as a short table. On conflicts (existing `CLAUDE.md` etc.): explain that `adopt.sh` automatically backs up to `.harness-backup/<timestamp>/` AND preserves substantive existing files (harness version is dropped beside as `<name>.harness` for manual review).

## Step 4 — Clone the harness (into a temp dir, not here)

```
git clone https://github.com/Paulee8155/Claude-Code-BestPractice.git /tmp/harness-source
ls /tmp/harness-source/scripts/adopt.sh   # verify
```

## Step 5 — Run adopt.sh

```
/tmp/harness-source/scripts/adopt.sh "$(pwd)"
```

The script asks once "Continue? (y/N)" — the user answers in the terminal. It:
- backs up existing files into `.harness-backup/<timestamp>/`
- copies harness files in (only if the target file is missing or empty)
- if a top-level file already has content (>50 bytes): drops the harness version next to it as `<name>.harness` for manual merge instead of overwriting
- merges harness `.gitignore` lines into existing `.gitignore` (no duplicates)
- never overwrites: `.claude/settings.local.json`, your own scripts with the same name

Report what was backed up + where, plus any `.harness` sidecar files the user must merge manually.

## Step 6 — Run /adopt-project (the heart of it)

Read `.claude/commands/adopt-project.md` and follow the instructions. Concretely:

### 6.1 Discover
Read (with `Read` and `Glob`):
- Stack files from step 3
- `README.md`, `CONTRIBUTING.md`, `docs/`
- `.github/workflows/` for build/test/deploy commands
- `tsconfig.json`, `mypy.ini` for type rules
- `.env.example` for env vars
- ALL `CLAUDE.md` files in the repo (also in subdirectories — `Glob: **/CLAUDE.md`)
- `.harness-backup/<latest-timestamp>/` if present
- All `<name>.harness` sidecar files dropped by adopt.sh — these contain harness defaults you may want to merge

### 6.2 Fill PROJECT_RULES.md
Replace EVERY `[bracketed placeholder]` with verified values:
- Project Name, Type, Language, Status — from `package.json`/etc.
- Runtime, Framework, Database, ORM, Auth, Deployment, Package Manager — from dependencies + workflow files
- Repository Structure — from real top-level layout
- Naming Conventions — from existing code (grep multiple files for patterns)
- Code Style — from `.eslintrc*`/`.prettierrc*`/`tsconfig.json`
- Testing — from test config + CI workflow
- Environment — from `.env.example` + Setup section in README

**Rule:** if you cannot derive a value from the code, leave the placeholder OR ask ONE concrete question (max 5 questions total, ranked by importance).

**Delete sections** that definitely don't apply (e.g. no DB → drop the DB section).

### 6.3 Fill state/context.md
- "What is this project?" → 2–3 sentences from README + package.json description
- "Current focus" → check `git log -20 --oneline` and infer themes
- "Recent decisions" → check `docs/adr/`, `docs/decisions/`. If present: link them. If not: empty stub.

### 6.4 Create project-specific .claude/rules/
Identify domain areas in the codebase. For each SIGNIFICANT area, write a rule file with `paths:` frontmatter.

Examples that must be REAL, not invented:
- `api-routes.md` if real API routes exist (e.g. `src/api/` or `routes/`)
- `database.md` if real migrations/schema exist (e.g. `migrations/` or `prisma/schema.prisma`)
- `frontend.md` if real components exist (e.g. `src/components/`)
- `testing.md` if real test conventions exist that aren't obvious

**Do NOT** invent rules for areas the project doesn't have. Empty rules are noise.

### 6.5 Restore prior context from backup
If `.harness-backup/<timestamp>/` exists (use the LATEST if multiple):
- Compare old `CLAUDE.md` vs. new harness `CLAUDE.md`. Custom content from old → merge into `PROJECT_RULES.md` "Project-Specific Rules"
- If old `state/` files had real content (not just templates): merge into the new `state/` files
- Review every `<name>.harness` sidecar — the user's existing top-level file was preserved; harness defaults are in the sidecar for manual merge

### 6.6 Sensitive areas
Grep for tell-tale imports/terms:
- Auth: `passport`, `jwt`, `bcrypt`, `argon2`, `oauth`, `auth-`, `auth.`, `session`
- Payments: `stripe`, `paypal`, `square`, `braintree`
- Crypto: `crypto`, `secret`, `signature`
- Migrations: `migrations/`, `prisma/migrations/`, `alembic/`
- Secrets: `.env` files, `secrets/` directories

List what you found in the "Sensitive Areas" section of `PROJECT_RULES.md`. With concrete paths.

### 6.7 Known issues
Grep for `TODO`, `FIXME`, `HACK`, `XXX`. Pick the 3 MOST CRITICAL (not just the first 3) and document them in the "Known Issues / Constraints" section.

## Step 7 — Verify MCP servers

Read `.mcp.json`. Report which servers are configured. If the project had its own MCP servers (in the backup): mention them and ask whether to merge them in. Remind to run `/mcp` after restart.

## Step 8 — Verify harness

Run `./scripts/verify-harness.sh`. On FAIL: show the red lines, ask what to do.

## Step 9 — Final report

Report very explicitly:

1. **Tool status** — what was already there, what was installed
2. **Backup path** — where `.harness-backup/<timestamp>/` lives
3. **`.harness` sidecar files** — list every preserved-vs-harness pair so the user can merge manually
4. **Filled templates** with values:
   - PROJECT_RULES.md: which sections were filled with which values
   - state/context.md: project description + current focus
   - Which `.claude/rules/<area>.md` files were created + why
5. **Verified vs. guessed** — be honest: explicitly mark what was derived from real code facts and where you had to guess
6. **Open questions** (max 5, ranked by importance) you couldn't answer from the code
7. **What the user still needs to do**:
   - Final review of PROJECT_RULES.md (especially deleted sections)
   - Review `.harness-backup/` to make sure nothing important was missed
   - Merge any `<name>.harness` sidecar files into the originals
   - Restart Claude Code for MCP reload
   - First commands to try: `/rpi:plan <feature>`, `/rpi:research <topic>`

## Rules for YOU (Claude) during execution

- **Never** touch existing code — you only fill harness templates
- **Never** install tools or delete files without asking
- **Never** invent values for PROJECT_RULES — if you can't derive from code, ask
- **Never** invent rules for areas the project doesn't have
- For every destructive command (`rm`, `git reset`, force-write): user confirmation
- Bash output > 20 lines: use RTK
- Use TaskCreate for the 9 steps
- Report briefly after each step
- If `.harness-backup/` has multiple timestamps: use the LATEST
- If step 6 would read a huge number of files: prioritise the 10–15 most important, not all
============================================================
```

---

## What you have afterward

- Harness in the project, with backups of your old files in `.harness-backup/<ts>/` and harness defaults preserved as `<name>.harness` sidecars
- `PROJECT_RULES.md` filled with real values from your codebase
- `state/context.md` with project description + current focus
- Project-specific rules in `.claude/rules/` (e.g. `api-routes.md`, `database.md`)
- Sensitive areas documented (auth, payments, secrets)
- Known issues documented (top 3 TODO/FIXME/HACK)

## What you still need to do

1. Final review of PROJECT_RULES.md — answer open questions, check deleted sections
2. Merge any `<name>.harness` sidecars into the originals where appropriate
3. If your backup under `.harness-backup/` had valuable custom configs that weren't merged: pull them over manually
4. Restart Claude Code for MCP reload
5. Try `/rpi:plan` with your next feature

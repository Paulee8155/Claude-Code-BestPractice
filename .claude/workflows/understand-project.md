# Workflow: Understand an Existing Project

Use this workflow when starting work in an unfamiliar codebase.

---

## Phase 1: Read Configuration (5 min)

- [ ] Read `CLAUDE.md` — harness rules
- [ ] Read `PROJECT_RULES.md` — project-specific conventions
- [ ] Read `README.md` — project overview and setup
- [ ] Read `docs/context.md` — prior session notes (if exists)
- [ ] Read `docs/tasks.md` — in-progress work (if exists)

---

## Phase 2: Map the Structure (10 min)

- [ ] List top-level directories: `ls -la`
- [ ] Read package manifest: `package.json` / `pyproject.toml` / `go.mod`
- [ ] Identify entry points: `src/index.*`, `main.*`, `app.*`
- [ ] Identify test location and framework
- [ ] Identify config files: `.env.example`, `docker-compose.yml`, etc.

**Output:** Note the structure in `docs/context.md`.

---

## Phase 3: Understand the Domain (10 min)

- [ ] Read the main data models (schemas, types, interfaces)
- [ ] Read the main routing layer (routes, controllers, handlers)
- [ ] Identify the primary user-facing flows

---

## Phase 4: Trace One Flow (10 min)

Pick a simple, complete feature and trace it end-to-end:
- [ ] Find the entry point (HTTP handler / CLI command / event)
- [ ] Follow the logic through to the data layer
- [ ] Follow the response back to the caller
- [ ] Note layers, patterns, and conventions observed

---

## Phase 5: Check Current State (5 min)

- [ ] `git status` — what's uncommitted
- [ ] `git log --oneline -10` — recent changes
- [ ] Run tests to establish baseline: all pass / some fail / unknown

---

## Output

After completing the workflow, write a brief summary to `docs/context.md`:

```
## Project Understanding — [date]

Stack: [language, framework, database]
Entry: [main entry point]
Tests: [command to run, baseline status]
Conventions: [key naming/structure patterns]
Key files: [most important files to know]
Current state: [what's in progress, what's broken]
```

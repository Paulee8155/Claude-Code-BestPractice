---
name: project-onboarding
description: Use when connecting a new or existing project to this harness for the first time, or when the project structure is unfamiliar. Triggers on /onboard-project, "onboard this project", "analyze this codebase", "what is this project".
user-invocable: true
allowed-tools: Read, Bash, Glob, Grep, Write, Edit, Agent
---

# Project Onboarding Skill

Connect an existing or new project to the harness. Produces a grounded project profile, not a template guess.

## What This Skill Does

1. Reads the real codebase — entry points, configs, test setup, build system
2. Identifies stack, architecture, conventions, sensitive areas, known risks
3. Writes/updates `PROJECT_RULES.md`, `state/context.md`, `state/tasks.md`
4. Identifies candidates for project-specific skills/agents/hooks — proposes, does not create
5. Outputs a prioritized list of suggestions with justification

## Process

### Step 1 — Discover Structure
```bash
# Run via rtk for token efficiency
rtk ls .               # top-level layout
rtk find . -name "*.json" -maxdepth 2  # package.json, tsconfig, etc.
```
Read: `package.json` / `pyproject.toml` / `go.mod` / `Cargo.toml` / `composer.json` (whichever exists).
Read: `.env.example`, `Dockerfile`, `docker-compose.yml`, CI config if present.

### Step 2 — Understand Entry Points
Identify the main entry point(s): `src/index.*`, `main.*`, `app.*`, `cmd/`.
Trace one representative user-facing flow end-to-end.

### Step 3 — Assess Tests and Quality Gates
Check test framework, test location, how to run tests, coverage target.
Check linter, formatter, typecheck commands.

### Step 4 — Identify Conventions
Naming (files, functions, DB tables), code organization, error handling, module boundaries.

### Step 5 — Spot Risks and Sensitive Areas
Auth code, payment flows, migration files, infra scripts, secrets handling.

### Step 6 — Write Outputs
Update `PROJECT_RULES.md` with real values (not placeholders).
Write `state/context.md` with project summary, stack, key commands, risks.
Seed `state/tasks.md` if there are obvious known-good next steps.

### Step 7 — Propose Extensions (do not create)
For each repeated pattern found, evaluate against these criteria:
- Would a project-specific skill save 3+ future interactions?
- Is the trigger clear and unambiguous?
- Does it overlap with an existing skill?

Output: numbered list of proposed extensions with priority (High/Medium/Low) and one-line justification each.

## Outputs

- Updated `PROJECT_RULES.md`
- Updated `state/context.md`
- Seeded `state/tasks.md` (if applicable)
- Proposed extensions list (no auto-creation)

## Gotchas

- Never overwrite `PROJECT_RULES.md` without reading the existing content first.
- If a `state/context.md` already exists and looks correct, update only stale fields.
- Do not run expensive commands (full test suite, full build) during onboarding — only check if commands exist.
- Monorepos: map the workspace layout before drilling into packages.
- If the project has no test setup, flag this explicitly as a risk — do not assume tests exist.

## Do Not Use When

- The project is already fully documented and state/ is current — use `/project-status` instead.
- You just need to understand one specific file — read it directly.

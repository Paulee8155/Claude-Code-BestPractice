# CLAUDE.md — Project Harness

A reusable Claude Code harness for new and existing projects.
Core: `.claude/skills/` · `.claude/agents/` · `.claude/hooks/` · `.claude/commands/`

---

## Project Start

1. Read `PROJECT_RULES.md` — stack, conventions, constraints, sensitive areas.
2. Check `state/context.md` and `state/tasks.md` for in-progress work.
3. New or unfamiliar project: run `/onboard-project` before anything else.
4. After compaction: `ctx_search(["summary","tasks","last request"], sort: "timeline")`

## Work Mode

- Read relevant files before making any claim or change. Never speculate.
- Use plan mode (`/plan-feature`) for multi-file or ambiguous changes.
- Small, reversible patches — one logical concern at a time.
- Run tests/checks after each step and report results.
- One concern per commit. Explain *why*, not *what*.
- No overengineering. Three similar lines beat a premature abstraction.

## Orchestration

| Layer | Role | Location |
|---|---|---|
| Commands | Orchestrate workflows | `.claude/commands/` |
| Skills | Reusable procedures, preloaded into context | `.claude/skills/` |
| Agents | Isolated specialist context windows | `.claude/agents/` |
| Hooks | Deterministic safety enforcement | `.claude/hooks/` |
| Rules | Lazy-loaded path-specific guidance | `.claude/rules/` |

**Core commands:** `/onboard-project` · `/plan-feature` · `/implement-feature` · `/review-work` · `/evolve-harness` · `/project-status`

Commands orchestrate via the `Skill` tool (skills) and `Agent` tool (agents).
Do not implement logic inside commands — delegate to skills and agents.

## Token Budget

| Situation | Tool |
|---|---|
| Short output (<20 lines) | `rtk <cmd>` |
| git diff / logs / build | `rtk git diff`, `rtk cargo build`, etc. |
| Large output or analysis | `ctx_execute(language: "shell", code: "...")` |
| Web fetch | `ctx_fetch_and_index(url, source)` → `ctx_search(queries)` |
| Multiple commands in parallel | `ctx_batch_execute(commands, queries)` |

Full reference: `docs/TOKEN_BUDGET.md` · `.claude/rules/rtk.md` · `.claude/rules/context-mode.md`

RTK is globally active. Never run `rtk init` or modify RTK global config without confirmation.
Context Mode: never `ctx_purge` without explicit user confirmation.

## Safety

**Allowed without confirmation:** reading files, reversible local edits, tests, linters, builds, creating docs/templates.

**Requires explicit confirmation:**
- `rm -rf`, any file or directory deletion
- `git push --force`, `git reset --hard`, `git clean -f`
- Amending published commits
- Touching `.env`, secrets, credentials, private keys
- Database drops, destructive migrations
- Modifying production infrastructure or external service config

Hooks `block-destructive` and `protect-secrets` enforce this at tool-call level.
When in doubt: stop, describe the action, ask.

## Git

- Never skip pre-commit hooks (`--no-verify`).
- Never force-push without explicit instruction.
- Squash-merge feature branches for clean history.

## Dynamic Evolution

When a pattern repeats 2–3 times across sessions:
1. Run `/evolve-harness` — evaluates whether a new skill/agent/hook is warranted.
2. New components are **proposed with justification, created only after approval**.
3. Prune unused skills/agents at each major milestone.

Criteria: clear trigger · recurring need · low overlap · token-efficient.
See `docs/DYNAMIC_EVOLUTION.md`.

## Context & Session Continuity

Context-mode handles continuity automatically via hooks (PreToolUse, PostToolUse, PreCompact, SessionStart).
Manual compact at ~50% context if not auto-triggered. Use `/rewind` for mistakes.
Full routing rules: `.claude/rules/context-mode.md`

## Output

Always report: files changed · checks run · open risks or blockers.
Update `state/tasks.md` as steps complete during multi-step work.

---

*Keep this file under 140 lines. Move detail to `.claude/rules/`, skills, or `docs/`.*

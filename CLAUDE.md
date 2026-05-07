# CLAUDE.md — Project Harness

A reusable Claude Code harness for new and existing projects.
Layers: `.claude/{commands,agents,skills,rules,hooks,agent-memory,templates}` + `state/` + RTK + context-mode.

---

## Project Start

1. Read `PROJECT_RULES.md` — stack, conventions, constraints, sensitive areas.
2. Check `state/context.md` and `state/tasks.md` for in-progress work.
3. Unfamiliar project: walk through `/rpi:research <spec>` first.
4. After compaction: `ctx_search(["summary","tasks","last request"], sort: "timeline")`

## Work Mode

- Read relevant files before making any claim or change. Never speculate.
- Default to RPI for non-trivial work: `/rpi:research` → `/rpi:plan` → `/rpi:implement`.
- Small, reversible patches — one logical concern at a time.
- Run tests/checks after each step and report results.
- One concern per commit. Explain *why*, not *what*.
- No overengineering. Three similar lines beat a premature abstraction.

## Orchestration

| Layer | Role | Location |
|---|---|---|
| Commands | Orchestrate workflows | `.claude/commands/` |
| Agents | Isolated specialist context windows | `.claude/agents/` |
| Skills | Reusable preloaded procedures | `.claude/skills/` |
| Rules | Lazy-loaded path-specific guidance | `.claude/rules/` |
| Hooks | Deterministic safety + lifecycle automation | `.claude/hooks/` |
| Memory | Persistent per-agent state | `.claude/agent-memory/` |

**Canonical workflow (RPI):** `/rpi:research <spec>` · `/rpi:plan <feature>` · `/rpi:implement <phase>`
**Drift tracking:** `/workflow-concepts` · `/workflow-claude-{commands,settings,skills,subagents}`

Commands orchestrate via the `Skill` tool (skills) and `Agent` tool (agents).
Do not implement logic inside commands — delegate to skills and agents.

## Reference Documentation

| Need | Where |
|---|---|
| Why a harness > prompts | `reports/why-harness-is-important.md` |
| Memory hierarchy & monorepo loading | `best-practice/claude-memory.md` |
| settings.json reference | `best-practice/claude-settings.md` |
| Skill / agent / command frontmatter | `best-practice/claude-{skills,subagents,commands}.md` |
| MCP server setup | `best-practice/claude-mcp.md` |
| Hands-on patterns | `implementation/*.md` |
| Configuration hierarchy | `reports/claude-global-vs-project-settings.md` |
| Hook system details | `.claude/hooks/HOOKS-README.md` |
| RPI workflow walkthrough | `development-workflows/rpi/rpi-workflow.md` |

## Token Budget

| Situation | Tool |
|---|---|
| Short output (<20 lines) | `rtk <cmd>` |
| git diff / logs / build | `rtk git diff`, `rtk cargo build`, etc. |
| Large output or analysis | `ctx_execute(language: "shell", code: "...")` |
| Web fetch | `ctx_fetch_and_index(url, source)` → `ctx_search(queries)` |
| Multiple commands in parallel | `ctx_batch_execute(commands, queries)` |

Full reference: `.claude/rules/rtk.md` · `.claude/rules/context-mode.md`

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

The `PreToolUse` hook in `.claude/hooks/scripts/hooks.py` enforces
`block-destructive` and `protect-secrets` at tool-call level.
When in doubt: stop, describe the action, ask.

## Git

- Never skip pre-commit hooks (`--no-verify`).
- Never force-push without explicit instruction.
- Squash-merge feature branches for clean history.

## Hooks

27 lifecycle events wired to a single Python handler. Toggle per event
via `.claude/hooks/config/hooks-config.json`; per-machine overrides in
`hooks-config.local.json` (gitignored). Self-test:
```
python3 .claude/hooks/scripts/hooks.py --self-test
```

## MCP Servers

`.mcp.json` registers `playwright`, `context7`, `deepwiki`. Verify with
`/mcp`. Project servers auto-enable via `enableAllProjectMcpServers: true`.

## Context & Session Continuity

context-mode handles continuity automatically via PreToolUse, PostToolUse,
PreCompact, SessionStart hooks. Manual compact at ~50% context if not
auto-triggered. Use `/rewind` for mistakes. Routing rules:
`.claude/rules/context-mode.md`.

## Output

Always report: files changed · checks run · open risks or blockers.
Update `state/tasks.md` as steps complete during multi-step work.

---

*Keep this file under 140 lines. Move detail to `.claude/rules/`, skills, or `docs/`.*

# CLAUDE.md — Project Harness

A reusable Claude Code harness for new and existing projects.
Layers: `.claude/{commands,agents,skills,rules,hooks,agent-memory,templates}` + `state/` + RTK + claude-mem.

---

## Project Start

1. Read `PROJECT_RULES.md` — stack, conventions, constraints, sensitive areas.
2. Check `state/context.md` and `state/tasks.md` for in-progress work.
3. Unfamiliar project: walk through `/rpi:research <spec>` first.
4. After compaction or `/resume`: query claude-mem `search` MCP tool for prior context (e.g. `search("last task summary")`).

## Work Mode

- Read relevant files before making any claim or change. Never speculate.
- Default to RPI for non-trivial work: `/rpi:research` → `/rpi:plan` → `/rpi:implement`.
- Small, reversible patches — one logical concern at a time.
- Run tests/checks after each step and report results.
- One concern per commit. Explain *why*, not *what*.
- No overengineering. Three similar lines beat a premature abstraction.
- Follow the four discipline principles in `.claude/rules/karpathy-principles.md`.

## Orchestration

| Layer | Role | Location |
|---|---|---|
| Commands | Orchestrate workflows | `.claude/commands/` |
| Agents | Isolated specialist context windows | `.claude/agents/` |
| Skills | Reusable invocable procedures | `.claude/skills/` |
| Rules | Lazy-loaded path-specific guidance | `.claude/rules/` |
| Hooks | Deterministic safety + lifecycle automation | `.claude/hooks/` |
| Memory | Per-agent state + cross-session memory (claude-mem) | `.claude/agent-memory/`, `~/.claude-mem/` |

**Canonical workflow (RPI):** `/rpi:research <spec>` · `/rpi:plan <feature>` · `/rpi:implement <phase>`

Commands orchestrate via the `Skill` tool (skills) and `Agent` tool (agents).
Do not implement logic inside commands — delegate to skills and agents.

## Reference Documentation

| Need | Where |
|---|---|
| Discipline principles (always-on) | `.claude/rules/karpathy-principles.md` |
| Tool routing rules | `.claude/rules/rtk.md`, `.claude/rules/claude-mem.md` |
| Hook system details | `.claude/hooks/HOOKS-README.md` |
| RPI workflow commands | `.claude/commands/rpi/{research,plan,implement}.md` |
| Onboard existing project | `.claude/commands/adopt-project.md` (run `/adopt-project`) |
| One-time setup | `scripts/setup.sh` |

## Token Budget

| Situation | Tool |
|---|---|
| Short output (<20 lines) | `rtk <cmd>` |
| git diff / logs / build | `rtk git diff`, `rtk cargo build`, etc. |
| Large repeated output | RTK filters (auto via PreToolUse hook) |
| Web fetch | `WebFetch` (or context7 MCP for library docs) |
| Memory recall | claude-mem `search`, `timeline`, `get_observations` MCP tools |

Full reference: `.claude/rules/rtk.md` · `.claude/rules/claude-mem.md`

RTK is globally active. Never run `rtk init` or modify RTK global config without confirmation.

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
- Never push directly to `main`/`master` — use feature branches + PRs.
- Squash-merge feature branches for clean history.

## Hooks

27 lifecycle events wired to a single Python handler. Toggle per event
via `.claude/hooks/config/hooks-config.json`; per-machine overrides in
`hooks-config.local.json` (gitignored). Self-test:
```
python3 .claude/hooks/scripts/hooks.py --self-test
```

## MCP Servers

`.mcp.json` registers `playwright`, `context7`, `deepwiki`, plus claude-mem
(installed via `npx claude-mem install`). Verify with `/mcp`.
Project servers auto-enable via `enableAllProjectMcpServers: true`.

## Context & Session Continuity

claude-mem captures observations across sessions and exposes them via
`search` / `timeline` / `get_observations` MCP tools. Web viewer at
`http://localhost:37777`. Manual compact at ~50% context if not
auto-triggered. Use `/rewind` for mistakes. Routing rules:
`.claude/rules/claude-mem.md`.

## Output

Always report: files changed · checks run · open risks or blockers.
Update `state/tasks.md` as steps complete during multi-step work.

---

*Keep this file under 140 lines. Move detail to `.claude/rules/`, skills, or `docs/`.*

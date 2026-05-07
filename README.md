# Claude Code Project Harness

Top-1 % drop-in setup for Claude Code. Rules, skills, agents, hooks,
session memory, RPI workflow — productive on day one for new projects, and
self-adopting for existing ones.

Built on:
- [shanraisshan/claude-code-best-practice](https://github.com/shanraisshan/claude-code-best-practice) — base structure
- [RTK](https://github.com/rtk-ai/rtk) — 60–90 % token savings on shell output
- [claude-mem](https://github.com/thedotmack/claude-mem) — cross-session memory with semantic search + web viewer at `localhost:37777`
- [karpathy-skills](https://github.com/forrestchang/andrej-karpathy-skills) — Karpathy discipline principles (always-loaded)
- [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) — 12 phased skills (planning, TDD, debugging, review, security, perf, simplification, git, docs, context, source-driven, incremental)

---

## What you get

| Layer | What | Where |
|---|---|---|
| Discipline | Karpathy's 4 always-on rules | `.claude/rules/karpathy-principles.md` |
| Memory | Cross-session semantic recall | `.claude/rules/claude-mem.md` + `~/.claude-mem/` |
| Token savings | RTK pre-active on every Bash | `.claude/rules/rtk.md` |
| Workflow | Research → Plan → Implement | `.claude/commands/rpi/` |
| Skills | 12 universal procedures | `.claude/skills/` |
| Agents | 6 general + 3 domain (frontend, backend, db) + 8 RPI | `.claude/agents/` |
| Hooks | Block destructive · protect secrets · auto-format · verification reminder | `.claude/hooks/` |
| State | Survives sessions: context, tasks, decisions, progress | `state/` |
| Scripts | Setup, adopt-existing, worktree, verify | `scripts/` |

---

## Use case 1 — New project (zero-touch via master-prompt)

The fastest path: **paste a master-prompt** into a fresh Claude Code session in
your empty target directory. Claude then verifies tools, installs missing ones
(with your confirmation), clones the harness, runs `setup.sh`, and verifies.

→ [`prompts/master-setup-new-project.md`](prompts/master-setup-new-project.md)

Manual alternative (if you prefer to drive it yourself):
```bash
cp -r /path/to/this-harness/. /path/to/your-new-project/
cd /path/to/your-new-project
./scripts/setup.sh        # interactive: tools check + fill PROJECT_RULES.md
```

## Use case 2 — Existing project (zero-touch via master-prompt)

Same idea but for an existing codebase. Claude scans your real project,
runs `adopt.sh` (with backup), then `/adopt-project` to fill PROJECT_RULES,
state/, and project-specific rules from verified facts in your code.

→ [`prompts/master-setup-existing-project.md`](prompts/master-setup-existing-project.md)

Manual alternative:
```bash
./scripts/adopt.sh /path/to/your/existing/project
cd /path/to/your/existing/project
# In Claude Code:  /adopt-project
```

## Use case 3 — Parallel feature work (worktrees)

```bash
./scripts/worktree.sh add feat/checkout-redesign
# Creates ../<repo>-wt/feat/checkout-redesign
# Open a second Claude Code session there — fully isolated.
```

---

## Prerequisites (machine-wide, one-time)

| Tool | Why | Install |
|---|---|---|
| `git` | Versioning | `apt install git` |
| `rtk` | Shell output token savings | `curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/master/install.sh \| sh` |
| `bun` | claude-mem runtime | `curl -fsSL https://bun.sh/install \| bash` (auto by claude-mem) |
| `claude-mem` | Cross-session memory | `npx claude-mem install` |

`setup.sh` verifies all of these.

---

## Layout

```
CLAUDE.md                          # always-loaded rules
PROJECT_RULES.md                   # project-specific rules (filled by setup.sh or /adopt-project)
README.md                          # this file
.gitignore
.mcp.json                          # context7, playwright, deepwiki

.claude/
    agents/                        # 6 general + 3 domain + 8 RPI subagents
        architect.md
        backend.md                 # NEW
        database.md                # NEW
        debugger.md
        frontend.md                # NEW
        implementer.md
        reviewer.md
        security-reviewer.md
        tester.md
        rpi/                       # 8 RPI specialists

    commands/
        adopt-project.md           # /adopt-project
        rpi/                       # /rpi:research /rpi:plan /rpi:implement

    skills/                        # 12 invocable skills
        planning-and-task-breakdown.md
        test-driven-development.md
        incremental-implementation.md
        context-engineering.md
        source-driven-development.md
        debugging-and-error-recovery.md
        code-review-and-quality.md
        code-simplification.md
        security-and-hardening.md
        performance-optimization.md
        git-workflow-and-versioning.md
        documentation-and-adrs.md

    rules/
        karpathy-principles.md     # always-loaded
        claude-mem.md              # always-loaded
        rtk.md                     # lazy
        markdown-docs.md
        security.md
        testing.md

    hooks/                         # 27-event Python handler
        scripts/hooks.py
        config/hooks-config.json
        HOOKS-README.md

    templates/
    settings.json                  # hardened: pre-authorize safe + block dangerous

state/
    context.md  tasks.md  decisions.md  progress.md  plans/

scripts/
    setup.sh                       # new project bootstrap
    adopt.sh                       # adopt existing project
    worktree.sh                    # parallel feature checkouts
    verify-harness.sh              # self-check

prompts/
    master-setup-new-project.md         # paste-and-run for new projects
    master-setup-existing-project.md    # paste-and-run for existing projects
    README.md                            # which prompt to use when
```

---

## Active hooks

| Event | What it does | Toggle |
|---|---|---|
| PreToolUse | Block `rm -rf`, force-push, `reset --hard`, etc. + protect `.env`, keys | `safety.blockDestructive`, `safety.protectSecrets` |
| PostToolUse | Auto-format edited files (ruff, prettier, gofmt, rustfmt — silent if missing) | `safety.autoFormat` |
| Stop | Print verification reminder before declaring done | `safety.verificationReminder` |

All toggles in `.claude/hooks/config/hooks-config.json` (or `.local.json` per machine).

---

## Quick reference

| Need | Action |
|---|---|
| New project — autonomous setup | Paste [`prompts/master-setup-new-project.md`](prompts/master-setup-new-project.md) into Claude |
| Existing project — autonomous setup | Paste [`prompts/master-setup-existing-project.md`](prompts/master-setup-existing-project.md) into Claude |
| New project — manual | `./scripts/setup.sh` |
| Existing project — manual | `./scripts/adopt.sh /path/to/project` then `/adopt-project` in Claude |
| Parallel branch work | `./scripts/worktree.sh add <branch>` |
| Verify the harness | `./scripts/verify-harness.sh` |
| Plan a feature | `/rpi:plan` (or `/rpi:research` first if uncertain) |
| Implement a plan | `/rpi:implement` |
| Recall prior session | claude-mem `search("topic")` MCP tool |
| Tool routing | `.claude/rules/rtk.md`, `.claude/rules/claude-mem.md` |
| Discipline rules | `.claude/rules/karpathy-principles.md` (always loaded) |
| Hook details | `.claude/hooks/HOOKS-README.md` |

---

## Why this harness

1. **Drop-in:** copy the dir, run one script, productive in 5 min.
2. **Self-adopting:** for existing projects, `/adopt-project` reads your code
   and configures itself — no manual filling of templates.
3. **Discipline-by-default:** Karpathy's 4 principles + 12 skills with
   anti-rationalization tables stop common LLM failure modes.
4. **Token-efficient:** RTK auto-shrinks every Bash call by 60–90 %; claude-mem
   recalls prior sessions without dumping logs into context.
5. **Safe:** PreToolUse hook blocks the things you'd regret; secrets paths
   are unreadable by default.
6. **Parallel-ready:** worktree helper for running multiple Claude Code
   sessions on different branches with no conflicts.

---

## Customising

Everything is meant to be edited:
- **Rules:** add files to `.claude/rules/` with `paths:` frontmatter to scope them
- **Agents:** edit / add markdown files in `.claude/agents/`
- **Skills:** add `.md` files to `.claude/skills/` — invoke via `Skill` tool
- **Commands:** add `.md` files to `.claude/commands/` — they become slash commands
- **Hooks:** edit `.claude/hooks/scripts/hooks.py` and `config/hooks-config.json`

When a pattern repeats across 2-3 projects, fold it back here.

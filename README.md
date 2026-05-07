# Claude Code Project Harness

A reusable Claude Code wrapper for new and existing projects. Drop it into a
repo, fill in `PROJECT_RULES.md`, and Claude has consistent rules, commands,
agents, hooks, and a structured RPI workflow from day one.

Derived from [shanraisshan/claude-code-best-practice](https://github.com/shanraisshan/claude-code-best-practice).
Extended with [RTK](https://github.com/rtk-ai/rtk) (60–90 % token savings on
shell output) and [context-mode](https://github.com/mksglu/context-mode)
(session continuity + context-efficient tool routing).

---

## What this is

A **project shell**, not an application. Copy it into any new project to give
Claude Code:

- Stable working rules (`CLAUDE.md`, `PROJECT_RULES.md`, `.claude/rules/`)
- Slash commands for the canonical Research → Plan → Implement workflow
- Specialised subagents for design, implementation, review, testing,
  debugging, security
- A 27-event hook system with built-in safety checks
- Project-state tracking in `state/` that survives sessions
- A drift-tracking workflow that flags when official Claude Code changes
  outpace this harness

---

## Quick start

```bash
# 1. Copy harness into your project
cp -r /path/to/this-harness/. /path/to/your-project/

# 2. Install RTK (one-time, machine-wide)
curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh | sh
export PATH="$HOME/.local/bin:$PATH"
rtk init -g --auto-patch

# 3. Install context-mode plugin (inside Claude Code)
#    /plugin marketplace add mksglu/context-mode
#    /plugin install context-mode@context-mode
#    /context-mode:ctx-doctor   # all checks must pass

# 4. Fill in PROJECT_RULES.md and templates/, then run:
claude
```

The hooks self-test runs on demand:

```bash
python3 .claude/hooks/scripts/hooks.py --self-test
```

---

## Concepts (A-C-S architecture)

| Layer | Role | Location |
|---|---|---|
| **Commands** | Orchestrate workflows, entry points | `.claude/commands/` |
| **Agents** | Isolated specialist context windows | `.claude/agents/` |
| **Skills** | Reusable, preloaded procedures | `.claude/skills/` |
| **Rules** | Lazy-loaded path-specific guidance | `.claude/rules/` |
| **Hooks** | Deterministic safety + lifecycle automation | `.claude/hooks/` |
| **Memory** | Persistent per-agent state | `.claude/agent-memory/` |
| **State** | Project tasks, decisions, context | `state/` |

Deep dive: `reports/why-harness-is-important.md`, `best-practice/claude-memory.md`,
`reports/claude-agent-command-skill.md`.

---

## Canonical workflow: RPI

| Step | Command | What happens |
|---|---|---|
| Research | `/rpi:research <requirements>` | Spec analysis, feasibility, GO/NO-GO verdict — read-only |
| Plan | `/rpi:plan <feature>` | PM stories, UX flow, architecture, phased task list |
| Implement | `/rpi:implement <phase>` | Phased execution with validation gates |

Workflow detail: `development-workflows/rpi/rpi-workflow.md`.

For everyday tasks the general-purpose agents are still available directly:
`architect`, `implementer`, `reviewer`, `security-reviewer`, `tester`,
`debugger`.

---

## Drift-tracking workflows

Five commands monitor official Claude Code releases against the local
reference docs and flag drift. Each command has a paired research agent and
a changelog file under `changelog/best-practice/<topic>/`.

| Command | Tracks |
|---|---|
| `/workflow-concepts` | README CONCEPTS section |
| `/workflow-claude-commands` | Official commands & frontmatter |
| `/workflow-claude-settings` | `settings.json` options |
| `/workflow-claude-skills` | Skill frontmatter fields |
| `/workflow-claude-subagents` | Subagent frontmatter fields |

Run them periodically or after a Claude Code release.

---

## Hook system (27 events)

A single Python handler dispatches every Claude Code lifecycle event.
Toggle each event in `.claude/hooks/config/hooks-config.json`. Per-machine
overrides go in `hooks-config.local.json` (gitignored).

By default only `PreToolUse` is active and runs two safety checks:

- `blockDestructive` — blocks `rm -rf`, `git push --force`, `DROP TABLE`, etc.
- `protectSecrets` — blocks reads/writes to `.env`, `*.pem`, `id_rsa`, etc.

Reference: `.claude/hooks/HOOKS-README.md`.

---

## MCP servers

Wired in `.mcp.json`:

- `playwright` — browser automation
- `context7` — up-to-date library documentation lookup
- `deepwiki` — knowledge base search

Servers register on `claude` startup; verify with `/mcp`.

---

## Token-efficient tool routing

`.claude/rules/rtk.md` and `.claude/rules/context-mode.md` describe routing
rules Claude must follow. Summary:

| Operation | Tool |
|---|---|
| Short shell output (< 20 lines) | `rtk <cmd>` |
| Large shell output / analysis | `ctx_execute(language, code)` |
| Web fetch | `ctx_fetch_and_index(url, source)` → `ctx_search(queries)` |
| Multi-command in parallel | `ctx_batch_execute(commands, queries)` |

---

## Repository layout

```
CLAUDE.md                          # primary instructions, < 140 lines
PROJECT_RULES.md                   # project-specific stack & conventions
README.md                          # this file
.mcp.json                          # MCP server registry

.claude/
  settings.json                    # permissions, hooks, statusline, env
  agents/                          # general-purpose subagents (6)
    rpi/                           # RPI specialist agents (8)
    workflows/best-practice/       # drift-tracking agents (5)
  agent-memory/                    # per-agent persistent state
  commands/
    rpi/                           # /rpi:research|plan|implement
    workflows/best-practice/       # /workflow-* drift-tracking
  hooks/
    config/hooks-config.json       # per-event toggles
    scripts/hooks.py               # central handler (27 events)
    HOOKS-README.md
  rules/                           # lazy-loaded via paths: frontmatter
    context-mode.md, rtk.md, security.md, testing.md, markdown-docs.md
  templates/                       # project-profile, tech-stack
  skills/                          # custom skills (project-specific)

state/                             # context, tasks, decisions, progress
changelog/best-practice/           # drift-tracking output
best-practice/                     # 8 official-feature reference docs
implementation/                    # 5 hands-on implementation guides
reports/                           # 4 deep-dive analyses
development-workflows/rpi/         # RPI workflow guide
scripts/verify-harness.sh          # structural sanity check
```

---

## Adapting the harness

| You want to … | Do this |
|---|---|
| Add project-specific stack rules | Edit `PROJECT_RULES.md` |
| Add path-specific rules | Create `.claude/rules/<name>.md` with `paths:` frontmatter |
| Add a slash command | Create `.claude/commands/<name>.md` |
| Add a subagent | Create `.claude/agents/<name>.md` with frontmatter |
| Persist agent state across sessions | Create `.claude/agent-memory/<agent>/MEMORY.md` |
| Enable a lifecycle hook | Set `disable<Event>Hook: false` in `hooks-config.json`, extend handler |
| Add component-specific rules | Drop a `CLAUDE.md` in the subdirectory |

---

## Verification

```bash
bash scripts/verify-harness.sh
python3 .claude/hooks/scripts/hooks.py --self-test
python3 -m json.tool .claude/settings.json > /dev/null
python3 -m json.tool .mcp.json > /dev/null
```

---

## Reference

- `best-practice/` — official feature reference (commands, settings, skills,
  subagents, memory, MCP, CLI flags, power-ups)
- `implementation/` — hands-on patterns (subagents, skills, commands, agent
  teams, scheduled tasks)
- `reports/` — deep dives (`why-harness-is-important.md`,
  `claude-agent-command-skill.md`, `claude-agent-memory.md`,
  `claude-global-vs-project-settings.md`)
- `development-workflows/rpi/rpi-workflow.md` — full RPI walkthrough

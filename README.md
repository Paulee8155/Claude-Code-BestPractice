# Claude Code Project Harness

A reusable project wrapper for Claude Code that gives every new project a consistent set of rules, workflows, commands, agents, and documentation templates — from day one.

Derived from [shanraisshan/claude-code-best-practice](https://github.com/shanraisshan/claude-code-best-practice).
Includes [context-mode](https://github.com/mksglu/context-mode) integration for automatic session continuity and context-efficient tool routing.

---

## What This Is

This harness is not an application. It is a **project shell** you copy into any new project to:

- Give Claude Code clear, consistent working rules
- Provide reusable slash commands for common engineering tasks
- Define specialized agents for architecture, implementation, review, testing, debugging, and security
- Provide structured workflows for features, bugs, refactoring, and releases
- Keep project state (tasks, decisions, context) in version-controlled docs
- Automatically preserve session state across compactions via context-mode

---

## How to Use

### 1. Copy into a new project

```bash
# Copy the harness into an existing or new project directory
cp -r /path/to/this-harness/. /path/to/your-project/

# Or use as a git template
git clone [this-repo] your-project
cd your-project
rm -rf .git
git init
```

### 2. Install rtk (Rust Token Killer)

rtk compresses Bash command output by 60-90%, saving significant token costs on every session. It is wired into the global Claude Code hook automatically once installed.

```bash
# Install rtk
curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh | sh

# Add to PATH (add to ~/.bashrc or ~/.zshrc for persistence)
export PATH="$HOME/.local/bin:$PATH"

# Register the global Claude Code hook (one-time setup)
rtk init -g --auto-patch
```

After installation, restart Claude Code. rtk activates automatically for all Bash commands.

**Verify savings:** run `rtk gain` in the terminal after a session.

### 3. Install context-mode plugin

context-mode provides automatic session continuity and context-efficient tool routing. It is required for the harness to work correctly.

In Claude Code:
```
/plugin marketplace add mksglu/context-mode
/plugin install context-mode@context-mode
/reload-plugins
```

Verify installation:
```
/context-mode:ctx-doctor
```
All checks must show `[x]`.

### 4. Fill in project-specific files

1. **`PROJECT_RULES.md`** — Fill in your tech stack, conventions, and constraints
2. **`.claude/templates/project-profile.md`** — One-page project summary
3. **`.claude/templates/tech-stack.md`** — Detailed stack reference

### 5. Start Claude Code

```bash
claude
```

Claude will read `CLAUDE.md` automatically. context-mode hooks activate immediately and start capturing session state.

---

## File Structure

```
CLAUDE.md                    ← Claude's primary instructions (read first)
PROJECT_RULES.md             ← Project-specific rules (read second)
README.md                    ← This file
.claude/
  settings.json              ← Permissions and configuration
  commands/                  ← Slash commands
    analyze-project.md
    plan-feature.md
    implement-feature.md
    investigate-bug.md
    review-code.md
    create-tests.md
    refactor.md
    update-docs.md
    prepare-release.md
    project-status.md
  agents/                    ← Specialized subagents
    architect.md
    implementer.md
    reviewer.md
    tester.md
    debugger.md
    documenter.md
    security-reviewer.md
  workflows/                 ← Step-by-step process guides
    understand-project.md
    implement-feature.md
    bugfix.md
    code-review.md
    context-handoff.md
  templates/                 ← Reusable project templates
    project-profile.md
    tech-stack.md
  hooks/                     ← Lifecycle automation (add your hooks here)
  rules/                     ← Lazy-loaded path-specific rules (add as needed)
docs/
  context.md                 ← Session handoff notes
  tasks.md                   ← Task tracking
  decisions.md               ← Architecture decision log
  progress.md                ← Milestone progress
scripts/                     ← Utility scripts (add as needed)
```

---

## Available Commands

Run these in Claude Code with `/command-name`:

| Command | What it does |
|---|---|
| `/analyze-project` | Map the codebase, understand conventions |
| `/plan-feature [name]` | Plan a feature before touching code |
| `/implement-feature [name]` | Implement from a task list |
| `/investigate-bug [description]` | Root cause analysis |
| `/review-code [target]` | Code review with checklist |
| `/create-tests [target]` | Generate tests for existing code |
| `/refactor [target]` | Safe, behavior-preserving refactoring |
| `/update-docs [what changed]` | Keep docs in sync |
| `/prepare-release [version]` | Pre-release checklist |
| `/project-status` | Current state summary |

---

## Available Agents

Agents run in isolated context windows for specialized tasks:

| Agent | Use for |
|---|---|
| `architect` | System design, ADRs, approach selection |
| `implementer` | Executing a well-defined implementation task |
| `reviewer` | Code review |
| `tester` | Test strategy and test generation |
| `debugger` | Bug investigation |
| `documenter` | Documentation updates |
| `security-reviewer` | Security-focused review |

---

## Adapting the Harness

**Add project-specific rules** — Edit `PROJECT_RULES.md`.

**Add path-specific rules** — Create `.claude/rules/[name].md` with `paths:` frontmatter:
```yaml
---
paths:
  - "src/api/**"
---
Rules that only apply when working in src/api/
```

**Add project commands** — Create `.claude/commands/[name].md`.

**Add hooks** — Add shell commands to `.claude/hooks/` and reference in `.claude/settings.json`.

**Add a component CLAUDE.md** — In any subdirectory (e.g. `frontend/CLAUDE.md`) for component-specific rules. Lazy-loaded when Claude reads files in that directory.

---

## context-mode Integration

context-mode is a Claude Code plugin that solves the context window problem at two levels:

**1. Session continuity** — State is captured to a per-project SQLite DB on every tool call. When compaction happens, a snapshot is built and injected back at the next SessionStart. Claude continues from where it left off without asking "what were we doing?".

**2. Context-efficient tool routing** — Certain tools are intercepted and rerouted through sandboxed subprocesses. Only stdout enters the context window; raw data (56 KB API responses, test output, file contents) stays in the sandbox.

| Instead of | Use |
|---|---|
| `WebFetch(url)` | `ctx_fetch_and_index(url, source)` → `ctx_search(queries)` |
| `Bash` > 20 lines | `ctx_execute(language: "shell", code: "...")` |
| Manual context tracking | `ctx_search(queries: ["summary","tasks"], sort: "timeline")` |

Full reference: `.claude/rules/context-mode.md`

**Slash commands:**
- `/context-mode:ctx-doctor` — verify installation
- `/context-mode:ctx-stats` — see context savings
- `/context-mode:ctx-upgrade` — update to latest

---

## Key Principles (from the source repository)

1. **Harness > prompt.** Skills, agents, hooks, and rules provide capabilities no prompt alone can replicate: context isolation, deterministic execution, lazy loading, parallelism, and persistence.

2. **CLAUDE.md under 200 lines.** Keep primary instructions concise. Move detail to lazy-loaded rules files.

3. **Session continuity via context-mode.** State persists across compactions automatically — no manual handoff files needed for normal sessions.

4. **Command → Agent → Skill pattern.** Commands orchestrate, agents execute in isolated contexts, skills provide preloaded knowledge.

5. **Read first, act second.** Claude must read relevant files before making statements or changes.

---

## Recommended Next Steps After Copying

1. Fill in `PROJECT_RULES.md` with your stack and conventions
2. Fill in `.claude/templates/project-profile.md`
3. Run `/analyze-project` to let Claude map your codebase
4. Run `/project-status` to establish a baseline
5. Add your first real task to `docs/tasks.md`

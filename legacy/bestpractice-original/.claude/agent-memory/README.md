# Agent Memory

Persistent per-agent state that survives across sessions.

## Layout

```
.claude/agent-memory/
├── README.md                       # this file
└── <agent-name>/
    ├── MEMORY.md                   # primary state, loaded on agent start
    └── <topic>.md                  # optional supporting notes
```

One subdirectory per agent that needs persistent memory. The directory name
matches the agent name in `.claude/agents/<agent-name>.md` (or
`.claude/agents/<scope>/<agent-name>.md`).

## How it is loaded

Agents declare their memory directory via the `memory:` field in frontmatter:

```yaml
---
name: senior-software-engineer
memory: .claude/agent-memory/senior-software-engineer
---
```

When the agent is invoked, Claude Code injects the contents of `MEMORY.md`
into the agent's initial context. The agent can write back to it the same way
it writes to any other file.

## What belongs here

- Stable knowledge the agent should remember between invocations: prior
  decisions, glossary entries, working assumptions, learned conventions.
- Long-running task state (e.g. a research log).

## What does **not** belong here

- Transient session state — use `state/` instead.
- Project-wide conventions — use `PROJECT_RULES.md` or `.claude/rules/`.
- Secrets — never. Anything written here is checked in.

## Example

```
.claude/agent-memory/code-reviewer/
├── MEMORY.md           # "remember to check for unbatched DB calls"
└── findings.md         # accumulated review findings across sessions
```

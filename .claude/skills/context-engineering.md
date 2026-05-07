---
name: context-engineering
description: Use when working in long sessions, after compaction, or when starting work in an unfamiliar area. Optimizes which information enters Claude's context window to maximize signal vs noise. Triggers on "I need context on X", session resumes, or when working in a new module.
---

# Context Engineering

The context window is your working memory. Treat it as a scarce resource.

## Before adding anything to context

Ask: does Claude need this **right now** to make the next decision?
- ✅ The function being modified, its tests, its direct callers
- ❌ The whole module's history, every related file "just in case"

## What belongs in context (in order of priority)

1. The user's actual request (verbatim)
2. The file(s) being changed
3. Direct callers + dependencies of those files
4. Tests for the changed code
5. Project conventions for the area (`PROJECT_RULES.md`, relevant `.claude/rules/`)

## What does NOT belong

- Raw build/test output > 20 lines → use RTK or `Bash` redirected to file
- Whole READMEs unless the README is the actual subject
- Speculative "background" files
- Old session logs (use claude-mem `search` instead)
- Long terminal output from exploratory commands

## Tools to keep context small

| Need | Tool |
|---|---|
| Run command, see only failures | `rtk <test command>` |
| Recall prior session | claude-mem `search("topic")` |
| Find a symbol | `Grep` (returns matches only, not whole files) |
| Library docs | `context7` MCP server (returns relevant snippet) |
| Web page | `WebFetch` with a focused prompt |

## Compaction strategy

At ~40-50% context use:
1. Save anything in-flight to `state/tasks.md`
2. Note key decisions in `state/decisions.md`
3. Run `/compact` with an explicit hint:
   `/compact — keep: feature-X implementation, drop: exploration of unrelated module`

Never let auto-compact run unguided. The hint controls what survives.

## Anti-rationalization

| Excuse | Counter |
|---|---|
| "I'll just dump the whole file in case I need it" | Context bloat costs every subsequent token. Read targeted sections. |
| "Re-reading is faster than searching" | Once: yes. Twice: switch to Grep + Read with offset/limit. |
| "I'll let auto-compact handle it" | Auto-compact discards what *it* thinks is irrelevant — often the wrong thing. Compact manually. |
| "More context = better answers" | More relevant context = better answers. More irrelevant context = worse answers. |

## Done when

- Only the files needed for the next decision are in context
- Tool outputs are filtered (RTK or selective grep)
- Long-term knowledge lives in `state/` or claude-mem, not the active conversation

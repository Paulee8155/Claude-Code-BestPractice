# context.md — Session Handoff Notes

## Primary: context-mode (automatic)

context-mode captures every session event to a per-project SQLite knowledge base and restores state automatically after compaction.

**After compaction or on session resume — run this first:**
```
ctx_search(queries: ["summary", "tasks", "last request"], sort: "timeline")
```

This file (`docs/context.md`) is a **secondary fallback** for explicit manual handoffs or when starting a brand-new Claude session without `--continue`.

---

## Latest Manual Handoff

_No manual handoff recorded yet._

---

## Template

Use this for explicit session endings or long breaks:

```markdown
## Handoff — YYYY-MM-DD HH:MM

### Current task
[What was being worked on]

### Status
[In progress / Blocked / Waiting for user input / Complete]

### What's done
- [Completed item]

### What's next
- [ ] [Next step — specific enough to act on without context]

### Key files changed
- [path/to/file:line] — [what changed and why]

### Decisions made this session
- [Decision] — [rationale]

### Open questions / blockers
- [Question]

### How to resume
1. ctx_search(queries: ["summary", "tasks", "last request"], sort: "timeline")
2. Read docs/tasks.md
3. git status && git log --oneline -5
4. [First concrete action]
```

---
description: Summarize the current state of the project — git status, in-progress tasks, recent changes, and next steps.
---

# /project-status

Produce a current project status summary.

## Gather Information

Run the following in parallel:

1. `git status` — uncommitted changes
2. `git log --oneline -10` — recent commits
3. Read `docs/tasks.md` — in-progress and pending tasks
4. Read `docs/context.md` — session handoff notes
5. Read `docs/progress.md` — milestone progress

## Output Format

```
## Project Status — [date]

### Git State
- Branch: [current branch]
- Uncommitted changes: [count] files
- Last commit: [message] ([time ago])

### In Progress
- [Task name] — [status / blocker]

### Pending
- [Task name] — [priority]

### Recently Completed
- [Task] — [commit reference]

### Blockers
- [Blocker] — [who/what is needed]

### Next Steps
1. [Most important next action]
2. [Second next action]
```

## After Summarizing

If there are uncommitted changes that should be committed, offer to commit them.
If `docs/tasks.md` is stale, offer to update it.
If context notes are outdated, offer to refresh them.

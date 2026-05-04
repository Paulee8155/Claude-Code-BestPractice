---
description: Summarize the current project state — git status, active tasks, recent changes, next steps, open risks.
allowed-tools: Bash, Read
---

# /project-status

Gather and report the current project state in one pass.

```bash
rtk git status
rtk git log --oneline -10
```

Then read in parallel: `state/context.md` · `state/tasks.md` · `state/progress.md`

## Output

```
## Status — [date]

### Git
- Branch: [branch] · Uncommitted: [N files] · Last commit: [msg]

### In Progress
- [Task] — [status / blocker]

### Pending (top 3)
- [Task] — [priority]

### Open Risks
- [Risk] — [mitigation or owner]

### Next Steps
1. [Most important action]
2. [Second action]
```

Update `state/tasks.md` if stale. Offer to commit loose changes.

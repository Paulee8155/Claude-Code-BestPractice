# Workflow: Context Handoff

context-mode handles session continuity automatically — state is captured to SQLite and rebuilt after every compaction. This workflow covers manual handoffs for explicit session endings, agent delegation, or long breaks.

---

## Automatic Resume (context-mode)

After any compaction or `--continue` session start, run this first:

```
ctx_search(queries: ["summary", "tasks", "last request"], sort: "timeline")
```

This retrieves the session guide context-mode built from the last snapshot. Do not ask the user "what were we doing?" — check the knowledge base first.

---

## Manual Handoff (for explicit session endings)

Use when ending a long session intentionally or handing off to another person.

### Step 1: Capture current state to docs/context.md

```markdown
## Handoff — YYYY-MM-DD HH:MM

### Current task
[What was being worked on]

### Status
[In progress / Blocked / Waiting for user input]

### What's done
- [Completed item]

### What's next
- [ ] [Next step — be specific enough to act on without context]

### Key files changed
- [path/to/file:line] — [what changed and why]

### Decisions made this session
- [Decision] — [rationale]

### Open questions / blockers
- [Question]

### How to resume
1. Run: ctx_search(queries: ["summary", "tasks"], sort: "timeline")
2. Read docs/tasks.md
3. Run: git status
4. [First concrete action]
```

### Step 2: Commit uncommitted work

```bash
git status
# commit each logical unit
git add [files]
git commit -m "[what and why]"
```

### Step 3: Update docs/tasks.md

- Mark completed tasks
- Add new tasks discovered this session
- Update priorities if changed

---

## Resume Priority Order

When starting a new session on an existing project:

1. **ctx_search first** — `ctx_search(queries: ["summary", "tasks", "last request"], sort: "timeline")`
2. **docs/tasks.md** — what's in progress and pending
3. **git status** — what's uncommitted
4. **docs/context.md** — manual handoff notes (if written)
5. Then act — do not re-read the whole codebase before doing anything

---

## When to Use Each Mechanism

| Situation | Use |
|---|---|
| Compaction happened mid-session | ctx_search auto-restore (automatic) |
| Starting a new `claude` session with `--continue` | ctx_search auto-restore (automatic) |
| Ending a session intentionally | Write docs/context.md + commit |
| Delegating to a subagent | Write the task spec into the agent prompt |
| Very long break (days) | docs/context.md + ctx_search |

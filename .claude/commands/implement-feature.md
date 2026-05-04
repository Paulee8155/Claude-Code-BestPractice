---
description: Implement a planned feature step by step, following the task list in state/tasks.md. Requires a plan to exist first.
argument-hint: [task name or step description]
allowed-tools: Skill, Agent, Read, Write, Edit, Bash, Glob, Grep
---

# /implement-feature $ARGUMENTS

Use the `implementation-loop` skill to execute: **$ARGUMENTS**

```
Skill("implementation-loop", "$ARGUMENTS")
```

The skill will:
- Verify a plan exists in `state/tasks.md` (if not, redirect to `/plan-feature` first)
- Read all files that will change before touching anything
- Make small, verified changes — one step at a time
- Run checks (test / lint / typecheck) after each significant step
- Update `state/tasks.md` as steps complete
- Report deviations from the plan immediately

For large, isolated subtasks the skill may invoke the `implementer` agent for context isolation.

**If no plan exists:** use `/plan-feature $ARGUMENTS` first and wait for confirmation.

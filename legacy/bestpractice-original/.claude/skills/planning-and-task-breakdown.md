---
name: planning-and-task-breakdown
description: Use BEFORE writing code for any feature touching 3+ files or taking >30 min. Decomposes a spec into small verifiable tasks with explicit acceptance criteria. Triggers on "plan this", "break this down", "how should we approach", or any non-trivial feature request.
---

# Planning & Task Breakdown

Adapted from [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills).

## When to invoke

- The change touches 3+ files
- Estimated time > 30 min
- Behavior is user-facing
- Anything reaching `/rpi:plan` or `/rpi:research`

## Process

### Step 1 — Restate the goal

Write one paragraph: what is the user trying to achieve, in their words +
what success looks like. If you can't, ask the user before continuing.

### Step 2 — Identify constraints

List:
- Files / modules that will change
- External services touched
- Backwards-compatibility requirements
- Performance / security gates
- Testing requirements

### Step 3 — Decompose into vertical slices

Each task must:
- Be independently shippable (or at least independently verifiable)
- Have explicit **acceptance criteria** (test that proves it's done)
- Take < 1 hour ideally
- Touch as few files as possible

### Step 4 — Order by risk

Front-load the **highest-uncertainty** task. If the riskiest piece doesn't
work, the rest of the plan is wasted. Do **not** start with "easy bits."

### Step 5 — Write to `state/tasks.md`

Format:
```
## In progress
- [ ] task-1: <subject>
      Done when: <observable acceptance criterion>
      Touches: <files>
      Risk: low|med|high

## Backlog
- [ ] task-2: ...
```

## Anti-rationalization

| Excuse | Counter |
|---|---|
| "This is small enough to skip planning" | Small changes still benefit from explicit acceptance criteria. 5 min planning saves 30 min rework. |
| "I'll plan as I go" | That's reactive coding, not planning. The whole point is to think first. |
| "Tasks need to be perfect before I start" | They don't. Plan well enough to start the riskiest task. Refine as you learn. |
| "I'll start with the easy parts" | If the hard part fails, you wasted the easy work. Front-load risk. |

## Output

Hand off to `/rpi:implement` with `state/tasks.md` populated.

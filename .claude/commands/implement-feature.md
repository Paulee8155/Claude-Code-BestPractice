---
description: Implement a planned feature step by step, following the task list in docs/tasks.md.
argument-hint: [feature-name or task reference]
---

# /implement-feature $ARGUMENTS

Implement: **$ARGUMENTS**

## Pre-flight

Before writing any code:
- [ ] Read `docs/tasks.md` — confirm the plan exists and is approved
- [ ] Read `docs/decisions.md` — understand architecture decisions
- [ ] Read the files that will be changed
- [ ] Check current `git status` — start from a clean state

## Implementation Approach

1. **Work in vertical slices** — implement one complete piece end-to-end before the next
2. **Smallest change first** — find the minimal change that moves forward
3. **Run tests after each step** — do not accumulate untested changes
4. **Commit logical units** — one commit per meaningful step

## Steps

For each task in the plan:
1. Read the relevant files
2. Make the change
3. Run tests
4. Fix any issues
5. Commit with a descriptive message
6. Mark the task complete in `docs/tasks.md`

## During Implementation

If you hit a decision point not covered by the plan:
- Do not guess — stop and describe the choice to the user
- Log the decision in `docs/decisions.md` after user confirms

If context is approaching 50%:
- Run `/compact` manually
- Write current state to `docs/context.md` first

## Output

After completing the implementation:
- Summarize what was implemented
- List any deviations from the plan and why
- Note any follow-up tasks created
- Run the full test suite and report results

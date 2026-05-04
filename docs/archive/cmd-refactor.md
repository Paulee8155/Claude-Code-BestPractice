---
description: Safely refactor code to improve clarity or structure without changing behavior.
argument-hint: [file-path or area to refactor]
---

# /refactor $ARGUMENTS

Refactor: **$ARGUMENTS**

## Refactoring Rules

**Behavior must not change.**
If behavior changes, it is not a refactoring — it is a feature change.

**Stay in scope.**
Do not refactor code adjacent to the target unless it directly enables the refactoring.

**Tests must pass before and after.**
Run tests before starting. Run them after every step. If there are no tests, write them first.

## Process

1. **Define the goal**
   - What specific problem does this refactoring solve?
   - What does the code look like after? (naming, structure, size, clarity)

2. **Run tests baseline**
   - Confirm tests pass before touching anything

3. **Plan the steps**
   - Break the refactoring into small independent steps
   - Each step should leave the code in a working state

4. **Execute step by step**
   - One change at a time
   - Run tests after each step
   - Commit after each verified step

5. **Verify**
   - All tests pass
   - No new type errors
   - Behavior is identical to before

## Common Refactorings

| Goal | Approach |
|---|---|
| Too-large function | Extract sub-functions with clear names |
| Duplicated logic | Extract shared function or module |
| Unclear names | Rename — update all call sites |
| Complex conditional | Extract to predicate function or early return |
| Mixed concerns | Separate into distinct modules |
| Magic values | Extract to named constants |

## What NOT to do
- Do not add new features during a refactoring
- Do not change public API signatures without explicit task
- Do not introduce new abstractions unless they solve a concrete existing problem
- Do not refactor just because you prefer a different style

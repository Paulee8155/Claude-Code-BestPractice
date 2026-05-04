# Workflow: Implement a Feature

Use this workflow for any non-trivial feature implementation.

---

## Phase 1: Confirm Prerequisites

- [ ] Task is clearly defined (acceptance criteria exist)
- [ ] Architecture is decided (check `docs/decisions.md`)
- [ ] Plan is written in `docs/tasks.md`
- [ ] Starting from a clean git state (`git status` is clean)
- [ ] Tests pass before starting (`npm test` / `pytest` / etc.)

If any prerequisite is missing, run `/plan-feature` first.

---

## Phase 2: Understand the Affected Area

- [ ] Read every file that will be changed
- [ ] Read adjacent files to understand patterns
- [ ] Identify all call sites of code being changed
- [ ] Confirm there are no existing similar implementations to reuse

---

## Phase 3: Implement in Vertical Slices

For each slice:
1. Implement the smallest useful piece end-to-end
2. Run tests — they must pass before the next slice
3. Commit: `git commit -m "[what and why]"`
4. Mark step complete in `docs/tasks.md`

**Vertical slice order (adapt as needed):**
- [ ] Data model / schema changes
- [ ] Business logic / core function
- [ ] API layer / interface
- [ ] UI layer (if applicable)
- [ ] Tests for each layer

---

## Phase 4: Finalize

- [ ] All planned tasks completed in `docs/tasks.md`
- [ ] Full test suite passes
- [ ] No type errors or linter warnings
- [ ] No debug output left in code
- [ ] No hardcoded values that should be config
- [ ] Documentation updated (`/update-docs`)

---

## Phase 5: Review

- [ ] Self-review: read the diff with fresh eyes
- [ ] Run `/review-code` on the changes
- [ ] Run `/security-reviewer` if the feature touches auth, input, or data

---

## Context Management During Long Features

If context approaches 50%:
1. Write current state to `docs/context.md`
2. Run `/compact`
3. Read `docs/context.md` and `docs/tasks.md` to restore orientation

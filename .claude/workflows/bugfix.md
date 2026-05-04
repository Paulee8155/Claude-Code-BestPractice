# Workflow: Bug Fix

Use this workflow for any bug fix to ensure root cause is addressed, not just symptoms.

---

## Phase 1: Understand the Bug

- [ ] Reproduce the bug with exact steps
- [ ] Record: actual behavior vs. expected behavior
- [ ] Collect: error message, stack trace, or log output verbatim
- [ ] Identify: is this regression (was working before) or new behavior?

If regression: `git log -p [affected-file]` to find introducing commit.

---

## Phase 2: Locate the Root Cause

Run `/investigate-bug` or follow these steps:

- [ ] Find the entry point of the failing flow
- [ ] Read every file in the execution path — do not assume
- [ ] Trace the path from entry to failure point
- [ ] Identify the line where actual behavior diverges from expected
- [ ] Confirm root cause with positive evidence in the code

**Stop here and confirm the root cause before proceeding.**

---

## Phase 3: Design the Fix

- [ ] Identify the minimal change that fixes the root cause
- [ ] Check if similar code elsewhere has the same bug
- [ ] Confirm the fix does not break other call sites
- [ ] Confirm the fix is reversible (no irreversible side effects)

---

## Phase 4: Implement the Fix

- [ ] Start from a clean git state
- [ ] Make the minimal change
- [ ] Run tests — confirm bug is fixed
- [ ] Run full test suite — confirm no regressions
- [ ] Write a regression test that would catch this bug

---

## Phase 5: Commit and Document

- [ ] Commit the fix: `git commit -m "fix: [what was broken and why]"`
- [ ] Commit the regression test separately
- [ ] Update `CHANGELOG.md` if user-facing
- [ ] Note in `docs/decisions.md` if this changes a design assumption

---

## Checklist: What NOT to do

- Do not fix the symptom without understanding the cause
- Do not add workaround code around broken code — fix the broken code
- Do not refactor while fixing — separate concerns, separate commits
- Do not skip the regression test — if it was broken once, it will break again

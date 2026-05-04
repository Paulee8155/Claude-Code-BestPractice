# Workflow: Code Review

Use when reviewing a PR, branch, or specific file changes.

---

## Phase 1: Understand Intent

- [ ] Read the PR description or task that produced these changes
- [ ] Read `docs/decisions.md` for relevant architecture decisions
- [ ] Check the diff scope: `git diff main...HEAD --stat`

---

## Phase 2: Review Changed Files

For each changed file:
- [ ] Read the full file, not just the diff
- [ ] Understand the context around each change
- [ ] Apply the review checklist (see below)

---

## Review Checklist

**Correctness**
- [ ] Code does what it's supposed to do
- [ ] Edge cases handled (null, empty, zero, large values)
- [ ] Error paths are correct and consistent
- [ ] No logic errors in conditionals

**Security**
- [ ] No raw user input in SQL/shell/HTML
- [ ] No hardcoded secrets
- [ ] Permission checks present for protected operations
- [ ] Output is escaped where needed

**Quality**
- [ ] Follows project naming and structure conventions (check `PROJECT_RULES.md`)
- [ ] Names are clear — no abbreviations or cryptic identifiers
- [ ] Functions have single clear responsibility
- [ ] No dead code, unused imports, or commented-out blocks

**Tests**
- [ ] New behavior has tests
- [ ] Tests cover error cases
- [ ] Tests are meaningful

**Documentation**
- [ ] Public interfaces are documented where non-obvious
- [ ] README updated if user-facing behavior changed

---

## Phase 3: Report

Use `/review-code` output format:

```
### Critical (must fix)
### Important (should fix)
### Minor (optional)
### Approved
```

---

## Confidence Rule

Only report an issue if confident it is a real problem.
If uncertain, phrase as: "Is X intentional? I'd expect Y here."
Do not report style preferences unless they violate project conventions.

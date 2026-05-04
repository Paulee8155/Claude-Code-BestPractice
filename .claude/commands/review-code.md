---
description: Review code for correctness, quality, security, and adherence to project conventions.
argument-hint: [file-path, PR number, or feature name]
---

# /review-code $ARGUMENTS

Review: **$ARGUMENTS**

## Review Checklist

### Correctness
- [ ] Does the code do what it's supposed to do?
- [ ] Are edge cases handled (null, empty, 0, very large values)?
- [ ] Are error paths correct?
- [ ] Are async operations awaited properly?
- [ ] Are there any race conditions or shared state issues?

### Security
- [ ] Is user input validated at system boundaries?
- [ ] Are there SQL injection risks? (use parameterized queries)
- [ ] Are there XSS risks? (escape output)
- [ ] Are secrets or credentials hardcoded anywhere?
- [ ] Are file paths sanitized?
- [ ] Are permission checks present for sensitive operations?
- [ ] Are dependencies up to date (no known CVEs)?

### Code Quality
- [ ] Does the code follow existing project conventions?
- [ ] Are names clear and self-documenting?
- [ ] Is the code DRY without being over-abstracted?
- [ ] Are functions small and single-purpose?
- [ ] Is complexity justified?

### Tests
- [ ] Are there tests for the new behavior?
- [ ] Do tests cover happy path and error cases?
- [ ] Are tests testing behavior, not implementation?

### Documentation
- [ ] Are public interfaces documented (where non-obvious)?
- [ ] Is the README or API docs updated if behavior changed?

## Output Format

Report only real issues. Suppress style nits unless they violate project conventions.

```
## Review: [target]

### Critical (must fix)
- [Issue] — [file:line] — [why it matters]

### Important (should fix)
- [Issue] — [file:line] — [suggestion]

### Minor (optional)
- [Issue] — [file:line] — [suggestion]

### Approved
[List anything done well]
```

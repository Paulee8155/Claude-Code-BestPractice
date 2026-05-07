---
name: code-review-and-quality
description: Use BEFORE merging any PR or marking work complete. Five-axis review with severity labels. Triggers on "review this", "check my code", "is this ready to merge", or end-of-task verification.
---

# Code Review & Quality

Review on five axes. Label findings by severity.

## The five axes

### 1. Correctness
- Does it do what the spec says?
- Edge cases handled (null, empty, max, concurrent)?
- Does it match the test it was supposed to make pass?

### 2. Design
- Is the abstraction level appropriate?
- Does it fit the surrounding code's patterns?
- Could a future change land here without rewriting?
- Is anything over-engineered for current needs?

### 3. Readability
- Names describe what the thing **is** / **does** (not how)?
- Functions short enough to hold in head?
- Comments explain WHY non-obvious decisions were made (not WHAT)?
- Could a new team member understand this in 5 min?

### 4. Tests
- New behavior has tests?
- Tests assert behavior, not implementation?
- Edge cases covered?
- Tests fail for the right reason if you break the code?

### 5. Risk
- What's the rollback if this breaks production?
- Does it touch security-sensitive paths (auth, payments, secrets)?
- Migration / data risk?
- Performance regression risk?

## Severity labels

When reporting findings, prefix every comment:
- **`[blocker]`** — must fix before merge (correctness, security, breaks something)
- **`[important]`** — should fix before merge (design, missing tests for risky path)
- **`[suggestion]`** — could be better (readability, naming)
- **`[nit]`** — personal preference, OK to ignore

A review with no `[blocker]` and no `[important]` is approvable.

## Change sizing

| Lines changed | Max review depth |
|---|---|
| < 50 | All five axes deeply |
| 50–500 | All five axes, focus on changed-line context |
| > 500 | Reject as too large, ask for split — review impossible at this size |

## Don't

- Review by skimming. If you can't articulate WHY a line is good or bad, you didn't read it.
- Approve "looks fine to me." Either approve with what you checked, or request changes.
- Block on `[nit]` items.
- Refactor in the review. Suggest, don't impose.
- Skip security review for changes touching auth, payments, file I/O, shell exec, or user input.

## Anti-rationalization

| Excuse | Counter |
|---|---|
| "The author tested it" | Then tests should be in the diff. If not, request them. |
| "It's just a small change" | Small changes break things. Review depth scales with risk, not lines. |
| "Tests pass, ship it" | Passing tests don't mean correct design. Review the design. |
| "I trust the author" | Trust isn't a review. Verify. |

## Done when

- All five axes covered
- Findings labeled by severity
- No `[blocker]` items remain
- Reviewer can articulate one sentence: "this is correct because..."

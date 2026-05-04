---
name: review-gate
description: Use when reviewing code, a diff, a PR, or a branch before merging or declaring work complete. Triggers on /review-work, "review this", "check this PR", "is this ready to merge", "review my changes".
user-invocable: true
argument-hint: [file, branch, or PR number]
allowed-tools: Read, Glob, Grep, Bash, Agent
---

# Review Gate Skill

Structured review of code changes — finds real issues, not style preferences.
Reports findings by severity with file:line references and concrete fixes.

## Review Scope

Determine what to review based on the argument:
- **No argument**: review current git diff (staged + unstaged)
- **File/directory**: review that specific target
- **Branch name**: `git diff main...<branch>` 
- **PR number**: use `gh pr diff <number>`

## Process

### Step 1 — Read the Diff
```bash
rtk git diff           # current working changes
rtk git diff main...HEAD  # branch diff
```

Understand the **intent** of the changes before applying any checklist.

### Step 2 — Code Review
Invoke the reviewer agent for code quality:
```
Agent(subagent_type: "reviewer", prompt: "Review these changes: [diff or file list]")
```

### Step 3 — Security Review
For any change touching auth, input handling, payments, file ops, or shell commands:
```
Agent(subagent_type: "security-reviewer", prompt: "Security review of: [target]")
```

Skip security review for pure documentation changes.

### Step 4 — Test Coverage Check
- Are new behaviors covered by tests?
- Do tests cover the error paths, not just the happy path?
- Are existing tests still passing? (`rtk <test-command>`)

### Step 5 — Regression Check
- Does this change any public interface?
- Are there other callers that might be affected?
- Does it change any behavior that existing tests rely on?

## Output Format

```markdown
## Review: [target]

### Critical — Must Fix Before Merge
- [Issue] at `file.ts:42`: [attack vector / bug / breakage] — Fix: [concrete action]

### Important — Fix Soon
- [Issue] at `file.ts:88`: [risk] — Suggestion: [concrete action]

### Advisory — Consider
- [Observation]: [why it matters and what to do]

### Passed
- [What was specifically checked and found clean]

### Verdict
[ ] Approved  [ ] Approved with minor fixes  [ ] Changes required
```

## Confidence Rule

Only report an issue if you are confident it is a real problem.
If uncertain, phrase as a question: "Is X intentional here? If not, [consequence]."
Do not report style preferences unless they violate `PROJECT_RULES.md` conventions.

## Gotchas

- Read the full file context around a finding — a snippet can look wrong but be fine in context.
- Don't flag patterns that `PROJECT_RULES.md` explicitly endorses.
- Security findings must include a realistic attack path — no theoretical-only findings.
- Test coverage gaps are findings only when behavior is non-trivial and untested.
- If the diff is very large (>500 lines), focus on the highest-risk areas first and say so.

## Do Not Use When

- Reviewing a first draft that the user explicitly says is WIP — wait until it's ready.
- Reviewing generated/boilerplate code without meaningful logic.
- The change is a single comment or string literal fix with no logic change.

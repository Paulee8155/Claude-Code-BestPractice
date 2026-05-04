---
description: Systematically investigate a bug by tracing the execution path and identifying the root cause before proposing a fix.
argument-hint: [bug description or issue reference]
---

# /investigate-bug $ARGUMENTS

Investigate: **$ARGUMENTS**

## Investigation Process

### 1. Reproduce the problem
- Identify the exact steps to trigger the bug
- Confirm the actual behavior vs. expected behavior
- Note error messages, stack traces, or logs verbatim

### 2. Locate the entry point
- Find where the problematic flow starts
- Read the relevant files — do not assume behavior

### 3. Trace the execution
- Follow the code path from entry to failure
- Note every branch, conditional, and state mutation along the way
- Identify where actual behavior diverges from expected

### 4. Identify the root cause
- Do not stop at the first symptom — find the underlying cause
- Ask: "Why does this code do the wrong thing here?"
- Check if it's a logic error, missing validation, wrong assumption, or race condition

### 5. Verify the hypothesis
- Find evidence in the code that confirms the root cause
- Check if similar code elsewhere has the same issue
- Check git history for when this was introduced (`git log -p`)

### 6. Propose the fix
- Describe the minimal change that fixes the root cause
- Note any side effects of the fix
- Note any tests that should be added

## Output Format

```
## Bug Report: [description]

### Root cause
[One clear sentence identifying the cause]

### Evidence
[File:line — what the code does and why it's wrong]

### Fix
[What to change and why]

### Tests to add
[What tests would catch this regression]
```

Do NOT implement the fix until the root cause is confirmed.

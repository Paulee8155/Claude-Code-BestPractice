---
description: Review code, a diff, a PR, or a branch for quality and security before merging or declaring done.
argument-hint: [file, branch name, or PR number — omit for current diff]
allowed-tools: Skill, Agent, Read, Bash, Glob, Grep
---

# /review-work $ARGUMENTS

Use the `review-gate` skill to review: **$ARGUMENTS**

```
Skill("review-gate", "$ARGUMENTS")
```

The skill will:
- Determine what to review (current diff, branch, file, or PR)
- Invoke the `reviewer` agent for code quality analysis
- Invoke the `security-reviewer` agent for security-sensitive changes
- Check test coverage for new behavior
- Check for regression risks in changed interfaces
- Output findings by severity with `file:line` references and concrete fixes
- Produce a clear verdict: Approved / Approved with minor fixes / Changes required

**Argument examples:**
- `/review-work` — reviews current `git diff`
- `/review-work main...feature/my-branch` — reviews branch diff
- `/review-work src/auth/login.ts` — reviews specific file
- `/review-work 42` — reviews PR #42

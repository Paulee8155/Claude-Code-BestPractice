---
description: Plan a new feature with architecture decisions before writing any code.
argument-hint: [feature-name or description]
---

# /plan-feature $ARGUMENTS

Plan the implementation of: **$ARGUMENTS**

## Steps

1. **Understand the requirement**
   - Clarify what problem this solves and for whom
   - Identify acceptance criteria (what "done" looks like)
   - Check if related work already exists in the codebase

2. **Explore the affected area**
   - Read relevant existing files before proposing anything
   - Identify what will change, what will stay the same
   - Find potential integration points and dependencies

3. **Identify constraints**
   - Security implications
   - Performance considerations
   - Breaking changes to existing interfaces
   - External service dependencies

4. **Design the approach**
   - Propose 2-3 implementation approaches with trade-offs
   - Recommend one approach with clear reasoning
   - Define the data model changes (if any)
   - Define the API surface (if any)

5. **Break into tasks**
   - List implementation steps in execution order
   - Identify which steps can be parallelized
   - Estimate relative complexity per step
   - Flag any steps that require external decisions

6. **Document the plan**
   - Write the plan to `docs/tasks.md`
   - Log the architecture decision to `docs/decisions.md`

## Output Format

```
## Feature: [name]

### Goal
[One sentence]

### Approach
[Chosen approach and why]

### Changes required
- [ ] [Step 1]
- [ ] [Step 2]
- [ ] [Step N]

### Risks
- [Risk and mitigation]

### Out of scope
- [What this does NOT include]
```

Do NOT start implementing. Wait for user confirmation of the plan.

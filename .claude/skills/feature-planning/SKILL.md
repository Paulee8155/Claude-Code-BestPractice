---
name: feature-planning
description: Use when planning a new feature, significant refactor, API change, or any multi-file modification before writing code. Triggers on /plan-feature, "plan this", "how should we implement", "design the approach for".
user-invocable: true
argument-hint: [feature name or description]
allowed-tools: Read, Glob, Grep, Bash, Agent, Write
---

# Feature Planning Skill

Produce a grounded implementation plan — after reading the code, not before.

## Rule: Read First, Plan Second

Never produce a plan from memory or assumptions. Always read the affected files first.
If you cannot read a file that the plan depends on, flag this as a blocker.

## Process

### Step 1 — Understand the Requirement
- What problem does this solve, and for whom?
- What does "done" look like? (acceptance criteria)
- Is there existing code that already does part of this?

### Step 2 — Explore the Affected Area
- Read all files that will change.
- Identify integration points, callers, dependencies.
- Check `state/decisions.md` for prior decisions that constrain this work.

### Step 3 — Identify Constraints
- Security implications (auth, input validation, data exposure)
- Performance impact (hot paths, N+1 queries, cache invalidation)
- Breaking changes to existing interfaces
- External service dependencies or API limits

### Step 4 — Design the Approach
Propose exactly 2–3 options with explicit trade-offs.
Recommend one option with clear reasoning.

For architecture questions, invoke the architect agent:
> Use `Agent(subagent_type: "architect")` with the specific design question.

### Step 5 — Break Into Tasks
- List implementation steps in execution order.
- Mark which steps can run in parallel.
- Flag steps requiring external decisions or approvals.
- Estimate relative complexity: S / M / L.

### Step 6 — Document the Plan
Write the plan to `state/tasks.md`.
Log architecture decisions to `state/decisions.md`.

**Do NOT start implementing.** Output the plan and wait for user confirmation.

## Plan Output Format

```markdown
## Feature: [name]

### Goal
[One sentence: what this does and why]

### Scope
[What is included]

### Non-Goals
[What is explicitly NOT included]

### Approach
[Chosen option and rationale]

### Affected Files
- `path/to/file.ts` — [what changes]
- `path/to/other.ts` — [what changes]

### Implementation Steps
- [ ] Step 1 (S) — description
- [ ] Step 2 (M) — description
- [ ] Step 3 (L) — description

### Risks
- [Risk]: [Mitigation]

### Test Strategy
- [What to test and how]

### Rollback Plan
- [How to revert if something goes wrong]

### Open Questions
- [Any decisions still needed before or during implementation]
```

## Gotchas

- Do not plan refactors of code you have not read.
- Do not assume the test framework without checking `PROJECT_RULES.md` or `package.json`.
- If the scope is too large for one plan, split into phases — plan phase 1 first.
- If an open question blocks implementation, raise it before writing the plan.
- Plans for security-sensitive features should always include a review gate step.

## Do Not Use When

- The change is a single-file edit with no design ambiguity — just make the edit.
- A plan already exists in `state/tasks.md` and is still valid — implement from it.
- The user asks for a quick prototype or spike — clarify scope before planning.

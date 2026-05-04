---
description: Plan a new feature, refactor, or significant change before writing any code. Reads the codebase, proposes approaches, produces a grounded implementation plan.
argument-hint: [feature name or description]
allowed-tools: Skill, Agent, Read, Glob, Grep, Write
---

# /plan-feature $ARGUMENTS

Use the `feature-planning` skill to plan: **$ARGUMENTS**

```
Skill("feature-planning", "$ARGUMENTS")
```

The skill will:
- Read the relevant files before proposing anything
- Propose 2–3 implementation approaches with trade-offs
- Recommend one approach with clear reasoning
- Break the work into ordered, sized steps
- Write the plan to `state/tasks.md`
- Log architecture decisions to `state/decisions.md`

For architecture questions the skill cannot resolve alone, it will invoke the `architect` agent.

**Do NOT start implementing** until the user confirms the plan.
After confirmation, use `/implement-feature` to execute.

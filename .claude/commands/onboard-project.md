---
description: Onboard a new or existing project into the harness. Analyzes the real codebase, fills in PROJECT_RULES.md and state/, and proposes project-specific harness extensions.
allowed-tools: Skill, Agent, Read, Write, Edit, Bash, Glob, Grep
---

# /onboard-project

Use the `project-onboarding` skill to connect this project to the harness.

```
Skill("project-onboarding")
```

The skill will:
- Analyze the codebase structure, stack, tests, and conventions
- Write/update `PROJECT_RULES.md` with real values
- Write/update `state/context.md` with the project summary
- Seed `state/tasks.md` with initial tasks if applicable
- Propose (not create) project-specific skills/agents/hooks with priority and justification

After the skill completes, review the proposals and run `/evolve-harness` to act on any of them.

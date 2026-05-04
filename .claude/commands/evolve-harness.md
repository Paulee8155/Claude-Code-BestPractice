---
description: Evaluate whether a new skill, agent, or hook is warranted based on repeated patterns. Proposes first, creates only after approval.
allowed-tools: Skill, Read, Write, Edit, Bash, Glob
---

# /evolve-harness

Use the `harness-evolution` skill to evaluate harness extensions.

```
Skill("harness-evolution")
```

The skill will audit the current inventory, evaluate patterns seen 2–3 times, and output proposals with justification. Nothing is created without your explicit approval.

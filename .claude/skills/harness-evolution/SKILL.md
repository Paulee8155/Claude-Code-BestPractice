---
name: harness-evolution
description: Use when a pattern has been seen 2-3 times and a new skill, agent, or hook might reduce future effort. Triggers on /evolve-harness, "should we add a skill for this", "we keep doing X manually", "add a hook for Y".
user-invocable: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Harness Evolution Skill

The harness evolves with the project — carefully. This skill prevents both stagnation and skill-spam.

## The Core Rule

**Propose first. Create only after explicit approval.**
Never auto-create a skill, agent, or hook — even if the pattern is obvious.

## When to Invoke This Skill

A new harness component is worth evaluating when:
- A manual procedure has been repeated **2–3 times** across different sessions
- The procedure is **consistent** (not ad-hoc each time)
- Encoding it would save meaningful effort — not just 1-2 steps

Do NOT invoke for:
- One-off situations
- Patterns that only appear in one session
- Things that are already covered by an existing skill

## Evaluation Process

### Step 1 — Check the Inventory

Read `.claude/skills/*/SKILL.md` and `.claude/agents/*.md` to see what already exists.
Is the pattern already covered, even partially? If so, improve the existing component instead.

### Step 2 — Assess the Pattern

Ask these questions:
1. **Clear trigger?** Can you write a one-sentence "use when" that is unambiguous?
2. **Recurring need?** Has it appeared 2+ times in different contexts?
3. **Low overlap?** Does it duplicate an existing skill >30%? If so, extend instead.
4. **Token-efficient?** Does encoding this save context vs. improvising each time?
5. **Testable?** Can you verify it works correctly in a real project?

### Step 3 — Classify the Component Type

| Pattern type | Component to create |
|---|---|
| Repeating procedure (how to do X) | Skill |
| Specialized read-only analysis task | Agent |
| Deterministic enforcement (always block Y) | Hook |
| Stack-specific conventions (always use Z) | Rule (`.claude/rules/`) |
| Project-specific reference info | Update `PROJECT_RULES.md` or `state/context.md` |

### Step 4 — Write the Proposal

Output this proposal and wait for user approval:

```markdown
## Proposed: [skill-name / agent-name / hook-name]

**Type:** Skill / Agent / Hook / Rule

**Trigger:** [exact "use when" description]

**Problem it solves:**
[What was being done manually, how many times, why that was painful]

**What it would do:**
[Concise description of the procedure]

**Evidence (2–3 examples):**
- Session [date]: [what we did manually]
- Session [date]: [what we did manually]

**Overlap check:**
[Existing skill/agent it could conflict with, and why it doesn't]

**Estimated token savings:** [rough estimate]

**Priority:** High / Medium / Low
```

### Step 5 — Create (after approval)

Only after the user approves the proposal:
- Create the component following the established pattern
- Add it to the inventory below
- Run `scripts/verify-harness.sh` to confirm the harness is intact

## Inventory Audit

When invoked with no specific proposal, audit the current inventory:

```bash
rtk ls .claude/skills/
rtk ls .claude/agents/
rtk ls .claude/hooks/
```

For each component, assess:
- **Last used:** (check git log or session notes)
- **Still relevant?** Does the project still have the pattern it was built for?
- **Overlap?** Does it now duplicate another component added later?

Output: list of components flagged for review (deprecation, merge, or deletion).

## Current Inventory

<!-- Updated by harness-evolution skill. Do not edit manually. -->
| Component | Type | Trigger | Created |
|---|---|---|---|
| project-onboarding | Skill | First contact with any project | Initial |
| token-budget-routing | Skill | Tool routing decisions | Initial |
| feature-planning | Skill | Multi-file or ambiguous changes | Initial |
| implementation-loop | Skill | Executing planned work | Initial |
| review-gate | Skill | Code/PR review | Initial |
| harness-evolution | Skill | Harness extension decisions | Initial |
| architect | Agent | Architecture decisions | Initial |
| reviewer | Agent | Code review | Initial |
| security-reviewer | Agent | Security review | Initial |
| tester | Agent | Test strategy | Initial |
| implementer | Agent | Isolated implementation | Initial |
| block-destructive | Hook | PreToolUse safety | Initial |
| protect-secrets | Hook | PreToolUse secrets protection | Initial |

## Gotchas

- A skill that tries to cover too many patterns becomes useless — keep scope tight.
- Hooks that fire too often become noise and get disabled. Only hook deterministic, always-valid rules.
- Agent proliferation is the worst failure mode — one general agent beats five over-specific ones.
- If a skill is never triggered, delete it — phantom skills waste context at load time.
- Project-specific skills should live in the project's `.claude/skills/`, not in the harness core.

# Agent routing — when to use which agent

Always-loaded (no `paths:` frontmatter) — keep concise.

The harness ships two agent suites that overlap by design. Use this routing
table to pick the right one. The wrong choice rarely *breaks* anything, but it
costs context and clarity.

## Rule of thumb

- Outside `/rpi:*` workflows → use the **flat** agents under `.claude/agents/`.
- Inside `/rpi:research`, `/rpi:plan`, `/rpi:implement` → the command itself
  delegates to the **`rpi/`** agents. Don't invoke them directly unless asked.

## Mapping

| Need | Agent | Notes |
|---|---|---|
| Small, well-defined task with clear spec | `implementer` | Single-shot execution, no planning |
| Multi-phase implementation from a `/rpi:plan` output | `rpi/senior-software-engineer` | Tracks milestones + reversibility, owned by RPI |
| One-off code review | `reviewer` | Correctness, edge cases, tests |
| Code review inside RPI workflow | `rpi/code-reviewer` | Quality + maintainability lens; called by `/rpi:implement` |
| Architecture / system design question | `architect` | Use when you need ADR-level decisions |
| Strategic go/no-go on a feature | `rpi/technical-cto-advisor` | Called by `/rpi:research` |
| Security review | `security-reviewer` | Auto-trigger on auth/, payments/, crypto changes |
| Debug a specific failure | `debugger` | Root-cause first, fix second |
| Test design / coverage | `tester` | New tests or restructuring suites |
| Backend / API logic | `backend` | Server-side endpoints, jobs, integrations |
| Frontend / UI / a11y | `frontend` | Components, layouts, design system |
| Schema / migrations / queries | `database` | Migration files, ORM models |
| Extract structured requirements from a free-text request | `rpi/requirement-parser` | Called by `/rpi:research` |
| Write or update docs / ADRs | `rpi/documentation-analyst-writer` | Called by `/rpi:plan` |
| Validate a proposal against PROJECT_RULES | `rpi/constitutional-validator` | Called by `/rpi:plan` |
| UX brief / flows / states | `rpi/ux-designer` | Called by `/rpi:plan` for UX-heavy work |
| Product framing / scope | `rpi/product-manager` | Called by `/rpi:research` |

## What not to do

- Don't invoke both `implementer` and `rpi/senior-software-engineer` in the
  same flow — pick one based on whether you're inside RPI.
- Don't ask `reviewer` and `rpi/code-reviewer` to review the same diff — one
  pass is enough.
- Don't spawn an agent when a direct tool call would do (Read, Grep, Bash).
  Subagents have their own context windows; cheap lookups don't justify them.

## See also

- `.claude/commands/rpi/research.md`, `.claude/commands/rpi/plan.md`,
  `.claude/commands/rpi/implement.md` — the RPI workflow that drives the
  `rpi/*` suite.

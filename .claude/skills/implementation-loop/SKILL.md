---
name: implementation-loop
description: Use when implementing a planned feature, bug fix, or well-defined task. Triggers on /implement-feature, "implement this", "make this change", "fix this bug". Requires a clear spec or plan to exist first.
user-invocable: true
argument-hint: [task name or description]
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Agent
---

# Implementation Loop Skill

Execute planned work in small, verified steps. Not a planning tool — requires a plan to exist.

## Pre-Flight Check

Before writing any code:
1. Is there a plan in `state/tasks.md`? If not, run `/plan-feature` first.
2. Read every file that will change — fully, not skimmed.
3. Is the plan still valid given the current code? If stale, flag it.
4. Are all open questions from the plan answered? If not, resolve them first.

If any pre-flight check fails: stop, report what's missing, ask.

## Implementation Loop

For each task step:

```
1. Read the relevant files for this step
2. Make the minimal change needed
3. Run the appropriate check (test / lint / typecheck / build)
4. If check fails: fix before moving on — never leave in a broken state
5. Update state/tasks.md — mark step complete
6. Report: what changed, what was checked, what's next
```

## Check Commands

Use RTK for token-efficient output:
```bash
rtk <test-command>     # failures only
rtk <lint-command>     # violations only
rtk <typecheck-cmd>    # errors only
rtk <build-command>    # errors only
```

If no check commands are configured, note this and ask user.

## Scope Discipline

- Do not add features not in the plan.
- Do not refactor code adjacent to the change unless it blocks the task.
- Do not introduce new dependencies without explicit approval.
- Do not change public API signatures unless the plan requires it.
- If you discover a needed change not in the plan: pause, report, ask whether to expand scope.

## Invoking the Implementer Agent

For large, isolated subtasks where context isolation helps:
```
Use Agent(subagent_type: "implementer") with the specific subtask spec.
```
Do not invoke the agent for small edits — main context is fine.

## Output After Completion

```
## Implementation Complete: [task name]

### Changes Made
- `path/to/file.ts` — [what changed and why]
- `path/to/other.ts` — [what changed]

### Checks Run
- Tests: [PASS / FAIL + count]
- Lint: [PASS / FAIL]
- Types: [PASS / FAIL]

### Deviations from Plan
- [Any decision made that was not in the original plan]

### Remaining Steps
- [ ] [Next step from state/tasks.md]
```

## Gotchas

- A passing test suite does not mean the feature is correct — test the golden path manually when possible.
- If a step takes more than ~30 min of agentic work, something is wrong — stop and re-plan.
- Never mark a step complete if tests are failing or the code is in a broken state.
- On merge conflicts: resolve them, never discard changes blindly.
- Security-sensitive changes (auth, payments, migrations) require a `/review-work` step before done.

## Do Not Use When

- There is no clear plan — use `/plan-feature` first.
- The scope is a large refactor requiring architectural decisions — plan it first.
- The task requires understanding a new codebase — use `/onboard-project` first.

# reviewer — persistent memory

This file is loaded into the `reviewer` agent's initial context every time it
is invoked. Keep entries short, factual, and durable — anything session-scoped
belongs in `state/`, not here.

## Heuristics learned over time

- Default to checking error paths first; happy-path bugs are rarer.
- Flag any silent `except Exception: pass` — it almost always hides a defect.
- For DB-touching code, ask "what happens under concurrent writes?".

## Project-specific watchpoints

_(Empty until the project is adopted via `/adopt-project`. Real watchpoints
go here: e.g. "auth/ uses argon2id with cost=4 — do not lower"
or "all migrations must include a tested down() — see docs/adr/0007".)_

## Anti-patterns to flag

- Hardcoded secrets, even in tests
- New abstractions with a single call site
- Tests asserting only that a function "doesn't throw"
- Comments that describe *what* instead of *why*

## See also

- `.claude/rules/karpathy-principles.md` — surgical-changes section
- `.claude/skills/code-review-and-quality.md`

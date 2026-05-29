---
name: git-workflow-and-versioning
description: Use when committing, branching, merging, or releasing. Trunk-based with atomic commits and conventional messages. Triggers on "commit this", "create a branch", "open a PR", "tag a release".
---

# Git Workflow & Versioning

Trunk-based development. Atomic commits. Conventional messages.

## Branching

- `main` is always shippable
- Feature branches off `main`, named `feat/<short-slug>` or `fix/<short-slug>`
- Short-lived (< 2 days). Long branches diverge and merge-conflict.
- Worktrees for parallel work: `git worktree add ../proj-feat-x feat/x`

## Commit discipline

### One concern per commit

Mixing refactor + feature in one commit makes review and bisect harder.
- ❌ "Add user search + refactor user model + fix typo"
- ✅ Three commits, in order: refactor, feature, typo (or split typo to its own PR)

### Conventional commit messages

```
<type>(<scope>): <short summary>

<body explaining WHY, not WHAT>

<footer with refs / breaking-change notes>
```

Types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `perf`, `build`, `ci`

Subject line:
- < 70 chars
- Imperative mood ("add X" not "added X")
- No trailing period
- Lowercase after type

Body:
- WHY this change exists, not WHAT changed (the diff shows what)
- Reference issue / decision if applicable
- Note breaking changes prominently

### Atomic = revertible

Each commit should be safe to `git revert` without breaking main. If it isn't,
the commit is too coupled.

## Pull request rules

- One PR = one logical change
- PR description: what + why + how to verify
- Tests included in the same PR (no "tests in follow-up")
- Squash-merge unless preserving history matters (large refactors)
- Never push to `main` directly — even for typo fixes
- Never `--force` push to a shared branch (your own feature branch is fine, with care)

## Release tagging

- Semver: `MAJOR.MINOR.PATCH`
- Tag format: `v1.2.3`
- Annotated tags: `git tag -a v1.2.3 -m "release notes"`
- Tag on `main` after merge, never on a feature branch

## Anti-rationalization

| Excuse | Counter |
|---|---|
| "I'll just amend that quick fix into the last commit" | If pushed, never amend. New commit. |
| "Squashing later, so messy commits are fine" | Each WIP commit is a debugging surface. Make them clean. |
| "I'll force-push, no one's looking" | Someone always is. Add a new commit instead. |
| "Skip the hook, CI will catch it" | Hooks exist because CI catching it costs time. Don't skip. |
| "PRs slow me down for trivial changes" | Trivial changes break things. PRs aren't slow if reviewed promptly. |

## Done when

- Commit message follows conventional format
- One concern per commit
- Each commit is independently revertible
- Branch is short-lived
- PR description tells reviewer what to verify

---
name: incremental-implementation
description: Use when implementing features that take >1 hour or touch >3 files. Forces thin vertical slices with safe defaults instead of one big-bang change. Triggers on "implement feature X", "build the Y system", or any multi-step build task.
---

# Incremental Implementation

Ship in thin vertical slices. Each slice must be safe to merge on its own.

## Principles

### Vertical slice over horizontal layer

- ❌ Build entire DB layer → entire API layer → entire UI layer
- ✅ Build one feature end-to-end (DB row + endpoint + UI form), then the next

A vertical slice can be tested + demoed. A horizontal layer is invisible
until the next layer arrives.

### Feature flag from day one

If the change is user-facing and might be partial mid-build, gate it:
```ts
if (flags.newCheckoutFlow) {
  // new path
} else {
  // existing path
}
```

Default the flag OFF. Turn ON only when the slice is verified.

### Safe defaults

When introducing a new option, default it to the **current behavior**. New
config knobs must not change behavior on upgrade unless the user opts in.

### Rollback path

Every slice must have an explicit rollback:
- "Revert this commit" (preferred)
- "Set flag X to false"
- "Run migration Y down"

If you can't articulate the rollback in one sentence, the slice is too big
or too entangled.

## Process

1. Take the next task from `state/tasks.md`.
2. Build only that slice.
3. Verify (run tests, manual smoke test, hit the endpoint, check the page).
4. Commit with a focused message.
5. Move task to "Done." Take the next.

Do **not** start the next slice while the current one has failing tests or
unfinished verification.

## Anti-rationalization

| Excuse | Counter |
|---|---|
| "It's faster to build it all at once" | It's faster to *write*, slower to *debug*. Slices localize the bug. |
| "The slices are too small to be meaningful" | If they feel too small, they're the right size. Tiny + verified > big + buggy. |
| "I can't slice this, it's all interconnected" | That's a smell — the design is too coupled. Slicing forces decoupling. |
| "I'll add the feature flag later" | Later means broken main. Add the flag now. |

## Done when

- Slice has tests
- Tests are green
- Behavior verified end-to-end
- Commit message describes the slice
- Rollback path is one sentence

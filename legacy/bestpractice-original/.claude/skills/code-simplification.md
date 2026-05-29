---
name: code-simplification
description: Use when reviewing recently changed code, refactoring, or before claiming a task complete. Removes unnecessary complexity while applying Chesterton's Fence (don't remove what you don't understand). Triggers on "simplify this", "refactor", "clean up", or finishing a feature.
---

# Code Simplification

Remove what isn't earning its keep. But never remove what you don't understand.

## Chesterton's Fence

> Before you remove a fence, find out why someone put it there.

Every line of code was put there for a reason. Maybe a bad reason. Maybe a
forgotten reason. But assume there was a reason.

**Process before deleting any non-obvious code:**
1. `git blame` the line
2. Read the commit message
3. Read the linked issue / PR if any
4. Search recent issues for the same area
5. If you still don't see why → ask, don't delete

## What to simplify

| Smell | Simplification |
|---|---|
| Single-use abstraction | Inline it |
| Wrapper that adds nothing | Use the underlying thing directly |
| Config flag never toggled | Pick the on/off behavior, drop the flag |
| Try/catch that re-throws | Delete it |
| Default parameter never overridden | Make it the only behavior |
| Helper used once | Move into the caller, delete the helper |
| Comment explaining what (not why) | Delete the comment, fix the code if naming was unclear |
| Dead branch (always true / always false) | Pick the live side, delete the dead |
| Premature interface (one impl) | Use the impl directly until the second appears |

## What NOT to simplify

- Code in security-sensitive areas — even if it looks redundant, the redundancy may be defense-in-depth
- Code with a comment explaining a non-obvious constraint — keep the comment AND the code
- Recently changed code (< 1 week) — the team may still be iterating
- Code you don't have tests for — write tests first, *then* refactor
- Anything you can't explain why it exists

## Behavior preservation

Simplification changes structure, **never behavior**. After every change:
1. Run tests
2. If anything goes red, undo the change
3. If the change is large, commit between simplifications so you can bisect

## Anti-rationalization

| Excuse | Counter |
|---|---|
| "This is obviously dead code" | Then the test suite proves it. Delete + run tests. If green, ship. If red, you were wrong. |
| "I'll simplify and tweak the behavior slightly" | Two changes. Two PRs. Don't mix structural + behavioral changes. |
| "The original is over-engineered" | Maybe. Or maybe you don't see the requirement that drove it. Check Chesterton's Fence first. |
| "Tests can stay green, I checked manually" | Then write the test for the case you checked. Manual checks don't survive. |

## Done when

- All simplifications preserve behavior (tests still green)
- Each removal has a justified reason (not just "looks unused")
- Diff is structural-only, no behavior changes mixed in
- Commit message lists what was removed and why

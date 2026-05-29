---
name: test-driven-development
description: Use when implementing any new behavior, fixing a bug, or refactoring. Red-Green-Refactor loop. Triggers on "implement", "add feature", "fix bug", or whenever new code is being written.
---

# Test-Driven Development

Red → Green → Refactor. One cycle per behavior.

## Process

### Red — Write the failing test first

1. Pick **one** observable behavior (not "the feature" — one assertion).
2. Write the test. It must fail for the right reason (not "module not found").
3. Run it. Confirm: red, with the assertion message you expected.

If you can't write the test before the code, you don't yet understand the
behavior well enough to implement it. Stop, think, ask.

### Green — Smallest change that makes the test pass

1. Write the **dumbest** code that turns the test green. Hard-coded values
   are fine in this step.
2. Run the test. Confirm: green.
3. Run the **whole** test suite. Confirm: still green elsewhere.

### Refactor — Clean up, tests stay green

1. Eliminate duplication, rename for clarity, extract obvious helpers.
2. Run tests after each refactor step. If anything goes red, undo immediately.
3. Stop when the code reads cleanly. Don't over-extract.

## Test pyramid

- **Unit** (most): individual functions/components in isolation
- **Integration** (some): module boundaries, real DB, real HTTP
- **E2E** (few): full user flows, browser-driven

If you find yourself writing many E2E tests for logic that could be unit-tested,
push the test down the pyramid.

## What NOT to test

- Framework internals (the framework already tests itself)
- Trivial getters/setters
- Implementation details that change without behavior changing
- Mocked code that mocks more than it tests

## Anti-rationalization

| Excuse | Counter |
|---|---|
| "I'll add tests after" | After never comes. The test exists to drive the design — writing it first is the point. |
| "The code is too simple to need a test" | Then the test is also simple. Write it. |
| "I'll just test it manually" | Manual tests don't survive the next refactor. Automate. |
| "Tests are slowing me down" | Untested code slows you down on every future change. Tests are leverage. |
| "The test is hard to write" | That's a signal the code is hard to test — fix the code, not skip the test. |

## Done when

- New behavior has at least one test that fails without the new code
- All previously-green tests are still green
- Test names describe behavior in plain language

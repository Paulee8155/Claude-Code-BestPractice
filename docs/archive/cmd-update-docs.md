---
description: Update documentation after code changes to keep docs in sync with the implementation.
argument-hint: [what changed]
---

# /update-docs $ARGUMENTS

Update documentation for: **$ARGUMENTS**

## Process

1. **Identify what changed**
   - Check `git diff` for the scope of changes
   - Note new functions, changed interfaces, removed features, new config options

2. **Find affected documentation**
   - `README.md` — if setup, usage, or key features changed
   - `docs/api.md` — if API surface changed
   - `PROJECT_RULES.md` — if conventions changed
   - `CHANGELOG.md` — if this is a user-facing change
   - Inline comments — if complex logic changed
   - OpenAPI/schema files — if API contracts changed

3. **Update each affected document**
   - Be accurate — read the code, do not summarize from memory
   - Keep docs at the same level of abstraction as the code they describe
   - Remove outdated information — stale docs are worse than no docs

4. **Verify accuracy**
   - Run the documented command/example to confirm it still works
   - Check that code snippets in docs match the current implementation

## Documentation Standards

- Write for the reader who is new to this area
- Use present tense: "Returns X" not "Will return X"
- Lead with what it does, then how to use it
- Include examples for non-trivial usage
- Do not explain what the code does — explain what the user needs to know

## What NOT to document
- Internal implementation details that will change
- Obvious behavior that matches the name
- Temporary workarounds (fix the root issue instead)

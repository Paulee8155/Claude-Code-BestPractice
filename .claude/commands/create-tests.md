---
description: Generate tests for existing code, covering happy paths, edge cases, and error scenarios.
argument-hint: [file-path or function/module name]
---

# /create-tests $ARGUMENTS

Create tests for: **$ARGUMENTS**

## Process

1. **Read the code under test**
   - Understand what the function/module does
   - Identify inputs, outputs, and side effects
   - Note dependencies that need to be mocked or stubbed

2. **Identify test cases**
   - Happy path (expected inputs, expected outputs)
   - Edge cases (empty, null, zero, boundary values)
   - Error cases (invalid input, missing data, external failures)
   - Integration points (calls to external services, DB, filesystem)

3. **Check existing test patterns**
   - Read existing test files before writing new ones
   - Match the project's test structure and style
   - Use the same test framework, assertion style, and setup patterns

4. **Write tests**
   - One test per behavior, not one test per function
   - Use descriptive test names: `it('returns null when user is not found')`
   - Do not hardcode magic values — use variables with clear names
   - Do not test implementation details — test observable behavior

5. **Run and verify**
   - Run the tests
   - Confirm they pass on correct code
   - Confirm they fail when the behavior is broken (if possible to verify)

## Test Structure Template

```
describe('[Unit under test]', () => {
  describe('[scenario]', () => {
    it('[expected behavior]', () => {
      // arrange
      // act
      // assert
    })
  })
})
```

## What NOT to do
- Do not test private internals
- Do not mock everything — test the real integration where possible
- Do not write tests that always pass regardless of implementation
- Do not write tests that duplicate the implementation logic

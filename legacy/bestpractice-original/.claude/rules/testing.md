---
paths:
  - "**/*.test.*"
  - "**/*.spec.*"
  - "**/tests/**"
  - "**/test/**"
  - "**/__tests__/**"
---

# Testing Rules

These rules apply when working in test files.

## Core Principles

- Test behavior, not implementation
- One test per distinct behavior
- Tests must fail when the behavior they test is broken
- Do not write tests just to increase coverage numbers

## Test Naming

Describe the expected behavior, not the function:
```
✓ returns null when user is not found
✓ throws AuthError when token is expired
✓ sends welcome email after registration

✗ test getUserById
✗ test token validation
```

## Test Structure (Arrange-Act-Assert)

```
// arrange — set up the state needed
const user = createUser({ role: 'admin' })

// act — trigger the behavior
const result = await getPermissions(user.id)

// assert — verify the outcome
expect(result).toContain('delete:all')
```

## What to Test

**Always test:**
- Happy path with valid inputs
- Error cases and rejected inputs
- Boundary values (0, -1, max, empty string, null)
- Security-critical paths (auth, permissions, input validation)

**Avoid testing:**
- Framework internals
- Trivial getters/setters
- Generated code
- Private implementation details

## Mocking

- Mock at the system boundary (HTTP layer, DB, filesystem)
- Do not mock internal functions of the module under test
- Use real data structures — only mock external side effects
- Restore mocks after each test

## Forbidden Patterns

- Do not hardcode expected values to match implementation
- Do not skip assertions (`expect(true).toBe(true)`)
- Do not catch errors just to pass the test
- Do not use `any` casts to bypass type errors in tests

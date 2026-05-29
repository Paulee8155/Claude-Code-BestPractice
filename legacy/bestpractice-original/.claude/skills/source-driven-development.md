---
name: source-driven-development
description: Use BEFORE making any framework / library / API decision. Forces grounding in official docs instead of training-data memory. Triggers on "how do I use X library", "what's the right pattern for Y framework", or any time you're about to write code against an external API.
---

# Source-Driven Development

LLM training data goes stale. Library APIs change. Don't code from memory —
code from the source.

## When this applies

Any time you're about to:
- Write code that calls an external library/SDK
- Use a framework feature you haven't touched in this session
- Configure a tool (build system, CI, deployment, ORM)
- Choose between two API patterns

## Process

### Step 1 — Identify what you actually need to know

Be specific: not "how do I use Prisma," but "how do I write a transaction
with rollback on error in Prisma 5."

### Step 2 — Get current docs

In priority order:
1. **`context7` MCP** — `query-docs` with the library + question. Designed for this.
2. **Official docs URL** via `WebFetch` with a focused prompt
3. **Web search** for "library version + specific question"
4. **GitHub source** — read the actual implementation, not just types

Do **not** rely on training-data memory for syntax or API shape. Even if you
"know" the answer, verify the version matches the project's.

### Step 3 — Quote the source

When using documented behavior, leave a comment:
```ts
// Per Prisma 5 docs: $transaction rolls back on any thrown error
```

This is not optional for non-obvious behavior. Future-you will thank you.

### Step 4 — Cross-check the version

The project's `package.json` / `Cargo.toml` / etc. pins the version. Verify
the docs you read match that version. A solution that works in v5 may not
in v4.

## Anti-rationalization

| Excuse | Counter |
|---|---|
| "I know this API" | Then verifying takes 30 seconds and confirms it. Verify. |
| "The docs are slow / hard to find" | context7 MCP is fast and focused. Use it. |
| "Stack Overflow says..." | SO answers go stale. Check the date and the version. Prefer official docs. |
| "I'll fix it if it doesn't work" | The bug from outdated knowledge often doesn't surface until production. Verify upfront. |

## Done when

- The code matches current docs for the project's version
- Non-obvious behavior is annotated with a doc reference
- You can point to the exact source you used

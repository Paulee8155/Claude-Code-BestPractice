---
name: documentation-and-adrs
description: Use when making architecturally significant decisions, adding API endpoints, or writing user-facing docs. Captures the WHY behind decisions in Architecture Decision Records (ADRs). Triggers on "document this decision", "write the ADR", "update the API docs".
---

# Documentation & ADRs

Document the WHY of decisions and the HOW of public interfaces. Skip
documenting the WHAT (the code is the WHAT).

## When to write what

| Doc type | When | Where |
|---|---|---|
| **ADR** | Significant + irreversible architecture decision | `docs/adr/NNNN-title.md` |
| **API doc** | Adding/changing public endpoints | `docs/api/` or OpenAPI spec |
| **README** | New project, or major shift in how to run/use | `README.md` |
| **CHANGELOG** | Every release with user-visible changes | `CHANGELOG.md` |
| **Inline comment** | Non-obvious WHY (constraint, workaround, surprise) | The code itself |
| **Skip docs** | Refactor, internal helper, anything well-named | — |

## Architecture Decision Records (ADRs)

An ADR captures **one** decision. Format:

```markdown
# NNNN — Title (one-line decision)

Date: YYYY-MM-DD
Status: Proposed | Accepted | Deprecated | Superseded by NNNN

## Context
What problem are we solving? What constraints apply?
2-3 paragraphs.

## Decision
What did we decide? Stated as a complete sentence.
"We will use X to do Y, despite Z, because W."

## Consequences
- Positive: ...
- Negative: ...
- Neutral: ...

## Alternatives considered
- Option A — rejected because ...
- Option B — rejected because ...
```

Number ADRs sequentially: `0001-use-postgres-for-state.md`,
`0002-rest-not-graphql.md`, etc.

ADRs are immutable once accepted. New decision → new ADR with
`Supersedes: NNNN`.

## API documentation

For every public endpoint:
- HTTP method + path
- Request shape (body, query, headers)
- Response shape (success + each error case)
- Auth requirement
- Rate limit
- Example request + example response

Generate from code (OpenAPI / Swagger / TypeSpec) where possible — hand-written
docs go stale fast.

## What NOT to document

- Method signatures the IDE shows
- Self-evident code (`getUserById(id)` doesn't need a docstring)
- Implementation details that may change
- Things you "might" need later — write when you actually need

## Inline comments

Default: write none. Only add a comment when:
- A constraint is hidden (`// must be < 1024 — kernel limit on this socket type`)
- Behavior would surprise a reader (`// this looks like a bug but it's intentional, see #123`)
- A workaround for a third-party issue (`// upstream bug X causes Y until v3.2`)

Never write comments that just restate the code (`// loop over users`).

## Anti-rationalization

| Excuse | Counter |
|---|---|
| "Documentation slows me down" | Future-you spends 10× the time recovering context if you skip. |
| "The code is self-documenting" | Code documents WHAT. Comments + ADRs document WHY. They're different. |
| "I'll write the ADR after we ship" | After-ship docs are written from memory and lie. Write while the decision is fresh. |
| "Inline comments are clutter" | Useless ones are. Constraint-explaining ones are leverage. |

## Done when

- Significant decisions have ADRs
- Public APIs are documented (preferably from spec)
- Non-obvious code has WHY comments (no WHAT comments)
- README answers "what is this + how do I run it"

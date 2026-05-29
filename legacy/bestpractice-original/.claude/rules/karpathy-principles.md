---
paths:
  - "**/*"
---

# Karpathy Principles — Always-On Coding Discipline

Adapted from [forrestchang/andrej-karpathy-skills](https://github.com/forrestchang/andrej-karpathy-skills).
These four rules apply to **every** coding task, regardless of language or
domain. They counteract the most common LLM failure modes.

---

## 1. Think Before Coding

Before any non-trivial change, write 3-5 sentences answering:
- What is the user actually trying to accomplish? (not just literal request)
- Which files / systems will this touch?
- What's the simplest version that works?
- What could go wrong, and what's the rollback?

If you can't answer all four, stop and read more code or ask the user.

**Anti-pattern:** writing code first, then justifying it. If you're already
typing implementation, you skipped this step.

---

## 2. Simplicity First

- Three similar lines beat a premature abstraction.
- No factory / strategy / wrapper for a single use case.
- No config flag for a behavior that's always going to be on.
- No "future-proofing" for requirements that don't exist.
- No error handling for cases that physically can't happen.

**Test:** could a junior dev read this in 30 seconds and understand it? If
not, simplify until they can.

---

## 3. Surgical Changes

- One concern per change. One concern per commit.
- Don't refactor adjacent code "while you're there" — that's a separate task.
- Don't rename variables, reformat, or "clean up" unrelated lines.
- Don't add features the user didn't ask for, even if they seem obvious.
- Don't delete things you "think" are unused — verify with grep first.

**The diff is the contract.** Anything in the diff must be required by the
stated task.

---

## 4. Goal-Driven Execution

- Define done before starting: "this is complete when X compiles + Y test
  passes + Z behavior is observable."
- Verify with concrete evidence before claiming completion. "Looks right"
  is not evidence — run the test, check the output, open the page.
- If verification reveals a problem, fix it before reporting. Don't ship
  broken work and apologize.
- Report what changed + what you verified. Not "I made the change," but
  "Edited foo.ts:42-58, ran `npm test`, all 17 tests pass."

---

## Common excuse → counter-argument

| Excuse | Counter |
|---|---|
| "It's a small change, I don't need to think first" | Small changes are where assumption-driven bugs hide. Think anyway. |
| "I'll abstract this in case we need it later" | YAGNI. Add the abstraction when the second use case appears, not before. |
| "I'll just clean up this adjacent code while I'm here" | That's scope creep. Make a separate task. |
| "I tested it manually, it works" | Then write the automated test. Manual testing doesn't survive refactors. |
| "The code looks correct" | Run it. "Looks correct" has shipped countless bugs. |

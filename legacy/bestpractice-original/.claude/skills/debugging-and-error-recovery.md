---
name: debugging-and-error-recovery
description: Use when encountering ANY bug, test failure, error message, or unexpected behavior — BEFORE proposing fixes. Triggers on "X is broken", "test fails", "I'm getting error", "something's wrong", or any debugging request.
---

# Debugging & Error Recovery

Five-step triage. Skip a step → ship a guess.

## Process

### Step 1 — Reproduce reliably

You don't have a bug until you can reproduce it on demand.
- What's the exact input?
- What's the exact command / page / API call?
- What's the smallest reproduction?

If you can't reproduce, the bug isn't fixed by your patch — it's hidden.

### Step 2 — Read the actual error

- Read the **full** stack trace, not just the top line
- Check log files, not just stdout
- Look for the **first** error, not the most recent (errors cascade)
- Read **everything** between "starting" and "error" — the cause is usually there

Don't pattern-match the error string to a fix you remember. Understand
what's being asserted.

### Step 3 — Hypothesize ONE cause

State a single hypothesis: "I think the bug is X because Y."
- Predict what would prove it true
- Predict what would prove it false

Two hypotheses at once = you'll confirm both with confirmation bias. One.

### Step 4 — Test the hypothesis

The cheapest test that distinguishes true from false:
- Add one log line, re-run, see what's printed
- Inspect the variable in question
- Try the failing case with one input changed
- Bisect the commit history if the bug is new

If the test contradicts the hypothesis, **discard it** and form a new one
from the new evidence. Don't tweak the hypothesis to fit.

### Step 5 — Fix at the cause, not the symptom

A fix that handles the symptom (try/catch around the error, default value,
retry loop) without fixing the cause is technical debt.
- Symptom fix: "the function crashes on null input → check for null"
- Cause fix: "the function crashes on null input → why is it being called with null?"

Sometimes the symptom fix IS the right answer (the input is genuinely
optional and the cause is "we forgot null is valid"). Be explicit about
which one you chose and why.

## After fixing

- Add a regression test that reproduces the original bug
- Verify the fix on the original reproduction from Step 1
- Run the full test suite — fixes have side effects

## Anti-rationalization

| Excuse | Counter |
|---|---|
| "I think I know what's wrong, let me just try this" | That's guessing. Reproduce + hypothesize + test. |
| "The error message says X so I'll fix X" | Errors lie about causes. Read the trace. |
| "I'll fix this and that other thing too" | Two fixes hide which one solved the bug. One at a time. |
| "It works now, must be fixed" | Coincidence is a thing. Verify on the original repro. |
| "I can't reproduce it, but I'll patch defensively" | Defensive patches hide bugs and add complexity. Find the repro first. |

## Done when

- Original reproduction no longer fails
- Regression test exists and is in the suite
- Full suite is green
- Root cause is named in the commit message

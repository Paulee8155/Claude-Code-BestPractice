# Checklist: Initialize a New Project

Run this when setting up a brand-new project with this harness.

---

## 1. Harness Setup

- [ ] Copy harness files into new project directory
- [ ] Fill in `PROJECT_RULES.md` (tech stack, conventions, constraints)
- [ ] Fill in `.claude/templates/project-profile.md`
- [ ] Fill in `.claude/templates/tech-stack.md`
- [ ] Review `.claude/settings.json` — adjust allowed/denied commands for this project's toolchain
- [ ] Delete template sections that don't apply

## 2. context-mode Plugin

context-mode provides session continuity and context-efficient tool routing. Required for the harness to work correctly.

- [ ] In Claude Code: `/plugin marketplace add mksglu/context-mode`
- [ ] In Claude Code: `/plugin install context-mode@context-mode`
- [ ] In Claude Code: `/reload-plugins`
- [ ] Verify: `/context-mode:ctx-doctor` — all checks show `[x]`

If already installed globally, skip — it activates per-project automatically.

---

## 2. Repository Setup

- [ ] `git init`
- [ ] Create `.gitignore` (include `.env`, `*.local`, `node_modules/`, etc.)
- [ ] Create `.env.example` with all required variables (no real values)
- [ ] Initial commit: `git commit -m "chore: initialize project with harness"`

---

## 3. Development Environment

- [ ] Document setup steps in `README.md`
- [ ] Verify setup works from scratch on a clean machine (or document assumptions)
- [ ] Install dependencies
- [ ] Confirm `npm run dev` (or equivalent) starts the application

---

## 4. First Architecture Decision

- [ ] Run `/analyze-project` or manually document initial stack choice
- [ ] Write first ADR in `docs/decisions.md` (even if just "chose X because Y")

---

## 5. Test Baseline

- [ ] Test framework installed and configured
- [ ] At least one test exists and passes
- [ ] Test command documented in `PROJECT_RULES.md`

---

## 6. CI/CD (if applicable)

- [ ] CI pipeline runs on push
- [ ] CI runs tests and linter
- [ ] Deployment pipeline documented or automated

---

## 7. First Session Check

After completing setup, run in Claude Code:
- `/analyze-project` — let Claude map the project
- `/project-status` — confirm Claude sees the correct state
- Add first real task to `docs/tasks.md`

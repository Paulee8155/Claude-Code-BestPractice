---
description: Analyze the project structure, tech stack, and conventions to build a complete mental model before starting work.
---

# /analyze-project

Systematically analyze this project and produce a structured summary.

## Steps

1. **Read configuration files**
   - `CLAUDE.md`, `PROJECT_RULES.md`
   - `package.json` / `pyproject.toml` / `go.mod` / `Cargo.toml` (whichever exists)
   - `.env.example` or equivalent
   - Linter and formatter config files

2. **Map the directory structure**
   - List top-level directories and their purpose
   - Identify entry points (main files, index files, app bootstrapping)
   - Identify test locations

3. **Understand the tech stack**
   - Runtime, framework, database, auth, deployment
   - Key dependencies and their versions

4. **Trace one representative flow**
   - Pick a simple existing feature and trace it end-to-end
   - Identify layers: routing → logic → data → response

5. **Identify conventions**
   - Naming patterns (files, functions, variables, DB tables)
   - Code organization patterns
   - Error handling approach
   - Test patterns

6. **Check current state**
   - `git status` — uncommitted changes
   - `docs/tasks.md` — in-progress work
   - `docs/context.md` — session handoff notes

## Output

Produce a concise project summary with:
- Stack and key dependencies
- Directory map with purpose annotations
- Conventions Claude must follow
- Any known constraints or sensitive areas
- Recommended starting point for the requested task

Save summary to `docs/context.md` if it will be useful across sessions.

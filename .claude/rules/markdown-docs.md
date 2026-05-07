---
paths:
  - "**/*.md"
  - "**/*.mdx"
---

# Markdown & Documentation Rules

Lazy-loaded — applies whenever Claude reads or edits a Markdown file in this
project.

## Scope of a single document

- **One topic per file.** If a doc grows past ~300 lines or starts covering
  unrelated concerns, split it.
- **Navigable from the top.** Start with a one-paragraph summary that tells the
  reader why the file exists and what it answers.
- **End with `## See also`** when there are sibling docs worth linking.

## Links & paths

- **Use relative links** (`../state/context.md`) — never raw GitHub URLs for in-repo files.
- External references go in a dedicated section at the bottom.
- When linking code, use `path:line` form (`.claude/hooks/scripts/hooks.py:42`).

## Headings

- Single `#` H1 — only as document title.
- Use `##` for top-level sections, `###` for sub-sections. Avoid going deeper
  than `####`.
- Sentence case for headings (`## Hook system`, not `## Hook System`).

## Lists, tables, code

- **Tables** for comparisons or option lists with ≥3 columns of structured
  data.
- **Lists** for everything else; bullets short, no trailing periods unless the
  bullet is a full sentence.
- **Code blocks** always fenced with language hint:
  ```ts
  // good
  ```
- Inline code for filenames, env vars, command names: `.claude/settings.json`,
  `$PATH`, `rtk gain`.

## Frontmatter for `.claude/rules/`

- All rules live under `.claude/rules/` and require frontmatter:
  ```yaml
  ---
  paths:
    - "<glob>"
  ---
  ```
- A rule with no `paths:` is loaded globally — keep those rare and short.

## Tone & form

- Imperative voice for instructions ("Run the self-test", not "You should run
  the self-test").
- No emoji unless the user explicitly asks.
- No marketing language. State the rule, then move on.

## What does **not** belong in markdown

- Running plans, todo lists, or transient session state — those go in `state/`.
- Generated content — link to its source of truth, do not duplicate.

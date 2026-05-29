---
paths:
  - "**/*"
---

# claude-mem — Cross-session Memory

claude-mem ([repo](https://github.com/thedotmack/claude-mem)) is the harness's
memory layer. It captures observations across sessions into a SQLite + Chroma
vector store and exposes them via MCP tools.

**Web viewer:** `http://localhost:37777` (worker auto-starts after install)

**Install / verify:** `npx claude-mem install` then restart Claude Code.

---

## When to query memory

Always query memory **before** asking the user a question that prior sessions
might have already answered.

| Situation | Tool |
|---|---|
| "What were we working on?" after `/resume` | `search("last session summary")` then `timeline` |
| "Did we already decide X?" | `search("decision X rationale")` |
| "What did we reject and why?" | `search("rejected approach")` |
| "Show recent activity around topic Y" | `timeline(topic: "Y", limit: 20)` |
| "Get full detail of observation #42" | `get_observations(ids: [42])` |

---

## MCP Tools

### `search(query, limit?)`
Hybrid semantic + keyword search across all observations. Returns ranked snippets.
- Use natural-language queries — semantic embeddings handle synonyms
- Cheap (~progressive disclosure, only snippets enter context)

### `timeline(topic?, before?, after?, limit?)`
Chronological window of observations. Use to reconstruct sequence of events.

### `get_observations(ids[])`
Fetch full body of one or more observations by ID. Batch when you need detail
on several entries — never call once per ID.

---

## Privacy / scope

This harness configures claude-mem **per-project** (memory does not leak between
projects). Toggle in `~/.claude-mem/settings.json` if cross-project recall is
desired.

---

## Forbidden

- Do **not** store secrets, API keys, or `.env` content in memory — claude-mem
  observations are persistent and searchable.
- Do **not** delete the memory database without user confirmation. The
  `~/.claude-mem/` directory is the source of truth across sessions.
- Do **not** rely on memory as a substitute for `state/` files. State files are
  visible to humans + Git; memory is for richer context recall.

---

## Disconnect / recovery

If MCP tools (`search`, `timeline`, `get_observations`) return errors:
1. Check worker: `curl -s http://localhost:37777/health` (should return OK)
2. If worker is down: `npx claude-mem restart` (or restart Claude Code)
3. Use `state/context.md` and `git log` as fallback — never silently degrade
   to "no memory available"; tell the user.

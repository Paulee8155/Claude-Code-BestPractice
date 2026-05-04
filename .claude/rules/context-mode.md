# context-mode — Tool Routing Reference

context-mode is installed as a Claude Code plugin. It captures every session event into a per-project SQLite knowledge base and restores full working state automatically after compaction.

**Plugin:** `context-mode@context-mode` — install with `/plugin install context-mode@context-mode`
**Verify:** run `/context-mode:ctx-doctor` — all checks must show `[x]`

---

## Mandatory Routing Rules

context-mode hooks intercept certain tool calls. Using the blocked tools causes raw data to flood the context window.

### WebFetch → ctx_fetch_and_index + ctx_search

```
# BLOCKED: WebFetch(url)
# USE INSTEAD:
ctx_fetch_and_index(url: "https://...", source: "descriptive-label")
ctx_search(queries: ["what you're looking for"], source: "descriptive-label")

# Multi-URL (parallel):
ctx_fetch_and_index(
  requests: [{url: "...", source: "a"}, {url: "...", source: "b"}],
  concurrency: 5
)
```

### curl / wget → ctx_execute with fetch()

```
# BLOCKED: Bash("curl https://...")
# USE INSTEAD:
ctx_execute(language: "javascript", code: `
  const r = await fetch("https://...");
  const data = await r.json();
  console.log(JSON.stringify(data, null, 2));
`)
```

### Bash > 20 lines output → ctx_execute

```
# Bash only for: git, mkdir, rm, mv, cd, ls, npm install, pip install
# For everything else that produces large output:
ctx_execute(language: "shell", code: "your-command-here")

# Multiple commands + search in one call:
ctx_batch_execute(
  commands: [
    {label: "tests", command: "npm test"},
    {label: "types", command: "tsc --noEmit"}
  ],
  queries: ["failing", "error"]
)
```

### Large grep → ctx_execute

```
# BLOCKED: Bash("grep -r pattern .")  — when result > 20 lines
# USE INSTEAD:
ctx_execute(language: "shell", code: "grep -r 'pattern' . --include='*.ts'")
```

### Data analysis / processing → ctx_execute (Think in Code)

```
# Never read raw data into context to analyze manually.
# Write code that does the analysis and console.log() only the result.
ctx_execute(language: "javascript", code: `
  const fs = require('fs');
  const data = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log('Dependencies:', Object.keys(data.dependencies).length);
`)
```

---

## Session Continuity

context-mode uses 4 hooks to maintain state across compactions:

| Hook | Role |
|---|---|
| `PreToolUse` | Enforce routing, capture tool intent |
| `PostToolUse` | Capture tool results to SQLite |
| `PreCompact` | Build priority-tiered XML snapshot (≤ 2 KB) |
| `SessionStart` | Restore snapshot, inject session guide into context |

**On resume after compaction:**
```
ctx_search(queries: ["summary", "tasks", "last request"], sort: "timeline")
```

**Recovery queries:**

| Need | Query |
|---|---|
| What were we working on? | `ctx_search(queries: ["summary"], source: "compaction", sort: "timeline")` |
| What was decided? | `ctx_search(queries: ["decision"], source: "decision", sort: "timeline")` |
| What should NOT be repeated? | `ctx_search(queries: ["rejected"], source: "rejected-approach")` |
| What are the active tasks? | `ctx_search(queries: ["tasks pending"], sort: "timeline")` |

---

## Available Commands

| Command | What it does |
|---|---|
| `/context-mode:ctx-stats` | Context savings per tool, tokens, ratios |
| `/context-mode:ctx-doctor` | Diagnose hooks, runtimes, FTS5, registration |
| `/context-mode:ctx-upgrade` | Pull latest, rebuild, fix hooks |

Or via MCP tools: `ctx_stats`, `ctx_doctor`, `ctx_upgrade`, `ctx_purge`.

---

## Context Savings (typical)

| Tool | Without context-mode | With context-mode |
|---|---|---|
| `ctx_execute` | 56 KB raw output | 299 B (stdout only) |
| `ctx_execute_file` | 45 KB file content | 155 B (result only) |
| `ctx_fetch_and_index` | 60 KB raw HTML | 40 B (indexed, searchable) |
| `ctx_batch_execute` | 986 KB combined | 62 KB |

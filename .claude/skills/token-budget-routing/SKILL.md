---
name: token-budget-routing
description: Use when deciding which tool to use for shell commands, file analysis, web fetching, or large output operations. Triggers on any uncertainty about direct Bash vs RTK vs context-mode tools.
user-invocable: false
allowed-tools: Bash
---

# Token Budget Routing Skill

Route every operation to the most token-efficient tool. Wrong routing floods context and costs tokens.

## Decision Tree

```
Need to run a shell command?
├── Output <20 lines expected → rtk <cmd>
├── Output 20-200 lines expected → ctx_execute(language:"shell", code:"...")
└── Output >200 lines / full analysis needed → ctx_batch_execute with queries

Need to fetch a URL?
├── Single URL → ctx_fetch_and_index(url, source) then ctx_search(queries)
└── Multiple URLs → ctx_fetch_and_index(requests:[...], concurrency:5)

Need to read a file?
├── To EDIT it → Read tool (must have content in context)
├── To ANALYZE it → ctx_execute_file(path, language, code)
└── To SEARCH it → ctx_execute(language:"shell", code:"grep ...")

Need to analyze data?
└── Always → ctx_execute with console.log() of only the result — never raw data in context
```

## RTK Commands (with typical savings)

```bash
rtk git status / diff / log     # 60-80%
rtk git add / commit / push     # ultra-compact confirmations
rtk jest / vitest / pytest      # failures only (90-99%)
rtk cargo build / tsc / lint    # errors grouped (80-90%)
rtk ls <path>                   # tree format (65%)
rtk grep <pattern>              # grouped by file (75%)
rtk gh pr view / checks         # compact (70-87%)
rtk docker ps / logs            # compact (85%)
```

## Context-Mode Patterns

```javascript
// Single command with search
ctx_execute(language: "shell", code: "npm test 2>&1")

// Multiple commands + indexed search
ctx_batch_execute(
  commands: [
    {label: "tests", command: "npm test"},
    {label: "types", command: "tsc --noEmit"}
  ],
  queries: ["error", "failing"]
)

// Web fetch + search
ctx_fetch_and_index(url: "https://...", source: "docs")
ctx_search(queries: ["what I need"], source: "docs")

// Data analysis
ctx_execute(language: "javascript", code: `
  const data = JSON.parse(require('fs').readFileSync('data.json'));
  console.log('count:', data.length);  // only the answer
`)
```

## Hard Prohibitions

- **No `rtk init` or RTK global config changes** without explicit user confirmation
- **No `ctx_purge`** without explicit user confirmation — destroys session history
- **No raw WebFetch** — context-mode hook will block it
- **No `curl` / `wget` in Bash** for fetching URLs — use ctx_execute with fetch()
- **No Bash for commands >20 lines output** — use ctx_execute instead
- **No Read for analysis** — use ctx_execute_file; Read is only for files you will Edit

## When Raw Output Is Needed

If the user explicitly needs unfiltered output (debugging RTK, inspecting raw format):
```bash
rtk proxy <cmd>   # bypasses RTK filtering
```
Or use Bash directly after confirming with user.

## Gotchas

- RTK passes through unknown commands unchanged — always safe to prefix with `rtk`.
- ctx_execute for shell runs in a subprocess; working directory may differ — use absolute paths.
- ctx_fetch_and_index has a concurrency cap; for >10 URLs, batch in groups.
- After compaction, ctx knowledge base is preserved — no need to re-index.

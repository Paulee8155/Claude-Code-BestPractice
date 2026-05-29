# RTK (Rust Token Killer) — Token-Optimized Commands

<!-- rtk-instructions v2 -->

## Golden Rule

**Always prefix commands with `rtk`**. If RTK has a dedicated filter, it uses it. If not, it passes through unchanged. RTK is always safe to use.

**In command chains with `&&`, use `rtk` on each command:**
```bash
rtk git add . && rtk git commit -m "msg" && rtk git push
```

## RTK Commands by Workflow

### Build & Compile (80-90% savings)
```bash
rtk cargo build         # Cargo build output
rtk tsc                 # TypeScript errors grouped by file (83%)
rtk lint                # ESLint/Biome violations grouped (84%)
rtk next build          # Next.js build with route metrics (87%)
```

### Test (60-99% savings)
```bash
rtk jest / rtk vitest   # Failures only (99.5%)
rtk playwright test     # Playwright failures (94%)
rtk pytest              # Python failures (90%)
rtk cargo test          # Cargo failures (90%)
rtk test <cmd>          # Generic wrapper — failures only
```

### Git (59-80% savings)
```bash
rtk git status          # Compact status
rtk git log             # Compact log (all flags work)
rtk git diff            # Compact diff (80%)
rtk git add/commit/push # Ultra-compact confirmations
```

### GitHub (26-87% savings)
```bash
rtk gh pr view <num>    # Compact PR view (87%)
rtk gh pr checks        # Compact PR checks (79%)
rtk gh run list         # Compact workflow runs (82%)
rtk gh issue list       # Compact issue list (80%)
```

### Files & Search (60-75% savings)
```bash
rtk ls <path>           # Tree format, compact (65%)
rtk grep <pattern>      # Search grouped by file (75%)
rtk find <pattern>      # Find grouped by directory (70%)
```

### Infrastructure (85% savings)
```bash
rtk docker ps/images/logs   # Compact Docker output
rtk kubectl get/logs         # Compact Kubernetes output
```

### Meta Commands
```bash
rtk gain                # View token savings statistics
rtk gain --history      # Command history with savings
rtk discover            # Analyze sessions for missed RTK usage
```

## Token Savings Overview

| Category | Typical Savings |
|----------|-----------------|
| Tests | 90-99% |
| Build | 70-87% |
| Git | 59-80% |
| GitHub | 26-87% |
| Package Managers | 70-90% |
| Files/Search | 60-75% |
| Infrastructure | 85% |
| Network (curl/wget) | 65-70% |

Overall average: **60-90% token reduction** on common development operations.
<!-- /rtk-instructions -->

#!/usr/bin/env bash
# setup.sh — One-time setup for the project harness.
#
# Use when: starting a NEW project from this harness.
# What it does:
#   1. Verifies required tools (RTK, Bun, git)
#   2. Verifies context-mode plugin is registered
#   3. Interactively fills PROJECT_RULES.md from your answers
#   4. Initializes state/ files with project name + date
#
# Idempotent: safe to re-run. Already-filled fields are skipped.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

C_GREEN='\033[0;32m'
C_YELLOW='\033[1;33m'
C_RED='\033[0;31m'
C_BLUE='\033[0;34m'
C_RESET='\033[0m'

ok()    { printf "${C_GREEN}[OK]${C_RESET}    %s\n" "$1"; }
warn()  { printf "${C_YELLOW}[WARN]${C_RESET}  %s\n" "$1"; }
err()   { printf "${C_RED}[FAIL]${C_RESET}  %s\n" "$1"; }
info()  { printf "${C_BLUE}[INFO]${C_RESET}  %s\n" "$1"; }
ask()   { printf "${C_BLUE}?${C_RESET} %s " "$1"; }

# ---------- 1. Tool checks ----------
echo
info "Checking required tools..."

check_tool() {
  local name="$1"; local cmd="$2"; local install_hint="$3"
  if command -v "$cmd" >/dev/null 2>&1; then
    ok "$name found ($($cmd --version 2>&1 | head -1))"
    return 0
  else
    err "$name NOT found"
    echo "      Install: $install_hint"
    return 1
  fi
}

MISSING=0
check_tool "git"  git  "apt install git" || MISSING=1
check_tool "RTK"  rtk  "curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/master/install.sh | sh" || MISSING=1
check_tool "Bun"  bun  "curl -fsSL https://bun.sh/install | bash"                                      || MISSING=1

if [[ $MISSING -eq 1 ]]; then
  echo
  err "Missing tools above. Install them, then re-run setup."
  exit 1
fi

# ---------- 2. claude-mem check ----------
echo
info "Checking claude-mem (cross-session memory)..."
if [[ -d "$HOME/.claude-mem" ]] && [[ -f "$HOME/.claude-mem/settings.json" ]]; then
  ok "claude-mem installed"
else
  warn "claude-mem not installed"
  echo "      Install:  npx claude-mem install"
  echo "      Web UI:   http://localhost:37777 (after install + restart Claude Code)"
  read -rp "      Install now? (y/N) " yn
  if [[ "$yn" =~ ^[Yy]$ ]]; then
    npx claude-mem install || warn "claude-mem install failed — install manually later"
  fi
fi

# ---------- 3. Fill PROJECT_RULES.md ----------
echo
info "Filling PROJECT_RULES.md..."

if grep -q "^Project Name:    \[" PROJECT_RULES.md 2>/dev/null; then
  ask "Project name?"; read -r PROJECT_NAME
  ask "Project type (webapp|api|cli|library|automation|saas)?"; read -r PROJECT_TYPE
  ask "Primary language (TypeScript|Python|Go|Rust|...)?"; read -r LANGUAGE
  ask "Status (active|prototype|mvp|maintenance)?"; read -r STATUS
  ask "Runtime (e.g. Node.js 20, Python 3.12)?"; read -r RUNTIME
  ask "Framework (or 'none')?"; read -r FRAMEWORK
  ask "Package manager (npm|pnpm|poetry|cargo|go mod)?"; read -r PKGMGR

  python3 - "$PROJECT_NAME" "$PROJECT_TYPE" "$LANGUAGE" "$STATUS" "$RUNTIME" "$FRAMEWORK" "$PKGMGR" <<'PY'
import sys, pathlib, re
name, ptype, lang, status, runtime, framework, pkgmgr = sys.argv[1:]
p = pathlib.Path("PROJECT_RULES.md")
t = p.read_text()
repl = {
    r"Project Name:    \[.*?\]":    f"Project Name:    {name}",
    r"Project Type:    \[.*?\]":    f"Project Type:    {ptype}",
    r"Primary Language: \[.*?\]":   f"Primary Language: {lang}",
    r"Status:          \[.*?\]":    f"Status:          {status}",
    r"Runtime:         \[.*?\]":    f"Runtime:         {runtime}",
    r"Framework:       \[.*?\]":    f"Framework:       {framework}",
    r"Package manager: \[.*?\]":    f"Package manager: {pkgmgr}",
}
for pat, sub in repl.items():
    t = re.sub(pat, sub, t)
p.write_text(t)
print("PROJECT_RULES.md updated")
PY
  ok "PROJECT_RULES.md filled (rest is for you to complete manually)"
else
  ok "PROJECT_RULES.md already customized — skipping"
fi

# ---------- 4. Initialize state/ ----------
echo
info "Initializing state/..."
TODAY=$(date +%Y-%m-%d)
PROJECT_NAME="${PROJECT_NAME:-$(basename "$ROOT")}"

if [[ -f state/context.md ]] && grep -q "^# Project:" state/context.md 2>/dev/null; then
  ok "state/context.md already initialized"
else
  cat > state/context.md <<EOF
# Project: $PROJECT_NAME
Initialized: $TODAY

## What is this project?
TODO: 2-3 sentences describing the project's purpose.

## Current focus
TODO: What is being worked on right now.

## Recent decisions
See state/decisions.md
EOF
  ok "state/context.md initialized"
fi

[[ -f state/tasks.md ]]     || echo -e "# Tasks\n\n## In progress\n\n## Backlog\n\n## Done\n" > state/tasks.md
[[ -f state/decisions.md ]] || echo -e "# Decisions Log\n\nFormat: $TODAY — Decision — Why\n" > state/decisions.md
[[ -f state/progress.md ]]  || echo -e "# Progress Log\n\n$TODAY — Harness initialized via setup.sh\n" > state/progress.md

# ---------- Done ----------
echo
ok "Setup complete."
echo
echo "Next steps:"
echo "  1. Review and finish PROJECT_RULES.md (fill remaining sections)"
echo "  2. Open Claude Code in this directory"
echo "  3. Start working — Claude reads CLAUDE.md + PROJECT_RULES.md automatically"
echo

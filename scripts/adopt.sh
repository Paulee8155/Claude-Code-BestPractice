#!/usr/bin/env bash
# adopt.sh — Drop the harness into an EXISTING project safely.
#
# Use when: you have a working project and want to add this harness on top.
# What it does:
#   1. Copies harness files INTO the target project
#   2. Detects conflicts with existing CLAUDE.md / .claude/ / state/
#   3. Backs up conflicting files to .harness-backup/<timestamp>/
#   4. Leaves PROJECT_RULES.md as a template — Claude fills it via /adopt-project
#
# Usage:
#   ./scripts/adopt.sh /path/to/your/existing/project
#
# Idempotent: safe to re-run. Existing files are backed up, not silently overwritten.

set -euo pipefail

C_GREEN='\033[0;32m'
C_YELLOW='\033[1;33m'
C_RED='\033[0;31m'
C_BLUE='\033[0;34m'
C_RESET='\033[0m'
ok()   { printf "${C_GREEN}[OK]${C_RESET}    %s\n" "$1"; }
warn() { printf "${C_YELLOW}[WARN]${C_RESET}  %s\n" "$1"; }
err()  { printf "${C_RED}[FAIL]${C_RESET}  %s\n" "$1"; }
info() { printf "${C_BLUE}[INFO]${C_RESET}  %s\n" "$1"; }

if [[ $# -lt 1 ]]; then
  err "Missing target path."
  echo "Usage: $0 /path/to/your/existing/project"
  exit 1
fi

HARNESS="$(cd "$(dirname "$0")/.." && pwd)"
TARGET="$(cd "$1" && pwd)"

if [[ "$HARNESS" == "$TARGET" ]]; then
  err "Target is the harness itself. Pick a different directory."
  exit 1
fi

if [[ ! -d "$TARGET" ]]; then
  err "Target directory does not exist: $TARGET"
  exit 1
fi

info "Harness:  $HARNESS"
info "Target:   $TARGET"
echo

# ---------- 1. Confirm ----------
read -rp "Continue? (y/N) " yn
[[ "$yn" =~ ^[Yy]$ ]] || { echo "Cancelled."; exit 0; }

# ---------- 2. Backup conflicts ----------
TS=$(date +%Y%m%d-%H%M%S)
BACKUP="$TARGET/.harness-backup/$TS"
mkdir -p "$BACKUP"

CONFLICTS=()
for f in CLAUDE.md PROJECT_RULES.md README.md .gitignore .mcp.json .claude state; do
  if [[ -e "$TARGET/$f" ]]; then
    CONFLICTS+=("$f")
    info "Backing up existing: $f"
    cp -a "$TARGET/$f" "$BACKUP/"
  fi
done

if [[ ${#CONFLICTS[@]} -gt 0 ]]; then
  ok "Backups stored in: $BACKUP"
else
  ok "No conflicts — clean adoption"
  rmdir "$BACKUP" "$TARGET/.harness-backup" 2>/dev/null || true
fi

# ---------- 3. Copy harness files (non-destructive) ----------
# Strategy:
#   - If a top-level file exists in the target with substantive content (>50 bytes),
#     we drop the harness version next to it as <name>.harness so the user can
#     review and merge manually. Backup is already in $BACKUP from step 2.
#   - If the file is missing or empty, copy the harness version as-is.
#   - .gitignore is special: append harness lines that aren't already present.
echo
info "Copying harness files (non-destructive)..."
HARNESS_DROP=()
copy_or_sidecar() {
  local name="$1"
  local src="$HARNESS/$name"
  local dst="$TARGET/$name"
  [[ -f "$src" ]] || return 0
  if [[ -s "$dst" ]] && [[ $(wc -c < "$dst") -gt 50 ]]; then
    cp "$src" "$dst.harness"
    HARNESS_DROP+=("$name.harness")
    info "Preserved existing $name; harness version saved as $name.harness"
  else
    cp "$src" "$dst"
    ok "Installed $name"
  fi
}

merge_gitignore() {
  local src="$HARNESS/.gitignore"
  local dst="$TARGET/.gitignore"
  [[ -f "$src" ]] || return 0
  if [[ ! -f "$dst" ]]; then
    cp "$src" "$dst"
    ok "Installed .gitignore"
    return 0
  fi
  local added=0
  while IFS= read -r line; do
    [[ -z "$line" ]] && continue
    [[ "$line" =~ ^# ]] && continue
    if ! grep -qxF "$line" "$dst"; then
      printf '%s\n' "$line" >> "$dst"
      added=$((added+1))
    fi
  done < "$src"
  if (( added > 0 )); then
    ok "Merged $added new lines into existing .gitignore"
  else
    info "Existing .gitignore already covers harness entries"
  fi
}

copy_or_sidecar "CLAUDE.md"
copy_or_sidecar "PROJECT_RULES.md"
copy_or_sidecar "README.md"
copy_or_sidecar ".mcp.json"
merge_gitignore

# .claude/ — merge: copy harness on top, but never overwrite settings.local.json
mkdir -p "$TARGET/.claude"
cp -r "$HARNESS/.claude/." "$TARGET/.claude/"
[[ -f "$BACKUP/.claude/settings.local.json" ]] && cp "$BACKUP/.claude/settings.local.json" "$TARGET/.claude/settings.local.json"

# state/ — only copy if target has no state yet
if [[ ! -d "$TARGET/state" ]] || [[ -z "$(ls -A "$TARGET/state" 2>/dev/null)" ]]; then
  mkdir -p "$TARGET/state"
  cp -r "$HARNESS/state/." "$TARGET/state/"
fi

# scripts/ — copy harness scripts, but don't overwrite project's existing ones
mkdir -p "$TARGET/scripts"
for s in setup.sh adopt.sh verify-harness.sh README.md; do
  if [[ -f "$HARNESS/scripts/$s" ]] && [[ ! -f "$TARGET/scripts/$s" ]]; then
    cp "$HARNESS/scripts/$s" "$TARGET/scripts/$s"
  fi
done
chmod +x "$TARGET/scripts/"*.sh 2>/dev/null || true

ok "Harness files copied."

# ---------- 4. Next-step instructions ----------
echo
ok "Adoption complete."
echo
echo "Next steps:"
echo "  1. cd $TARGET"
echo "  2. Open Claude Code"
echo "  3. Run: /adopt-project"
echo "     → Claude will analyze your codebase and fill PROJECT_RULES.md,"
echo "       state/context.md, and .claude/rules/ automatically."
echo
[[ ${#CONFLICTS[@]} -gt 0 ]] && echo "  Your previous files are backed up at: $BACKUP"
if [[ ${#HARNESS_DROP[@]} -gt 0 ]]; then
  echo
  warn "Existing files were preserved. Review and merge harness versions manually:"
  for f in "${HARNESS_DROP[@]}"; do echo "    - $f"; done
fi
echo

#!/usr/bin/env bash
# verify-harness.sh — validates the harness structure and key invariants.
# Run after applying the harness to any project. Exit 0 = pass, 1 = failures.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PASS=0
FAIL=0
WARNS=0

green() { echo "  ✓ $*"; }
red()   { echo "  ✗ $*"; FAIL=$((FAIL+1)); }
warn()  { echo "  ⚠ $*"; WARNS=$((WARNS+1)); }

check_file() {
    local f="$ROOT/$1"
    local desc="${2:-$1}"
    if [[ -f "$f" ]]; then
        green "$desc"
        PASS=$((PASS+1))
    else
        red "$desc missing: $1"
    fi
}

check_dir() {
    local d="$ROOT/$1"
    local desc="${2:-$1}"
    if [[ -d "$d" ]]; then
        green "$desc"
        PASS=$((PASS+1))
    else
        red "$desc missing: $1"
    fi
}

check_frontmatter() {
    local f="$ROOT/$1"
    local field="$2"
    if grep -q "^${field}:" "$f" 2>/dev/null; then
        PASS=$((PASS+1))
    else
        red "Missing frontmatter '$field:' in $1"
    fi
}

echo
echo "═══════════════════════════════════════"
echo "  Harness Verification — $(date '+%Y-%m-%d %H:%M')"
echo "═══════════════════════════════════════"

echo
echo "── Core files ──"
check_file "CLAUDE.md"
check_file "PROJECT_RULES.md"
check_file "README.md"
check_file ".mcp.json"
check_file ".gitignore"

if [[ -f "$ROOT/CLAUDE.md" ]]; then
    lines=$(wc -l < "$ROOT/CLAUDE.md")
    if [[ $lines -le 140 ]]; then
        green "CLAUDE.md size OK ($lines lines)"
        PASS=$((PASS+1))
    else
        warn "CLAUDE.md is $lines lines (target: ≤140)"
    fi
fi

echo
echo "── Rules ──"
for r in karpathy-principles claude-mem rtk security testing markdown-docs; do
    check_file ".claude/rules/$r.md"
done

echo
echo "── Skills (12 expected) ──"
SKILLS=(planning-and-task-breakdown test-driven-development incremental-implementation \
        context-engineering source-driven-development debugging-and-error-recovery \
        code-review-and-quality code-simplification security-and-hardening \
        performance-optimization git-workflow-and-versioning documentation-and-adrs)
for s in "${SKILLS[@]}"; do
    f=".claude/skills/$s.md"
    check_file "$f"
    [[ -f "$ROOT/$f" ]] && check_frontmatter "$f" "name" && check_frontmatter "$f" "description"
done

echo
echo "── Agents ──"
GENERAL_AGENTS=(architect debugger reviewer security-reviewer tester implementer \
                frontend backend database)
for a in "${GENERAL_AGENTS[@]}"; do
    f=".claude/agents/$a.md"
    check_file "$f"
    [[ -f "$ROOT/$f" ]] && check_frontmatter "$f" "name" && check_frontmatter "$f" "description"
done
check_dir ".claude/agents/rpi" "rpi agents directory"

echo
echo "── Commands ──"
for c in research plan implement; do
    check_file ".claude/commands/rpi/$c.md" "/rpi:$c"
done
check_file ".claude/commands/adopt-project.md" "/adopt-project"

echo
echo "── Hooks ──"
check_file ".claude/hooks/HOOKS-README.md"
check_file ".claude/hooks/scripts/hooks.py"
check_file ".claude/hooks/config/hooks-config.json"

if command -v python3 >/dev/null 2>&1; then
    if python3 "$ROOT/.claude/hooks/scripts/hooks.py" --self-test >/dev/null 2>&1; then
        green "hooks.py --self-test passes"
        PASS=$((PASS+1))
    else
        red "hooks.py --self-test failed"
    fi
    if echo '{"source":"startup"}' | python3 "$ROOT/.claude/hooks/scripts/hooks.py" SessionStart >/dev/null 2>&1; then
        green "SessionStart smoke OK"
        PASS=$((PASS+1))
    else
        red "SessionStart smoke failed"
    fi
else
    warn "python3 not on PATH — cannot run --self-test"
fi

echo
echo "── Settings ──"
check_file ".claude/settings.json"
if [[ -f "$ROOT/.claude/settings.json" ]] && command -v python3 >/dev/null 2>&1; then
    if python3 -m json.tool "$ROOT/.claude/settings.json" > /dev/null 2>&1; then
        green "settings.json: valid JSON"
        PASS=$((PASS+1))
    else
        red "settings.json: invalid JSON"
    fi
    for ev in PreToolUse PostToolUse SessionStart Stop; do
        if grep -q "\"$ev\"" "$ROOT/.claude/settings.json"; then
            PASS=$((PASS+1))
        else
            red "settings.json missing hook event: $ev"
        fi
    done
fi
if [[ -f "$ROOT/.mcp.json" ]] && command -v python3 >/dev/null 2>&1; then
    if python3 -m json.tool "$ROOT/.mcp.json" > /dev/null 2>&1; then
        green ".mcp.json: valid JSON"
        PASS=$((PASS+1))
    else
        red ".mcp.json: invalid JSON"
    fi
fi

echo
echo "── State files ──"
for s in context tasks decisions progress; do
    check_file "state/$s.md"
done
check_dir "state/plans"

echo
echo "── Templates ──"
check_file ".claude/templates/project-profile.md"
check_file ".claude/templates/tech-stack.md"

echo
echo "── Scripts ──"
for s in setup.sh adopt.sh worktree.sh verify-harness.sh; do
    f="scripts/$s"
    check_file "$f"
    if [[ -f "$ROOT/$f" ]]; then
        if [[ -x "$ROOT/$f" ]]; then
            green "$f executable"
            PASS=$((PASS+1))
        else
            warn "$f not executable (chmod +x scripts/$s)"
        fi
        if bash -n "$ROOT/$f" 2>/dev/null; then
            green "$f bash syntax OK"
            PASS=$((PASS+1))
        else
            red "$f has bash syntax error"
        fi
    fi
done

echo
echo "── Tool prerequisites (warnings only) ──"
for t in git rtk bun python3; do
    if command -v "$t" >/dev/null 2>&1; then
        green "$t available"
        PASS=$((PASS+1))
    else
        warn "$t not on PATH — install for full functionality"
    fi
done
if [[ -d "$HOME/.claude-mem" ]]; then
    green "claude-mem installed"
    PASS=$((PASS+1))
else
    warn "claude-mem not installed — run: npx claude-mem install"
fi

echo
echo "── Stale paths (must NOT exist) ──"
STALE=(
    ".claude/rules/context-mode.md"
    ".claude/commands/workflows"
    "best-practice"
    "changelog"
    "development-workflows"
    "implementation"
    "reports"
)
for s in "${STALE[@]}"; do
    if [[ -e "$ROOT/$s" ]]; then
        red "stale path still present: $s"
    else
        PASS=$((PASS+1))
    fi
done

echo
echo "═══════════════════════════════════════"
echo "  Results: $PASS passed · $FAIL failed · $WARNS warnings"
echo "═══════════════════════════════════════"
echo

if [[ $FAIL -gt 0 ]]; then
    echo "  FAIL — fix the issues above."
    exit 1
else
    echo "  PASS — harness is intact."
    exit 0
fi

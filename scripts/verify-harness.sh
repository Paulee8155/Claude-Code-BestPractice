#!/usr/bin/env bash
# verify-harness.sh — validates the harness structure and key invariants.
# Run after applying the harness to any project, or after evolve-harness.
# Exit 0 = all checks pass. Exit 1 = failures found.

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
        green "$desc exists"
        PASS=$((PASS+1))
    else
        red "$desc missing: $1"
    fi
}

check_dir() {
    local d="$ROOT/$1"
    local desc="${2:-$1}"
    if [[ -d "$d" ]]; then
        green "$desc exists"
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

check_nonempty_field() {
    local f="$ROOT/$1"
    local field="$2"
    local value
    value=$(grep "^${field}:" "$f" 2>/dev/null | sed "s/^${field}://" | xargs)
    if [[ -n "$value" && "$value" != "" ]]; then
        PASS=$((PASS+1))
    else
        red "Empty frontmatter '$field' in $1"
    fi
}

echo ""
echo "═══════════════════════════════════════"
echo "  Harness Verification"
echo "  $(date '+%Y-%m-%d %H:%M')"
echo "═══════════════════════════════════════"
echo ""

echo "── Core Files ──"
check_file "CLAUDE.md"
check_file "PROJECT_RULES.md"

# CLAUDE.md size check
if [[ -f "$ROOT/CLAUDE.md" ]]; then
    lines=$(wc -l < "$ROOT/CLAUDE.md")
    if [[ $lines -le 140 ]]; then
        green "CLAUDE.md size OK ($lines lines)"
        PASS=$((PASS+1))
    else
        warn "CLAUDE.md is $lines lines (target: ≤140)"
    fi
fi

echo ""
echo "── Skills ──"
SKILLS=(project-onboarding token-budget-routing feature-planning implementation-loop review-gate harness-evolution)
for skill in "${SKILLS[@]}"; do
    f=".claude/skills/$skill/SKILL.md"
    check_file "$f" "skill: $skill"
    if [[ -f "$ROOT/$f" ]]; then
        check_frontmatter "$f" "name"
        check_frontmatter "$f" "description"
        check_nonempty_field "$f" "description"
    fi
done

echo ""
echo "── Agents ──"
AGENTS=(architect reviewer security-reviewer tester implementer)
for agent in "${AGENTS[@]}"; do
    f=".claude/agents/$agent.md"
    check_file "$f" "agent: $agent"
    if [[ -f "$ROOT/$f" ]]; then
        check_frontmatter "$f" "name"
        check_frontmatter "$f" "description"
    fi
done

echo ""
echo "── Commands ──"
COMMANDS=(onboard-project plan-feature implement-feature review-work evolve-harness project-status)
for cmd in "${COMMANDS[@]}"; do
    check_file ".claude/commands/$cmd.md" "command: /$cmd"
done

echo ""
echo "── Hooks ──"
check_file ".claude/hooks/block-destructive.sh"
check_file ".claude/hooks/protect-secrets.sh"
if [[ -f "$ROOT/.claude/hooks/block-destructive.sh" ]]; then
    if [[ -x "$ROOT/.claude/hooks/block-destructive.sh" ]]; then
        green "block-destructive.sh is executable"
        PASS=$((PASS+1))
    else
        warn "block-destructive.sh is not executable (run: chmod +x)"
    fi
fi

echo ""
echo "── Settings ──"
check_file ".claude/settings.json"
if [[ -f "$ROOT/.claude/settings.json" ]]; then
    if python3 -m json.tool "$ROOT/.claude/settings.json" > /dev/null 2>&1; then
        green "settings.json is valid JSON"
        PASS=$((PASS+1))
    else
        red "settings.json is invalid JSON"
    fi
    if grep -q '"hooks"' "$ROOT/.claude/settings.json"; then
        green "settings.json has hooks configured"
        PASS=$((PASS+1))
    else
        warn "settings.json has no hooks configuration"
    fi
fi

echo ""
echo "── State Files ──"
check_file "state/context.md"
check_file "state/tasks.md"
check_file "state/decisions.md"
check_file "state/progress.md"

echo ""
echo "── Rules / Token Tools ──"
check_file ".claude/rules/context-mode.md"
check_file ".claude/rules/rtk.md"

echo ""
echo "── Scripts ──"
check_file "scripts/verify-harness.sh"

echo ""
echo "═══════════════════════════════════════"
echo "  Results: $PASS passed · $FAIL failed · $WARNS warnings"
echo "═══════════════════════════════════════"
echo ""

if [[ $FAIL -gt 0 ]]; then
    echo "  FAIL — fix the issues above before using this harness."
    exit 1
else
    echo "  PASS — harness looks good."
    exit 0
fi

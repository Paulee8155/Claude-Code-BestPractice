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

echo ""
echo "═══════════════════════════════════════"
echo "  Harness Verification"
echo "  $(date '+%Y-%m-%d %H:%M')"
echo "═══════════════════════════════════════"
echo ""

echo "── Core Files ──"
check_file "CLAUDE.md"
check_file "PROJECT_RULES.md"
check_file "README.md"
check_file ".mcp.json"

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
echo "── RPI Workflow ──"
for cmd in research plan implement; do
    check_file ".claude/commands/rpi/$cmd.md" "command: /rpi:$cmd"
done
RPI_AGENTS=(senior-software-engineer product-manager ux-designer requirement-parser \
            technical-cto-advisor code-reviewer constitutional-validator \
            documentation-analyst-writer)
for agent in "${RPI_AGENTS[@]}"; do
    f=".claude/agents/rpi/$agent.md"
    check_file "$f" "rpi-agent: $agent"
    if [[ -f "$ROOT/$f" ]]; then
        check_frontmatter "$f" "name"
        check_frontmatter "$f" "description"
    fi
done
check_file "development-workflows/rpi/rpi-workflow.md"

echo ""
echo "── Drift-Tracking Workflows ──"
DRIFT_TOPICS=(concepts claude-commands claude-settings claude-skills claude-subagents)
for t in "${DRIFT_TOPICS[@]}"; do
    case "$t" in
        concepts) cmd_name="workflow-concepts" ;;
        *)        cmd_name="workflow-$t" ;;
    esac
    check_file ".claude/commands/workflows/best-practice/$cmd_name.md" "command: /$cmd_name"
    check_file ".claude/agents/workflows/best-practice/${cmd_name}-agent.md" "agent: ${cmd_name}-agent"
    check_file "changelog/best-practice/$t/changelog.md" "changelog: $t"
done

echo ""
echo "── General-Purpose Agents ──"
AGENTS=(architect reviewer security-reviewer tester implementer debugger)
for agent in "${AGENTS[@]}"; do
    f=".claude/agents/$agent.md"
    check_file "$f" "agent: $agent"
    if [[ -f "$ROOT/$f" ]]; then
        check_frontmatter "$f" "name"
        check_frontmatter "$f" "description"
    fi
done

echo ""
echo "── Hooks ──"
check_file ".claude/hooks/HOOKS-README.md"
check_file ".claude/hooks/scripts/hooks.py"
check_file ".claude/hooks/config/hooks-config.json"
if [[ -x "$ROOT/.claude/hooks/scripts/hooks.py" ]]; then
    green "hooks.py is executable"
    PASS=$((PASS+1))
else
    warn "hooks.py is not executable (run: chmod +x .claude/hooks/scripts/hooks.py)"
fi
if command -v python3 >/dev/null 2>&1; then
    if python3 "$ROOT/.claude/hooks/scripts/hooks.py" --self-test >/dev/null 2>&1; then
        green "hooks.py --self-test passes"
        PASS=$((PASS+1))
    else
        red "hooks.py --self-test failed"
    fi
else
    warn "python3 not on PATH — cannot run --self-test"
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
    for ev in PreToolUse PostToolUse SessionStart PreCompact SubagentStart Stop; do
        if grep -q "\"$ev\"" "$ROOT/.claude/settings.json"; then
            PASS=$((PASS+1))
        else
            red "settings.json missing hook event: $ev"
        fi
    done
fi

if [[ -f "$ROOT/.mcp.json" ]]; then
    if python3 -m json.tool "$ROOT/.mcp.json" > /dev/null 2>&1; then
        green ".mcp.json is valid JSON"
        PASS=$((PASS+1))
    else
        red ".mcp.json is invalid JSON"
    fi
fi

echo ""
echo "── Rules ──"
check_file ".claude/rules/context-mode.md"
check_file ".claude/rules/rtk.md"
check_file ".claude/rules/security.md"
check_file ".claude/rules/testing.md"
check_file ".claude/rules/markdown-docs.md"

echo ""
echo "── State Files ──"
check_file "state/context.md"
check_file "state/tasks.md"
check_file "state/decisions.md"
check_file "state/progress.md"

echo ""
echo "── Reference Docs ──"
check_dir "best-practice"
check_dir "implementation"
check_dir "reports"

echo ""
echo "── Agent Memory ──"
check_dir ".claude/agent-memory"
check_file ".claude/agent-memory/README.md"

echo ""
echo "── Templates ──"
check_file ".claude/templates/project-profile.md"
check_file ".claude/templates/tech-stack.md"

echo ""
echo "── Scripts ──"
check_file "scripts/verify-harness.sh"

echo ""
echo "── Stale Files (must NOT exist) ──"
STALE=(
    ".claude/hooks/block-destructive.sh"
    ".claude/hooks/protect-secrets.sh"
    ".claude/commands/plan-feature.md"
    ".claude/commands/implement-feature.md"
    ".claude/commands/review-work.md"
    ".claude/commands/onboard-project.md"
    ".claude/commands/evolve-harness.md"
    ".claude/skills/feature-planning"
    ".claude/skills/implementation-loop"
    ".claude/skills/review-gate"
    "docs/context.md"
    "docs/tasks.md"
)
for s in "${STALE[@]}"; do
    if [[ -e "$ROOT/$s" ]]; then
        red "stale path still present: $s"
    else
        PASS=$((PASS+1))
    fi
done

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

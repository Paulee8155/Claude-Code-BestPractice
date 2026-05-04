#!/usr/bin/env bash
# PreToolUse hook: blocks destructive Bash commands without explicit confirmation.
# Receives JSON on stdin. Exits 2 to block with message.

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(d.get('tool_input', {}).get('command', ''))
except:
    print('')
" 2>/dev/null || echo "")

BLOCKED_PATTERNS=(
    "rm -rf"
    "rm -fr"
    "git push --force"
    "git push -f "
    "git reset --hard"
    "git clean -fd"
    "git clean -f"
    "chmod -R 777"
    "sudo rm"
    "truncate --size 0"
    "dd if="
    "> /dev/"
    "DROP TABLE"
    "drop table"
    "DROP DATABASE"
    "drop database"
)

for pat in "${BLOCKED_PATTERNS[@]}"; do
    if echo "$COMMAND" | grep -qF "$pat"; then
        echo "BLOCKED by harness: '$pat' requires explicit user confirmation."
        echo "Describe the action and ask before proceeding."
        exit 2
    fi
done

exit 0

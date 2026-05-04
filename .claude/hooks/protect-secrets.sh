#!/usr/bin/env bash
# PreToolUse hook: blocks read/write access to secret/credential files.
# Receives JSON on stdin. Exits 2 to block with message.

INPUT=$(cat)
FILE_PATH=$(python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    ti = d.get('tool_input', {})
    print(ti.get('file_path', '') or ti.get('path', '') or ti.get('command', ''))
except:
    print('')
" 2>/dev/null <<< "$INPUT" || echo "")

SENSITIVE_PATTERNS=(
    "\.env$"
    "\.env\."
    "/secrets/"
    "credentials"
    "\.pem$"
    "\.key$"
    "id_rsa"
    "id_ed25519"
    "\.p12$"
    "\.pfx$"
    "\.keystore$"
    "service.account"
    "serviceaccount"
)

for pat in "${SENSITIVE_PATTERNS[@]}"; do
    if echo "$FILE_PATH" | grep -qiE "$pat"; then
        echo "BLOCKED by harness: '$FILE_PATH' matches sensitive file pattern '$pat'."
        echo "Confirm explicitly before accessing secrets or credentials."
        exit 2
    fi
done

exit 0

#!/bin/bash
# Eval-Runner für BestPractice-Extras (Schicht 2).
set -o pipefail
cd "$(dirname "$0")/.." || exit 1

FAIL=0

echo "== eval: state-sync-roundtrip =="
if node bestpractice-extras/scripts/state-sync/selftest.js; then
  echo "  PASS"
else
  echo "  FAIL"; FAIL=1
fi

echo "== eval: harness-score (>= 30) =="
AUDIT="$HOME/.claude/plugins/cache/ecc/ecc/2.0.0/scripts/harness-audit.js"
if [ -f "$AUDIT" ]; then
  SCORE=$(node "$AUDIT" 2>/dev/null | grep -oE 'consumer\): [0-9]+' | grep -oE '[0-9]+' | head -1)
  if [ -n "$SCORE" ] && [ "$SCORE" -ge 30 ]; then
    echo "  PASS (score=$SCORE)"
  else
    echo "  FAIL (score=${SCORE:-unbekannt})"; FAIL=1
  fi
else
  echo "  SKIP (harness-audit.js nicht gefunden)"
fi

exit $FAIL

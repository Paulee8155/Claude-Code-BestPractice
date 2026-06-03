#!/usr/bin/env bash
# Einmaliger / wiederholbarer mgrep-Index dieses Repos (Schicht-2-Tool).
#
# Auth:   liest MXBAI_API_KEY aus ~/.claude/settings.json (env-Block).
#         Alternativ vorab als Env-Var gesetzt (Vorrang).
# Upload: 'mgrep watch' lädt den Quellbaum in die Mixedbread-Cloud (Outbound!).
#         Nach dem initialen Sync mit Ctrl+C beenden — der Store bleibt durchsuchbar.
# .gitignore wird respektiert (node_modules, Secrets etc. bleiben außen vor).
set -euo pipefail

# Repo-Root = zwei Ebenen über diesem Script (bestpractice-extras/scripts/mgrep/ -> Repo).
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$SCRIPT_DIR/../../.." && pwd)"
cd "$REPO"

if [ -z "${MXBAI_API_KEY:-}" ]; then
  MXBAI_API_KEY="$(node -e 'process.stdout.write(require(require("os").homedir()+"/.claude/settings.json").env.MXBAI_API_KEY||"")' 2>/dev/null || true)"
fi
if [ -z "${MXBAI_API_KEY:-}" ]; then
  echo "FEHLER: MXBAI_API_KEY weder als Env-Var noch in ~/.claude/settings.json gefunden." >&2
  echo "        Key auf platform.mixedbread.com holen und in settings.json (env) eintragen." >&2
  exit 1
fi
export MXBAI_API_KEY
export MGREP_MAX_FILE_COUNT="${MGREP_MAX_FILE_COUNT:-3000}"

echo "Repo:  $REPO"
echo "Key:   ${#MXBAI_API_KEY} Zeichen geladen | Datei-Limit: $MGREP_MAX_FILE_COUNT"
echo "Start mgrep watch — nach initialem Sync (processed/uploaded) mit Ctrl+C beenden."
echo "---"
exec mgrep watch

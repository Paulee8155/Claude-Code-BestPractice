#!/usr/bin/env bash
# integration-test.sh — LIVE-Test gegen die echte, installierte CBM-Binary.
#
# Läuft bewusst NICHT in der CI: er braucht die installierte Binary, schreibt in den
# echten Graph-Cache und legt ein Wegwerf-Projekt innerhalb von CBM_ALLOWED_ROOT an.
# Die Unit-Tests (selftest.js) decken alles Übrige offline und gemockt ab.
#
#   bash integration-test.sh            # Fixture anlegen, indexieren, prüfen, aufräumen
#
# Prüft:
#   1. Secret-Ausschluss: .env / private.key / state/ landen NICHT im Graphen,
#      normaler Quellcode schon.
#   2. Pfadsicherheit gegen die echte Binary: ein Pfad ausserhalb CBM_ALLOWED_ROOT
#      wird abgelehnt.
#   3. Der Graph beantwortet echte Struktur-Fragen (Symbol + Aufrufkette).
#
# Es werden KEINE echten Secrets benutzt — nur eindeutige Sentinel-Strings.
set -uo pipefail

HARNESS="${HOME}/.local/bin/codebase-memory-mcp-harness"
FIXTURE_ROOT="${CBM_TEST_ROOT:-/root/projekte}/.cbm-secret-fixture"
SENTINEL_ENV="SENTINEL_ENV_a7f3c9e1"
SENTINEL_KEY="SENTINEL_KEY_b2d8f4a6"
SENTINEL_STATE="SENTINEL_STATE_c5e1b9d3"

fail=0
ok()  { echo "  PASS  $1"; }
bad() { echo "  FAIL  $1"; fail=1; }

command -v "$HARNESS" >/dev/null 2>&1 || { echo "FEHLER: $HARNESS fehlt. Erst: ./install-vps.sh --with-cbm"; exit 2; }

cleanup() {
  if [ -n "${PROJECT_NAME:-}" ]; then
    # delete_project NUR für die selbst angelegte Test-Fixture — nie für echte Projekte.
    echo "{\"project\":\"$PROJECT_NAME\"}" | "$HARNESS" cli delete_project >/dev/null 2>&1 || true
  fi
  rm -rf "$FIXTURE_ROOT"
}
trap cleanup EXIT

echo "=== CBM Integrationstest (live) ==="
rm -rf "$FIXTURE_ROOT"
mkdir -p "$FIXTURE_ROOT/src" "$FIXTURE_ROOT/state"

cat > "$FIXTURE_ROOT/src/example.ts" <<'EOF'
export function computeTotal(items: number[]): number {
  return items.reduce((a, b) => a + b, 0);
}
export function checkout(items: number[]): string {
  return `total=${computeTotal(items)}`;
}
EOF
printf 'API_TOKEN=%s\n' "$SENTINEL_ENV"          > "$FIXTURE_ROOT/.env"
printf -- '-----BEGIN KEY-----\n%s\n' "$SENTINEL_KEY" > "$FIXTURE_ROOT/private.key"
printf '# Kontext\n%s\n' "$SENTINEL_STATE"       > "$FIXTURE_ROOT/state/context.md"

# .cbmignore mit Managed Block (dasselbe wie /cbm enable)
node "$(dirname "${BASH_SOURCE[0]}")/cbmignore.js" apply "$FIXTURE_ROOT" >/dev/null

echo "--- 1. Indexieren ---"
INDEX_OUT="$(echo "{\"repo_path\":\"$FIXTURE_ROOT\"}" | "$HARNESS" cli index_repository 2>/dev/null)"
PROJECT_NAME="$(node -e "process.stdout.write(JSON.parse(process.argv[1]).project||'')" "$INDEX_OUT")"
STATUS="$(node -e "process.stdout.write(JSON.parse(process.argv[1]).status||'')" "$INDEX_OUT")"
[ "$STATUS" = "indexed" ] && ok "index_repository → status=indexed ($PROJECT_NAME)" || bad "index_repository → status=$STATUS"

echo "--- 2. Quellcode ist auffindbar ---"
SEARCH="$(echo "{\"project\":\"$PROJECT_NAME\",\"name_pattern\":\"computeTotal\"}" | "$HARNESS" cli search_graph 2>/dev/null)"
echo "$SEARCH" | grep -q 'computeTotal' && ok "search_graph findet computeTotal (src/example.ts indexiert)" \
                                        || bad "search_graph findet computeTotal NICHT"

echo "--- 3. Aufrufkette ---"
TRACE="$(echo "{\"project\":\"$PROJECT_NAME\",\"function_name\":\"computeTotal\",\"direction\":\"both\"}" | "$HARNESS" cli trace_path 2>/dev/null)"
echo "$TRACE" | grep -q 'checkout' && ok "trace_path: checkout → computeTotal erkannt" \
                                   || bad "trace_path findet die Aufrufkette nicht"

echo "--- 4. Secret-Ausschluss (Sentinels dürfen NIRGENDS im Graphen auftauchen) ---"
DUMP=""
for TOOL_ARGS in \
  "search_code {\"project\":\"$PROJECT_NAME\",\"query\":\"$SENTINEL_ENV\"}" \
  "search_code {\"project\":\"$PROJECT_NAME\",\"query\":\"$SENTINEL_KEY\"}" \
  "search_code {\"project\":\"$PROJECT_NAME\",\"query\":\"$SENTINEL_STATE\"}"
do
  TOOL="${TOOL_ARGS%% *}"; ARGS="${TOOL_ARGS#* }"
  DUMP="$DUMP$(echo "$ARGS" | "$HARNESS" cli "$TOOL" 2>/dev/null)"
done
# Zusätzlich: Dateiknoten mit sensiblen Endungen
DUMP="$DUMP$(echo "{\"project\":\"$PROJECT_NAME\",\"label\":\"File\"}" | "$HARNESS" cli search_graph 2>/dev/null)"

for S in "$SENTINEL_ENV" "$SENTINEL_KEY" "$SENTINEL_STATE"; do
  if echo "$DUMP" | grep -q "$S"; then bad "Sentinel $S IST im Graphen — .cbmignore greift nicht!"
  else ok "Sentinel $S nicht im Graphen"; fi
done
for F in '\.env' 'private\.key' 'state/context\.md'; do
  if echo "$DUMP" | grep -qE "$F"; then bad "Datei $F ist als Knoten im Graphen"
  else ok "Datei $F nicht als Knoten im Graphen"; fi
done

echo "--- 5. Pfadsicherheit gegen die echte Binary ---"
if echo '{"repo_path":"/etc"}' | "$HARNESS" cli index_repository >/dev/null 2>&1; then
  bad "/etc wurde indexiert — CBM_ALLOWED_ROOT greift NICHT!"
else
  ok "/etc (ausserhalb CBM_ALLOWED_ROOT) wird abgelehnt"
fi

echo ""
[ "$fail" -eq 0 ] && echo "=== ALLE INTEGRATIONSTESTS GRÜN ===" || echo "=== INTEGRATIONSTESTS ROT ==="
exit "$fail"

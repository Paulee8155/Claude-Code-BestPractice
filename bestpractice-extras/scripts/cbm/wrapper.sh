#!/usr/bin/env bash
# codebase-memory-mcp-harness — Sicherheits-Wrapper um die gepinnte CBM-Binary.
#
# Diese Datei ist die VORLAGE. manage.sh install kopiert sie nach
# ~/.local/bin/codebase-memory-mcp-harness und ersetzt dabei @@MANAGE@@.
# Die installierte Kopie NICHT von Hand editieren — sie wird überschrieben.
#
# Der Wrapper ist die einzige Binary, die je in eine .mcp.json eingetragen wird.
# Er setzt die Sicherheitsgrenzen, unter denen CBM auf diesem VPS laufen darf:
#   - CBM_ALLOWED_ROOT  : index_repository ausserhalb dieses Roots wird abgelehnt.
#   - CBM_CACHE_DIR     : Graph-DB + CBM-Config, 0700.
#   - CBM_LOG_LEVEL     : warn (stdout bleibt für MCP-JSON-RPC reserviert).
#   - CBM_MEM_BUDGET_MB : bewusster Deckel. Ohne ihn dimensioniert CBM den
#     In-Memory-Graph als Bruchteil des GESAMT-RAMs (7,9 GB) — auf diesem VPS
#     sind davon aber ~5 GB durch ~13 Container belegt. 512 MiB lässt Luft.
# Alle vier bleiben per Environment überschreibbar.
#
# Kein UI, kein Port, keine Hooks, keine Shell-Konfiguration, keine Secrets.
set -euo pipefail
umask 077

CBM_LIB_DIR="${CBM_LIB_DIR:-$HOME/.local/lib/codebase-memory-mcp}"
CBM_BIN="$CBM_LIB_DIR/current/codebase-memory-mcp"

export CBM_ALLOWED_ROOT="${CBM_ALLOWED_ROOT:-/root/projekte}"
export CBM_CACHE_DIR="${CBM_CACHE_DIR:-$HOME/.cache/codebase-memory-mcp}"
export CBM_LOG_LEVEL="${CBM_LOG_LEVEL:-warn}"
export CBM_MEM_BUDGET_MB="${CBM_MEM_BUDGET_MB:-512}"

if [ ! -x "$CBM_BIN" ]; then
  echo "codebase-memory-mcp-harness: Binary fehlt oder ist nicht ausführbar:" >&2
  echo "  $CBM_BIN" >&2
  echo "Reparatur: bash '@@MANAGE@@' install" >&2
  exit 127
fi

mkdir -p "$CBM_CACHE_DIR"
chmod 700 "$CBM_CACHE_DIR" 2>/dev/null || true

exec "$CBM_BIN" "$@"

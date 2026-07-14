#!/usr/bin/env bash
# install-vps.sh — Reproduzierbarer, RTK-sicherer VPS-weiter Rollout des Harness.
#
# OFFIZIELLE ECC-ARCHITEKTUR (Upstream 2.0.0):
#   ECC wird als EIN globales Plugin (ecc@ecc) installiert — NICHT ins Repo vendored,
#   NICHT per install-apply gestackt. Dieses Skript setzt das installierte Plugin voraus
#   und (1) verteilt die Rules aus dem Plugin-Cache (Plugins verteilen rules nicht selbst,
#   README.md:288), (2) layert die BestPractice-Extras (Schicht 2) darüber.
#
# Plugin zuerst installieren (einmalig, in Claude Code):
#   /plugin marketplace add https://github.com/affaan-m/ECC
#   /plugin install ecc@ecc
#
# Sicherheit:
#   - Fasst settings.json / settings.local.json / CLAUDE.md standardmäßig NICHT an.
#   - Der globale RTK-Hook (PreToolUse:Bash) bleibt unangetastet.
#   - Hook-Verhalten wird über ECC_HOOK_PROFILE gesteuert (global minimal, projekt-lokal
#     standard) — siehe docs/WO-LAEUFT-WAS.md. Dieses Skript ändert keine env-Variablen.
#   - Optionale Härtung (deny-Baseline) NUR mit --harden, immer mit Backup.
#
# Usage:
#   ./install-vps.sh                 # Rules aus Plugin-Cache + BP-Extras layern
#   ./install-vps.sh --harden        # zusätzlich deny-Sicherheitsbasis in settings.json (opt-in)
#   ./install-vps.sh --dry-run       # nur zeigen, was kopiert würde
#   ./install-vps.sh --with-cbm      # zusätzlich Codebase-Memory-MCP global installieren (opt-in)
#   ./install-vps.sh --cbm-verify        # nur die CBM-Installation prüfen (read-only)
#   ./install-vps.sh --cbm-check-update  # nur auf neue CBM-Release prüfen (read-only)
#
# Codebase Memory (CBM):
#   Die Binary wird VPS-weit EINMAL installiert, der MCP-Server aber NIE global
#   registriert — Projekte aktivieren ihn einzeln via /cbm enable. Ohne --with-cbm
#   verhält sich dieses Skript exakt wie vorher.

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXTRAS_DIR="$REPO_DIR/bestpractice-extras"
CLAUDE_HOME="${CLAUDE_HOME:-$HOME/.claude}"
PLUGIN_DIR="${ECC_PLUGIN_DIR:-$CLAUDE_HOME/plugins/cache/ecc/ecc/2.0.0}"
CBM_MANAGE="$EXTRAS_DIR/scripts/cbm/manage.sh"

DRY_RUN=0
HARDEN=0
WITH_CBM=0
CBM_ONLY=""
while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run)          DRY_RUN=1; shift ;;
    --harden)           HARDEN=1; shift ;;
    --with-cbm)         WITH_CBM=1; shift ;;
    --cbm-verify)       CBM_ONLY="verify"; shift ;;
    --cbm-check-update) CBM_ONLY="check-update"; shift ;;
    *) echo "Unbekannte Option: $1"; exit 1 ;;
  esac
done

# Read-only CBM-Einzelaktionen: laufen allein und fassen das restliche Harness nicht an.
if [ -n "$CBM_ONLY" ]; then
  [ -f "$CBM_MANAGE" ] || { echo "[VPS] FEHLER: $CBM_MANAGE fehlt." >&2; exit 1; }
  exec bash "$CBM_MANAGE" "$CBM_ONLY"
fi

echo "[VPS] Repo:          $REPO_DIR"
echo "[VPS] Plugin (Quelle): $PLUGIN_DIR"
echo "[VPS] Ziel (~/.claude): $CLAUDE_HOME"

# 0) Voraussetzung: ECC-Plugin installiert (Single Source — kein Vendoring, kein Stacking)
if [ ! -d "$PLUGIN_DIR" ]; then
  echo "[VPS] FEHLER: ECC-Plugin nicht gefunden unter $PLUGIN_DIR" >&2
  echo "[VPS] Erst installieren (in Claude Code):" >&2
  echo "[VPS]   /plugin marketplace add https://github.com/affaan-m/ECC" >&2
  echo "[VPS]   /plugin install ecc@ecc" >&2
  exit 1
fi

# 0b) Codex-Companion-Preflight (rein informativ — installiert/ändert NICHTS an Codex).
#     Codex läuft hier nur als Plugin codex@openai-codex, aufgerufen via /codex:* aus
#     Claude Code. Keine Codex-CLI-Arbeit, kein projektlokaler Codex-Harness, keine
#     AGENTS.md. Auth bleibt ChatGPT-Login; dieses Skript fasst ~/.codex/ nie an.
echo "[VPS] Codex-Companion-Preflight:"
if command -v codex >/dev/null 2>&1; then
  echo "[VPS]   CLI:    $(codex --version 2>/dev/null || echo 'unbekannt')"
  # Nur den Auth-TYP melden — nie Account, Token oder Datei-Inhalt.
  # 'codex login status' schreibt auf stderr — daher 2>&1, sonst greift der grep nie.
  if codex login status 2>&1 | grep -qi 'chatgpt'; then
    echo "[VPS]   Auth:   ChatGPT-Login aktiv (kein API-Key) — OK"
  elif codex login status >/dev/null 2>&1; then
    echo "[VPS]   Auth:   angemeldet, aber NICHT per ChatGPT — prüfen (API-Key unerwünscht)"
  else
    echo "[VPS]   Auth:   nicht angemeldet → 'codex login --device-auth' (manuell, interaktiv)"
  fi
else
  echo "[VPS]   CLI:    NICHT gefunden → 'npm install -g @openai/codex' (manuell)"
fi
if grep -q '"codex@openai-codex": true' "$CLAUDE_HOME/settings.json" 2>/dev/null; then
  echo "[VPS]   Plugin: codex@openai-codex aktiv — OK"
else
  echo "[VPS]   Plugin: NICHT aktiv → in Claude Code: /plugin install codex@openai-codex"
fi

# 1) Rules aus dem Plugin-Cache nach ~/.claude/rules/ecc (Plugin verteilt rules nicht selbst)
if [ "$DRY_RUN" -eq 1 ]; then
  echo "[VPS] DRY-RUN — würde kopieren: $PLUGIN_DIR/rules/ → $CLAUDE_HOME/rules/ecc/"
  echo "[VPS] DRY-RUN — würde Extras layern (siehe Schritt 2)."
  echo "[VPS] DRY-RUN — würde Codex-Regeln layern: codex-delegation.md, codex-capacity.md"
  if [ "$WITH_CBM" -eq 1 ]; then
    echo ""
    echo "[VPS] DRY-RUN — Codebase Memory (--with-cbm):"
    echo "[VPS]   würde verteilen: /cbm → $CLAUDE_HOME/commands/cbm.md"
    echo "[VPS]   würde verteilen: Skill → $CLAUDE_HOME/skills/cbm-code-intelligence/SKILL.md"
    bash "$CBM_MANAGE" dry-run | sed 's/^/[VPS]   /'
  fi
  exit 0
fi
echo "[VPS] Verteile Rules aus Plugin-Cache → ~/.claude/rules/ecc ..."
mkdir -p "$CLAUDE_HOME/rules/ecc"
cp -R "$PLUGIN_DIR/rules/." "$CLAUDE_HOME/rules/ecc/"

# 2) BestPractice-Extras layern (Schicht 2: Karpathy + /ecc-onboard + /mega-plan + /start)
echo "[VPS] Layere BestPractice-Extras..."
mkdir -p "$CLAUDE_HOME/commands" "$CLAUDE_HOME/rules/ecc-extras" "$CLAUDE_HOME/agents" "$CLAUDE_HOME/contexts"
# Die Commands sind hier als Symlinks ins Repo verankert (Single Source, kein Drift).
# Ein cp auf sich selbst schlägt fehl und würde das Skript per set -e abbrechen — der
# -ef-Guard überspringt genau diesen Fall (wie bei start.md schon länger üblich).
[ "$EXTRAS_DIR/commands/ecc-onboard.md" -ef "$CLAUDE_HOME/commands/ecc-onboard.md" ] || cp "$EXTRAS_DIR/commands/ecc-onboard.md" "$CLAUDE_HOME/commands/"
[ "$EXTRAS_DIR/commands/mega-plan.md"   -ef "$CLAUDE_HOME/commands/mega-plan.md"   ] || cp "$EXTRAS_DIR/commands/mega-plan.md"   "$CLAUDE_HOME/commands/"
cp "$EXTRAS_DIR/rules/karpathy-principles.md"  "$CLAUDE_HOME/rules/ecc-extras/"
cp "$EXTRAS_DIR/rules/attribution-policy.md"   "$CLAUDE_HOME/rules/ecc-extras/"
cp "$EXTRAS_DIR/rules/codex-delegation.md"     "$CLAUDE_HOME/rules/ecc-extras/"
cp "$EXTRAS_DIR/rules/codex-capacity.md"       "$CLAUDE_HOME/rules/ecc-extras/"
# Bedingte Regel („nur wenn codebase-memory im Projekt verfügbar ist") — darum immer
# verteilt, auch ohne --with-cbm: sie aktiviert nichts und kostet ohne CBM nichts.
cp "$EXTRAS_DIR/rules/cbm-workflow.md"         "$CLAUDE_HOME/rules/ecc-extras/"
cp "$EXTRAS_DIR/agents/rpi-"*.md               "$CLAUDE_HOME/agents/"
[ "$EXTRAS_DIR/commands/start.md" -ef "$CLAUDE_HOME/commands/start.md" ] || cp "$EXTRAS_DIR/commands/start.md" "$CLAUDE_HOME/commands/"
if [ -d "$EXTRAS_DIR/contexts" ]; then cp "$EXTRAS_DIR/contexts/"*.md "$CLAUDE_HOME/contexts/" 2>/dev/null || true; fi
echo "[VPS] Extras gelayert: /ecc-onboard, /mega-plan, /start, karpathy + attribution, cbm-workflow, rpi-Advisors."

# 3) Optionale Härtung (opt-in) — ändert settings.json additiv, immer mit Backup
if [ "$HARDEN" -eq 1 ]; then
  echo "[VPS] --harden: füge deny-Sicherheitsbasis zu settings.json hinzu (mit Backup)..."
  TS="$(date +%Y%m%d-%H%M%S)"
  cp -p "$CLAUDE_HOME/settings.json" "$CLAUDE_HOME/settings.json.bak-harden-$TS"
  node - "$CLAUDE_HOME/settings.json" <<'NODE'
const fs = require('fs');
const p = process.argv[2];
const s = JSON.parse(fs.readFileSync(p, 'utf8'));
if (!JSON.stringify(s.hooks?.PreToolUse || []).includes('rtk hook claude')) {
  console.error('[VPS] ABBRUCH: RTK-Hook nicht gefunden — settings.json nicht verändert.');
  process.exit(1);
}
const deny = [
  "Bash(rm -rf /)","Bash(rm -rf /*)","Bash(rm -rf ~)","Bash(rm -rf ~/*)",
  "Bash(sudo rm*)","Bash(git push --force*)","Bash(git push -f *)",
  "Read(./.env)","Read(./**/.env)","Read(./**/.env.*)",
  "Read(~/.ssh/**)","Read(~/.aws/**)","Read(./**/*.pem)"
];
s.permissions = s.permissions || {};
const set = new Set(s.permissions.deny || []);
deny.forEach(d => set.add(d));
s.permissions.deny = [...set];
fs.writeFileSync(p, JSON.stringify(s, null, 2) + '\n');
console.log('[VPS] deny-Baseline gesetzt (' + s.permissions.deny.length + ' Einträge). RTK-Hook erhalten.');
NODE
fi

# 4) Codebase Memory (opt-in) — Binary global, MCP bleibt projektlokal.
if [ "$WITH_CBM" -eq 1 ]; then
  echo ""
  echo "[VPS] Codebase Memory (--with-cbm):"
  [ -f "$CBM_MANAGE" ] || { echo "[VPS] FEHLER: $CBM_MANAGE fehlt — Repo unvollständig ausgecheckt?" >&2; exit 1; }

  # Schicht-2-Komponenten verteilen (kollisionsfreier cbm-Namensraum).
  mkdir -p "$CLAUDE_HOME/commands" "$CLAUDE_HOME/skills/cbm-code-intelligence"
  [ "$EXTRAS_DIR/commands/cbm.md" -ef "$CLAUDE_HOME/commands/cbm.md" ] || cp "$EXTRAS_DIR/commands/cbm.md" "$CLAUDE_HOME/commands/"
  [ "$EXTRAS_DIR/skills/cbm-code-intelligence/SKILL.md" -ef "$CLAUDE_HOME/skills/cbm-code-intelligence/SKILL.md" ] \
    || cp "$EXTRAS_DIR/skills/cbm-code-intelligence/SKILL.md" "$CLAUDE_HOME/skills/cbm-code-intelligence/"
  echo "[VPS]   verteilt: /cbm + Skill cbm-code-intelligence"

  if ! bash "$CBM_MANAGE" install; then
    echo "[VPS] FEHLER: CBM-Installation fehlgeschlagen — es wird NICHT still weitergemacht." >&2
    echo "[VPS] Nächster Schritt: 'bash $CBM_MANAGE dry-run' zeigt den Plan," >&2
    echo "[VPS]   'bash $CBM_MANAGE status' den Ist-Zustand. Bestehende Installation" >&2
    echo "[VPS]   ggf. zurückrollen: 'bash $CBM_MANAGE rollback'." >&2
    exit 1
  fi
  if ! bash "$CBM_MANAGE" verify; then
    echo "[VPS] FEHLER: CBM-Verifikation rot — Installation nicht abnahmefähig." >&2
    echo "[VPS] Nächster Schritt: obigen FAIL lesen, dann 'bash $CBM_MANAGE install' erneut" >&2
    echo "[VPS]   oder 'bash $CBM_MANAGE rollback'." >&2
    exit 1
  fi
  echo "[VPS]   CBM global installiert + verifiziert. MCP ist noch in KEINEM Projekt aktiv."
  echo "[VPS]   Aktivieren je Projekt: /cbm enable  (oder /ecc-onboard --with-cbm)"
fi

echo "[VPS] Fertig. Single Source = globales Plugin. Hook-Profil via ECC_HOOK_PROFILE (docs/WO-LAEUFT-WAS.md)."

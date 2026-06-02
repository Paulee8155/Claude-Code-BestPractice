#!/usr/bin/env bash
# install-vps.sh — Reproduzierbarer, RTK-sicherer VPS-weiter Rollout des fusionierten Harness.
#
# Installiert ECC (vendored in ./ecc) global nach ~/.claude (namespace-sicher) und
# layert die kuratierten BestPractice-Extras (RPI-Workflow + Karpathy-Rule) darüber.
#
# Sicherheit:
#   - Fasst settings.json / settings.local.json / CLAUDE.md standardmäßig NICHT an.
#   - Der globale RTK-Hook (PreToolUse:Bash) bleibt unangetastet.
#   - ECC-Hooks bleiben INAKTIV (Security-First-Default) — Aktivierung nur manuell.
#   - Optionale Härtung (deny-Baseline) NUR mit --harden, immer mit Backup.
#
# Usage:
#   ./install-vps.sh                 # ECC global (core) + BP-Extras layern
#   ./install-vps.sh --profile full  # anderes ECC-Profil
#   ./install-vps.sh --harden        # zusätzlich deny-Sicherheitsbasis in settings.json (opt-in)
#   ./install-vps.sh --dry-run       # nur ECC-Install-Plan anzeigen, nichts schreiben

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ECC_DIR="$REPO_DIR/ecc"
EXTRAS_DIR="$REPO_DIR/bestpractice-extras"
CLAUDE_HOME="${CLAUDE_HOME:-$HOME/.claude}"

PROFILE="core"
DRY_RUN=0
HARDEN=0
while [ $# -gt 0 ]; do
  case "$1" in
    --profile) PROFILE="$2"; shift 2 ;;
    --dry-run) DRY_RUN=1; shift ;;
    --harden)  HARDEN=1; shift ;;
    *) echo "Unbekannte Option: $1"; exit 1 ;;
  esac
done

echo "[VPS] Repo:        $REPO_DIR"
echo "[VPS] ECC-Engine:  $ECC_DIR"
echo "[VPS] Ziel (~/.claude): $CLAUDE_HOME"
echo "[VPS] Profil:      $PROFILE"

# 1) Deps der vendored ECC sicherstellen
if [ ! -d "$ECC_DIR/node_modules" ]; then
  echo "[VPS] Installiere ECC-Dependencies..."
  (cd "$ECC_DIR" && npm ci --no-audit --no-fund --loglevel=error)
fi

# 2) ECC global installieren (oder Plan zeigen)
if [ "$DRY_RUN" -eq 1 ]; then
  echo "[VPS] DRY-RUN — ECC-Install-Plan:"
  (cd "$ECC_DIR" && node scripts/install-apply.js --target claude --profile "$PROFILE" --dry-run)
  echo "[VPS] DRY-RUN beendet. Keine Änderungen geschrieben."
  exit 0
fi

echo "[VPS] Installiere ECC global (namespace-sicher: rules/ecc, skills/ecc, agents, commands)..."
(cd "$ECC_DIR" && node scripts/install-apply.js --target claude --profile "$PROFILE")

# 3) BestPractice-Extras layern (Karpathy-Rule + ECC-Onboard-Command)
#    ECC ist führend; RPI/adopt-project entfernt (redundant zu ECC-Workflow + /ecc-onboard).
echo "[VPS] Layere BestPractice-Extras (Karpathy + /ecc-onboard + /mega-plan)..."
mkdir -p "$CLAUDE_HOME/commands" "$CLAUDE_HOME/rules/ecc-extras"
cp "$EXTRAS_DIR/commands/ecc-onboard.md"       "$CLAUDE_HOME/commands/"
cp "$EXTRAS_DIR/commands/mega-plan.md"         "$CLAUDE_HOME/commands/"
cp "$EXTRAS_DIR/rules/karpathy-principles.md"  "$CLAUDE_HOME/rules/ecc-extras/"
echo "[VPS] Extras gelayert: /ecc-onboard, /mega-plan, karpathy-principles."

# 4) Optionale Härtung (opt-in) — ändert settings.json additiv, immer mit Backup
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

# 5) Health-Check
echo "[VPS] Health-Check (ecc doctor)..."
(cd "$ECC_DIR" && node scripts/ecc.js doctor || true)

echo "[VPS] Fertig. ECC ist VPS-weit aktiv. ECC-Hooks bleiben inaktiv bis zur manuellen Aktivierung."
echo "[VPS] Doku: docs/ECC-Harness-Guide.de.docx / .pptx"

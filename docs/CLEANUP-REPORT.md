# Cleanup-Report — ECC als führendes Harness

Datum: 2026-05-29 · Branch: `main` · Backup: `~/.claude/.harness-backup/20260529-133309/`

## Ziel

ECC als führendes Harness etablieren, redundante Workflow-Familien entfernen, veraltete
context-mode-Config beseitigen und einen One-Shot-Projekt-Onboarding-Command bereitstellen.

## Durchgeführte Änderungen

### A1 — RPI entfernt (redundant zu ECC)
- `~/.claude/commands/rpi/` (research, plan, implement) — **entfernt**
- `~/.claude/agents/rpi/` (8 Agents) — **entfernt**
- `~/.claude/commands/adopt-project.md` — **entfernt** (in `/ecc-onboard` aufgegangen)
- Repo-Quellen nach `bestpractice-extras/_archive/` verschoben (Historie erhalten):
  `rpi-commands/`, `rpi-agents/`, `adopt-project.md`
- `install-vps.sh`: RPI/adopt-project-Copy-Block entfernt, durch `/ecc-onboard`-Copy ersetzt.
- **PRP-Suite (`/prp-*`) bleibt** — gehört zu ECC, nicht zu RPI.

### A2 — feature-dev-3-fach-Konflikt gelöst
- ECC-Version `~/.claude/commands/feature-dev.md` ist kanonisch (bleibt).
- Offizielles `feature-dev@claude-plugins-official` in `settings.json` → `enabledPlugins` auf
  **`false`** gesetzt (Plugin installiert, aber inaktiv; kein konkurrierendes `feature-dev:feature-dev`).
- Andere Plugins (claude-mem, codex, superpowers, RTK, …) unangetastet.

### A3 — continuous-learning
- **Keine Änderung.** v1 (`skills/ecc/continuous-learning/`) backt die aktiven `observe`-Hooks
  (`pre/post:observe:continuous-learning` in `hooks/memory-persistence/hooks.json`) und hat eigene
  Logik (`evaluate-session.sh`). v2 ist der vollständige Workflow-Skill. **Kein Duplikat** — beide
  behalten, sonst brechen die Learning-Hooks.

### A4 — context-mode entfernt
- `~/.claude/CLAUDE.md` neu geschrieben: `@context-mode.md`-Import, Session-Start-Protokoll mit
  `ctx_*`, ctx-Tool-Matrix und „Fallback bei Disconnect" entfernt. Ausgerichtet auf
  **ECC-Workflow + RTK + claude-mem + markitdown**. Modell-Strategie auf Opus 4.8 aktualisiert.
- `~/.claude/context-mode.md` → `~/.claude/_archive/context-mode.md`.

### B — One-Shot Onboarding-Command `/ecc-onboard`
- Neu: `bestpractice-extras/commands/ecc-onboard.md`, aktiv unter `~/.claude/commands/`.
- Auto-Detect Stack → Dry-Run-Plan → 1× Bestätigung → project-level Install
  (`install-apply.js --target claude-project`) → `PROJECT_RULES.md` + `state/` füllen.
- Orchestriert vorhandene Mechanik (project-init Detection, ECC-Installer, adopt-project-Templates).
- Kritisch dokumentiert: aus **Zielprojekt-cwd** laufen, Script per absolutem Pfad — sonst landet
  die Installation in ECCs eigenem `.claude/`.

## Verifiziert
- ECC-Installer Dry-Run (`--list-profiles`, `--target claude-project --dry-run`) funktioniert.
- `Install root` zeigt korrekt aufs Zielprojekt bei cwd=Projekt + absolutem Script-Pfad.
- `settings.json` valides JSON, feature-dev=false, RTK-Hook intakt.
- CLAUDE.md frei von `ctx_`/`context-mode`.

## Offene Folge-Aufgaben (nicht Teil dieses Durchlaufs)
- Word/PPTX-Guide (`docs/ECC-Harness-Guide.de.*`) erwähnt noch RPI/adopt-project → aktualisieren.
- Ggf. globaler Re-Install via `install-vps.sh` auf weiteren Maschinen, falls vorhanden.

## Rollback
Backup unter `~/.claude/.harness-backup/20260529-133309/` (commands/rpi, agents/rpi,
adopt-project.md, CLAUDE.md, context-mode.md, settings.json, installed_plugins.json).

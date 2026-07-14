---
description: Codebase Memory (Code-Intelligence-Graph) je Projekt verwalten — status, enable, reindex, doctor, disable. Binary ist global, der MCP-Server wird nur in bestätigten Projekten aktiviert.
---

# /cbm

Verwaltet **Codebase Memory** für das aktuelle Projekt. Die Binary ist VPS-weit
installiert; der MCP-Server läuft **nur in Projekten, die ihn ausdrücklich aktiviert
haben**. Dieser Befehl ist bewusst dünn — die Logik liegt in deterministischen
Skripten, die Arbeitsweise im Skill `cbm-code-intelligence`.

Argument: `$ARGUMENTS` (`status` · `enable` · `reindex` · `doctor` · `disable`; leer = `status`)

## Ausführung

```bash
SCRIPT="${CBM_SCRIPTS:-/root/projekte/Claude Code BestPractice/bestpractice-extras/scripts/cbm}/project.js"
```

Bewusst der Repo-Pfad und keine globale Kopie: Es gibt genau **eine** Wahrheit, die
nicht auseinanderdriften kann. Der Befehl wirkt trotzdem in jedem Projekt, weil er
immer auf das aktuelle Arbeitsverzeichnis schaut.

Alle schreibenden Aktionen sind **ohne `--yes` ein Dry-Run**. Der Ablauf ist immer:
Dry-Run zeigen → Bestätigung einholen → mit `--yes` ausführen.

| Argument | Aufruf |
|---|---|
| `status` (Default) | `node "$SCRIPT" status` — nur lesen, direkt ausführen |
| `doctor` | `node "$SCRIPT" doctor` — nur lesen, direkt ausführen |
| `enable` | 1. `node "$SCRIPT" enable` (Dry-Run) → 2. Plan zeigen, **Bestätigung einholen** → 3. `node "$SCRIPT" enable --yes` |
| `reindex` | 1. `node "$SCRIPT" reindex` (zeigt Ist-Stand) → 2. bestätigen lassen → 3. `node "$SCRIPT" reindex --yes` |
| `disable` | 1. `node "$SCRIPT" disable` (Dry-Run) → 2. bestätigen lassen → 3. `node "$SCRIPT" disable --yes` |

## Regeln

- **Niemals `--yes` ohne vorherige, ausdrückliche Zustimmung des Nutzers.**
- Nach `enable`/`disable`: den Nutzer darauf hinweisen, dass die Claude-Code-Session
  **neu gestartet** werden muss — MCP-Server werden nur beim Session-Start geladen.
  Danach `/mcp` prüfen.
- **`delete_project` nie aufrufen.** `disable` behält den Index bewusst. Löschen ist
  eine gesonderte Handentscheidung; `disable` druckt den Befehl dazu aus.
- Fehlt die globale Binary, meldet das Skript das mitsamt Installationsbefehl
  (`./install-vps.sh --with-cbm`). Nicht selbst herumbasteln.
- Ein rotes `doctor` nicht übergehen — die FAILs benennen den nächsten Schritt.
- Budget: CBM steuert **1 MCP-Server und 14 Tools** bei (Harness-Grenze: 10 Server /
  80 Tools) — aber nur in aktivierten Projekten. Die realen Zahlen stehen in einer
  frischen Session unter `/mcp` und `/context`.

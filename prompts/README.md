# Master-Setup-Prompts

Zwei copy-paste Prompts die du in eine frische Claude Code Session pasten kannst, damit Claude das komplette Harness-Setup autonom durchführt: Tools prüfen, fehlende installieren (mit Bestätigung), Harness ins Verzeichnis bringen, Templates füllen, alles verifizieren.

## Welchen Prompt nutze ich?

| Situation | Deutsch | English |
|---|---|---|
| Leeres Verzeichnis oder fast leer (max .git/.gitignore/README) — du startest ein neues Projekt | [`master-setup-new-project.md`](master-setup-new-project.md) | [`master-setup-new-project.en.md`](master-setup-new-project.en.md) |
| Bestehende Codebase mit echten Files (egal welche Sprache/Framework) — du willst das Harness drüber legen ohne was kaputt zu machen | [`master-setup-existing-project.md`](master-setup-existing-project.md) | [`master-setup-existing-project.en.md`](master-setup-existing-project.en.md) |

> Note: the German prompts are the source of truth. English versions are 1:1 translations kept in sync.

## Wie nutze ich sie?

1. `cd` in dein Zielverzeichnis
2. Claude Code starten
3. Den passenden Prompt öffnen
4. Den Block zwischen den `===`-Linien komplett kopieren
5. In Claude Code reinpasten und abschicken
6. Claude führt 7 (neu) bzw. 9 (bestehend) Schritte ab und berichtet nach jedem Schritt

## Was die Prompts NICHT machen

- **Keine Tool-Installs ohne Bestätigung** — Claude fragt vorher per AskUserQuestion
- **Kein `git push`** — du entscheidest wann und wohin
- **Kein Code-Anfassen im bestehenden Projekt** — Claude füllt nur Harness-Templates
- **Keine erfundenen Werte** — wenn Claude was nicht aus dem Code ableiten kann, fragt er

## Voraussetzungen

Die Prompts prüfen alle Voraussetzungen selbst und installieren bei Bedarf. Du brauchst nichts vorher manuell zu installieren — außer vielleicht Claude Code selbst und git.

Erwartete Tools (werden geprüft, fehlende werden mit deiner Zustimmung nachinstalliert):
- `git`, `node` (≥ 18), `python3` (≥ 3.10), `rtk`, `bun`, `gh` (optional)
- `claude-mem` (für Cross-Session-Memory mit Web UI)

## Nach dem Setup

Beide Prompts enden mit einem Final Report der dir sagt:
- Was installiert wurde
- Was du noch selbst machen musst (typisch: PROJECT_RULES.md final reviewen, Claude Code neustarten für MCP-Reload)
- Erste Test-Befehle (`/rpi:plan`, `/rpi:research`, `/rpi:implement`)

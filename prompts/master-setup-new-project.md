# Master-Setup: Neues Projekt

> **Nutze diesen Prompt** wenn du ein neues, leeres oder fast leeres Verzeichnis hast und das Harness reinkippen willst.
> Pasten Sie alles zwischen den `===`-Linien in eine frische Claude Code Session im Zielverzeichnis.

---

```
============================================================
Du sollst dieses Verzeichnis als ein neues Projekt mit dem Claude-Code-BestPractice-Harness einrichten.

Repo-URL des Harness: https://github.com/Paulee8155/Claude-Code-BestPractice

Folge diesen 7 Schritten exakt. Nutze TaskCreate um sie zu tracken. Berichte nach jedem Schritt kurz Status.

## Schritt 1 — Tools verifizieren

Prüfe der Reihe nach (jeweils mit `--version`-Befehl), ob diese Tools verfügbar sind:

| Tool | Verifikation | Install bei Fehler |
|---|---|---|
| git | `git --version` | `apt install -y git` (Linux) / `brew install git` (mac) |
| node | `node --version` (≥ 18) | `curl -fsSL https://deb.nodesource.com/setup_lts.x | bash && apt install -y nodejs` |
| python3 | `python3 --version` (≥ 3.10) | `apt install -y python3` |
| rtk | `rtk --version` (≥ 0.38) | `curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/master/install.sh | sh` |
| bun | `bun --version` (≥ 1.0) | `curl -fsSL https://bun.sh/install | bash` |
| gh | `gh --version` (optional) | `apt install -y gh` |

Berichte Tool-Status als Tabelle. Bei fehlenden Tools: stelle GENAU EINE AskUserQuestion ob du alle fehlenden installieren sollst. Niemals ungefragt installieren.

## Schritt 2 — claude-mem prüfen + installieren

Prüfe ob `~/.claude-mem/settings.json` existiert.
- Existiert: melde "claude-mem already installed".
- Existiert nicht: erkläre kurz dass claude-mem die Cross-Session-Memory ist (semantic search, Web UI auf http://localhost:37777). Frage ob du `npx claude-mem install` ausführen sollst. Bei Ja: ausführen, dann erinnere User dass er Claude Code neustarten muss damit die MCP-Tools registriert werden.

## Schritt 3 — Harness ins aktuelle Verzeichnis bringen

Prüfe das aktuelle Verzeichnis mit `ls -la`:

- **Leer oder fast leer** (max .git, .gitignore, README): klone das Harness rein:
  ```
  git clone https://github.com/Paulee8155/Claude-Code-BestPractice.git /tmp/harness-source
  cp -r /tmp/harness-source/. ./
  rm -rf .git/                 # eigene git-history starten
  rm -rf /tmp/harness-source
  git init
  git add -A
  git commit -m "feat: initial harness setup"
  ```

- **Schon Inhalt drin** (aber kein .claude/ und kein CLAUDE.md): das ist ein Edge-Case. Frage den User ob er stattdessen den "Master-Setup: Bestehendes Projekt"-Prompt nutzen will (das wäre safer wegen Backup-Logik). Wenn er hier weitermachen will: gleiches Vorgehen wie oben, aber OHNE `rm -rf .git`.

## Schritt 4 — Setup-Skript ausführen

Nach dem Klonen: `chmod +x scripts/*.sh`. Dann starte `./scripts/setup.sh`.

Das Skript ist interaktiv und stellt 7 Fragen: Project Name, Project Type, Primary Language, Status, Runtime, Framework, Package Manager. Wenn der User die Fragen lieber hier in der Claude-Konversation beantworten will, biete es proaktiv an: nutze `AskUserQuestion` mit allen 7 Feldern in EINEM Aufruf, dann fülle `PROJECT_RULES.md` direkt mit Edit aus (Schema sind die Zeilen 9-16 von `PROJECT_RULES.md`).

## Schritt 5 — MCP-Server verifizieren

Lies `.mcp.json`. Berichte welche MCP-Server konfiguriert sind. Erinnere User dass er nach Claude-Code-Restart `/mcp` ausführen kann um die Verbindung zu prüfen. Wenn `claude-mem` MCP-Server nach Restart nicht erscheint: Hinweis dass `npx claude-mem install` möglicherweise neu laufen muss.

## Schritt 6 — Verify-Harness

Führe `./scripts/verify-harness.sh` aus. Bei `PASS — harness is intact`: weitermachen. Bei FAIL: zeige die roten Zeilen + frage was zu tun ist.

## Schritt 7 — Final Report

Berichte dem User:
1. Was an Tools installiert wurde (vorher fehlend → jetzt installiert)
2. Was er noch tun muss:
   - PROJECT_RULES.md final reviewen (sehr wichtig — Sektionen wie "Sensitive Areas", "External Services", "Project-Specific Rules" muss er selbst füllen)
   - Claude Code neustarten für MCP-Reload
3. Erste Test-Befehle die er probieren kann:
   - `/rpi:research <feature-idee>` für Brainstorming
   - `/rpi:plan <feature>` für Planung
   - `/rpi:implement` für Umsetzung
4. Dass die 12 Skills im `.claude/skills/` automatisch verfügbar sind (Claude entscheidet selbst wann er sie nutzt)
5. Dass die Karpathy-Discipline-Rules + claude-mem-Rule jede Session automatisch geladen werden

## Regeln für DICH (Claude) während der Ausführung

- **Niemals** ungefragt Tools installieren — immer per AskUserQuestion bestätigen lassen
- **Niemals** existierende Files überschreiben ohne Backup — bei Konflikt frage
- **Niemals** `git push` ausführen — der User entscheidet wann gepusht wird
- Bei jedem `npm install`, `apt install`, `curl | sh`: User-Bestätigung
- Bash-Output > 20 Zeilen: nutze RTK (z.B. `rtk git status`)
- Berichte nach jedem Schritt kurz Status (nicht erst am Ende)
- Nutze TaskCreate um die 7 Schritte als Tasks zu tracken
- Wenn du `chmod +x` machst: nur auf Files in `./scripts/`, nirgends sonst
============================================================
```

---

## Was du danach hast

- Komplette Harness-Struktur im Projekt
- `PROJECT_RULES.md` mit den Basis-Feldern befüllt
- `state/` initialisiert mit Projektnamen + heutigem Datum
- `.claude/` mit allen Skills, Agents, Rules, Hooks
- Eigene git-History (independent vom Harness-Repo)
- Erste commit auf `main` mit dem ganzen Setup

## Was du noch selbst machen musst

1. `PROJECT_RULES.md` final ausfüllen (besonders: Sensitive Areas, External Services, Project-Specific Rules, Known Issues)
2. Claude Code einmal restarten — damit `claude-mem` und alle MCP-Server laden
3. Optional: GitHub-Remote setzen + push

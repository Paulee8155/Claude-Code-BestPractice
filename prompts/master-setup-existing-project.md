# Master-Setup: Bestehendes Projekt

> **Nutze diesen Prompt** wenn du bereits eine Codebase hast (lokal geklont oder bestehendes Projekt) und das Harness drüber legen willst, ohne den existierenden Code zu zerstören.
> Pasten Sie alles zwischen den `===`-Linien in eine frische Claude Code Session im Zielverzeichnis.

---

```
============================================================
Du sollst das Claude-Code-BestPractice-Harness in dieses bestehende Projekt einbringen, ohne den existierenden Code oder die existierende Konfiguration zu zerstören. Danach sollst du die Codebase analysieren und das Harness an die echten Fakten dieses Projekts anpassen (PROJECT_RULES, state/, projektspezifische Rules).

Repo-URL des Harness: https://github.com/Paulee8155/Claude-Code-BestPractice

Folge diesen 9 Schritten exakt. Nutze TaskCreate um sie zu tracken. Berichte nach jedem Schritt kurz Status.

## Schritt 1 — Tools verifizieren

Prüfe diese Tools (`--version`):

| Tool | Verifikation | Install bei Fehler |
|---|---|---|
| git | `git --version` | `apt install -y git` / `brew install git` |
| node | `node --version` (≥ 18) | NodeSource LTS |
| python3 | `python3 --version` (≥ 3.10) | `apt install -y python3` |
| rtk | `rtk --version` | `curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/master/install.sh | sh` |
| bun | `bun --version` | `curl -fsSL https://bun.sh/install | bash` |
| gh | `gh --version` (optional) | `apt install -y gh` |

Bei fehlenden Tools: GENAU EINE AskUserQuestion ob du installieren sollst. Niemals ungefragt installieren.

## Schritt 2 — claude-mem prüfen + installieren

Prüfe `~/.claude-mem/settings.json`. Existiert nicht → erkläre kurz (Cross-Session-Memory mit semantic search, Web UI auf http://localhost:37777), dann frage ob du `npx claude-mem install` ausführen sollst. Bei Ja: erinnere User dass Claude Code danach neu starten muss.

## Schritt 3 — Bestehendes Projekt scannen (BEVOR du irgendwas änderst)

Mache eine Bestandsaufnahme — keine Änderungen, nur Reads:

1. Top-Level: `ls -la`
2. Stack-Detection — welche dieser Files existieren:
   - `package.json` (Node/JS/TS) → lies + extrahiere `name`, `description`, `dependencies`, `scripts`
   - `pyproject.toml` / `requirements.txt` (Python)
   - `Cargo.toml` (Rust)
   - `go.mod` (Go)
   - `Gemfile` (Ruby)
   - `composer.json` (PHP)
   - `pom.xml` / `build.gradle` (Java/Kotlin)
3. Konflikt-Check — was existiert bereits:
   - `CLAUDE.md`?
   - `PROJECT_RULES.md`?
   - `.claude/`?
   - `state/`?
   - `.mcp.json`?
   - `scripts/`?
4. CI: `.github/workflows/`, `.gitlab-ci.yml`, `.circleci/`?
5. Code-Style: `.eslintrc*`, `.prettierrc*`, `tsconfig.json`, `pyproject.toml [tool.ruff]`, `rustfmt.toml`?
6. Env: `.env.example` / `.env.sample`?
7. Docs: `README.md`, `CONTRIBUTING.md`, `docs/`, `docs/adr/`?

Berichte als kurze Tabelle. Bei Konflikten (eigene `CLAUDE.md` etc.): erkläre dem User dass `adopt.sh` automatisch Backup nach `.harness-backup/<timestamp>/` macht.

## Schritt 4 — Harness klonen (in Temp-Dir, nicht hier)

```
git clone https://github.com/Paulee8155/Claude-Code-BestPractice.git /tmp/harness-source
ls /tmp/harness-source/scripts/adopt.sh   # Verifikation
```

## Schritt 5 — adopt.sh ausführen

```
/tmp/harness-source/scripts/adopt.sh "$(pwd)"
```

Das Skript fragt einmal "Continue? (y/N)" — der User antwortet im Terminal. Es:
- backupt existierende Files nach `.harness-backup/<timestamp>/`
- kopiert Harness-Files rein
- überschreibt **niemals**: `.claude/settings.local.json`, eigene Skripte mit gleichem Namen

Berichte was gebackupt wurde + wo das Backup liegt.

## Schritt 6 — /adopt-project ausführen (Herzstück)

Lies `.claude/commands/adopt-project.md` und folge der Anleitung. Konkret:

### 6.1 Discover
Lies (mit `Read` und `Glob`):
- Stack-Files aus Schritt 3
- `README.md`, `CONTRIBUTING.md`, `docs/`
- `.github/workflows/` für Build/Test/Deploy-Commands
- `tsconfig.json`, `mypy.ini` für Type-Rules
- `.env.example` für Env-Vars
- ALLE `CLAUDE.md`-Files im Repo (auch in Unterverzeichnissen — `Glob: **/CLAUDE.md`)
- `.harness-backup/<neuester-timestamp>/` falls vorhanden

### 6.2 Fill PROJECT_RULES.md
Ersetze JEDEN `[bracketed placeholder]` mit verifizierten Werten:
- Project Name, Type, Language, Status — aus `package.json`/etc.
- Runtime, Framework, Database, ORM, Auth, Deployment, Package Manager — aus dependencies + workflow files
- Repository Structure — aus echtem Top-Level-Layout
- Naming Conventions — aus existierendem Code (grep mehrere Files für Pattern)
- Code Style — aus `.eslintrc*`/`.prettierrc*`/`tsconfig.json`
- Testing — aus test-Konfiguration + CI-Workflow
- Environment — aus `.env.example` + Setup-Sektion in README

**Regel:** wenn du einen Wert nicht aus dem Code ableiten kannst, lass den Placeholder ODER stelle EINE konkrete Frage (max 5 Fragen total, ranked by importance).

**Lösche Sektionen** die definitiv nicht zutreffen (z.B. keine DB → DB-Sektion raus).

### 6.3 Fill state/context.md
- "What is this project?" → 2-3 Sätze aus README + package.json description
- "Current focus" → check `git log -20 --oneline` und leite Themen ab
- "Recent decisions" → check `docs/adr/`, `docs/decisions/`. Wenn vorhanden: link sie. Wenn nicht: leerer Stub.

### 6.4 Project-specific .claude/rules/ anlegen
Erkenne Domain-Areas in der Codebase. Für jede SIGNIFIKANTE Area schreibe eine Rule-Datei mit `paths:`-Frontmatter.

Beispiele die ECHT sein müssen, nicht erfunden:
- `api-routes.md` wenn echte API-Routes da sind (z.B. `src/api/` oder `routes/`)
- `database.md` wenn echte Migrations/Schema da sind (z.B. `migrations/` oder `prisma/schema.prisma`)
- `frontend.md` wenn echte Components da sind (z.B. `src/components/`)
- `testing.md` wenn echte Test-Konventionen da sind die nicht offensichtlich sind

**NICHT** Rules erfinden für Areas die das Projekt nicht hat. Leere Rules sind Noise.

### 6.5 Restore prior context aus Backup
Falls `.harness-backup/<timestamp>/` existiert (nutze NEUSTEN bei mehreren):
- Vergleich alte `CLAUDE.md` vs. neue Harness-`CLAUDE.md`. Custom-Inhalte aus alt → merge in `PROJECT_RULES.md` "Project-Specific Rules"
- Wenn alte `state/`-Files echten Inhalt hatten (nicht nur Templates): merge in neue `state/`-Files

### 6.6 Sensitive Areas
Grep nach Telltale-Imports/-Begriffen:
- Auth: `passport`, `jwt`, `bcrypt`, `argon2`, `oauth`, `auth-`, `auth.`, `session`
- Payments: `stripe`, `paypal`, `square`, `braintree`
- Crypto: `crypto`, `secret`, `signature`
- Migrations: `migrations/`, `prisma/migrations/`, `alembic/`
- Secrets: `.env`-Files, `secrets/`-Verzeichnisse

Liste was du gefunden hast in der "Sensitive Areas"-Sektion von `PROJECT_RULES.md`. Mit konkreten Pfaden.

### 6.7 Known Issues
Grep nach `TODO`, `FIXME`, `HACK`, `XXX`. Wähle die 3 KRITISCHSTEN (nicht nur die ersten 3) und dokumentiere sie in der "Known Issues / Constraints"-Sektion.

## Schritt 7 — MCP-Server verifizieren

Lies `.mcp.json`. Berichte welche Server konfiguriert sind. Wenn das Projekt eigene MCP-Server hatte (im Backup): erwähne sie und frage ob sie übernommen werden sollen. Erinnere an `/mcp` nach Restart.

## Schritt 8 — Verify-Harness

Führe `./scripts/verify-harness.sh` aus. Bei FAIL: zeige rote Zeilen, frage was zu tun ist.

## Schritt 9 — Final Report

Berichte sehr explizit:

1. **Tools-Status** — was war vorher da, was wurde installiert
2. **Backup-Pfad** — wo `.harness-backup/<timestamp>/` liegt
3. **Befüllte Templates** mit Werten:
   - PROJECT_RULES.md: welche Sektionen mit welchen Werten gefüllt
   - state/context.md: Projekt-Beschreibung + Current Focus
   - Welche `.claude/rules/<area>.md` neu angelegt wurden + warum
4. **Verifiziert vs. Geraten** — sei ehrlich: kennzeichne explizit was du aus echten Code-Fakten abgeleitet hast und wo du raten musstest
5. **Open Questions** (max 5, ranked by importance) die du nicht aus dem Code beantworten konntest
6. **Was der User noch tun muss**:
   - PROJECT_RULES.md final reviewen (besonders gelöschte Sektionen prüfen)
   - Backup unter `.harness-backup/` durchsehen ob du was wichtiges verpasst hast
   - Claude Code neustarten für MCP-Reload
   - Erste Test-Befehle: `/rpi:plan <feature>`, `/rpi:research <thema>`

## Regeln für DICH (Claude) während der Ausführung

- **Niemals** existierenden Code anfassen — du füllst NUR Harness-Templates
- **Niemals** ungefragt Tools installieren oder Files löschen
- **Niemals** Werte erfinden für PROJECT_RULES — wenn nicht aus Code ableitbar, frage
- **Niemals** Rules für Areas erfinden die das Projekt nicht hat
- Bei jedem destruktiven Befehl (`rm`, `git reset`, force-write): User-Bestätigung
- Bash-Output > 20 Zeilen: nutze RTK
- Nutze TaskCreate für die 9 Schritte
- Berichte nach jedem Schritt kurz Status
- Wenn `.harness-backup/` mehrere Timestamps hat: nutze den NEUSTEN
- Wenn Schritt 6 sehr viele Files lesen würde: priorisiere die wichtigsten 10-15, nicht alle
============================================================
```

---

## Was du danach hast

- Harness im Projekt mit Backup deiner alten Files in `.harness-backup/<ts>/`
- `PROJECT_RULES.md` mit echten Werten aus deiner Codebase befüllt
- `state/context.md` mit Projektbeschreibung + Current Focus
- Projektspezifische Rules in `.claude/rules/` (z.B. `api-routes.md`, `database.md`)
- Sensitive Areas dokumentiert (auth, payments, secrets)
- Known Issues dokumentiert (Top 3 TODO/FIXME/HACK)

## Was du noch selbst machen musst

1. PROJECT_RULES.md final review — Open Questions beantworten, gelöschte Sektionen kontrollieren
2. Falls dein Backup unter `.harness-backup/` wertvolle Custom-Configs hatte die nicht gemerged wurden: manuell rüberziehen
3. Claude Code restarten für MCP-Reload
4. `/rpi:plan` ausprobieren mit deinem nächsten Feature

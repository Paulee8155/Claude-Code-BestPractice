---
description: Richtet das aktuelle Projekt vollständig für ECC-Workflows ein — Stack erkennen, Dry-Run zeigen, einmal bestätigen, dann ECC-Rules/Skills + PROJECT_RULES.md + state/ anlegen.
---

# /ecc-onboard

Macht das **aktuelle Projekt** ECC-ready. Ein Command, ein OK. Führt vorhandene ECC- und
BestPractice-Mechanik in einem Durchlauf zusammen:
Stack-Detection → Dry-Run-Plan → **1× Bestätigung** → project-level Install → Projekt-Kontext füllen.

ECC ist das führende Harness. Dieser Command ersetzt die früheren `/project-init`-(nur Dry-Run)
und `/adopt-project`-(nur Templates) Einzelschritte als einen kompletten Setup-Button.

## Verwendung

```text
/ecc-onboard                      # Auto-Detect, project-level (.claude/), Profil developer
/ecc-onboard --profile core       # Schlankeres Profil erzwingen
/ecc-onboard --skills continuous-learning-v2,security-review
/ecc-onboard --dry-run            # Nur Plan zeigen, nichts schreiben
```

## Feste Pfade (VPS srv1051228)

```bash
ECC_REPO="/root/projekte/Claude Code BestPractice/ecc"
EXTRAS="/root/projekte/Claude Code BestPractice/bestpractice-extras"
TEMPLATES="$EXTRAS/templates"
STACK_MAP="$ECC_REPO/config/project-stack-mappings.json"
STACK_MAP_EXTRA="$EXTRAS/config/stack-mappings-extra.json"   # Schicht-2-Overlay (weitere Stacks)
HARVEST="$EXTRAS/scripts/context-harvest/harvest.js"          # deterministische Auto-Kontext-Generierung
AUDIT="/root/.claude/plugins/cache/ecc/ecc/2.0.0-rc.1/scripts/harness-audit.js"  # Baseline-/Verify-Audit
```
Wenn `ECC_REPO` nicht existiert, abbrechen und den User bitten, das BestPractice-Repo zu prüfen.

## Sicherheitsregeln

1. **Nie ohne Bestätigung schreiben.** Erst Dry-Run, dann genau ein OK des Users abwarten.
2. **Bestehendes nicht überschreiben.** Vorhandene `.claude/`, `CLAUDE.md`, `PROJECT_RULES.md`,
   `state/` → inspizieren und **mergen/anhängen**, nie blind ersetzen. Vor jedem Überschreiben Diff zeigen.
3. **ECC-Installer nutzen**, keine Dateien von Hand kopieren.
4. **Keine Platzhalter** in PROJECT_RULES.md/state — nur verifizierte Fakten aus dem echten Code.
5. **Keine Builds/Tests/Installs** ausführen, nur lesen (`Glob`/`Read`) und den ECC-Installer aufrufen.
6. **ECC-Core unangetastet.** State-Sync wird rein **additiv** in der projekt-lokalen
   `.claude/settings.json` registriert — niemals eine Datei unter `ecc/` editieren.

## Ablauf

### Schritt 1 — Stack erkennen (read-only)

Projekt-Root lesen und Stack-Signale sammeln (überspringen was fehlt):
- Paketmanager: `package.json`, `pnpm-lock.yaml`, `yarn.lock`, `bun.lockb`
- Sprach-Manifeste: `pyproject.toml`, `requirements.txt`, `go.mod`, `Cargo.toml`, `pom.xml`, `build.gradle(.kts)`, `Gemfile`, `composer.json`
- Framework: `next.config.*`, `vite.config.*`, `tailwind.config.*`, `Dockerfile`, `docker-compose.yml`
- Bestehende Config: `CLAUDE.md`, `.claude/`, `ecc-install.json`, `.harness-backup/`

Daraus Sprach-/Framework-Komponenten ableiten (Mapping in `$STACK_MAP`):
z.B. `lang:python`, `lang:typescript`, `lang:go`, `framework:django`, `framework:nextjs`.

Zusätzlich `$STACK_MAP_EXTRA` (Schicht-2-Overlay) berücksichtigen — deckt **Angular, Vue, Nuxt,
Svelte, FastAPI, Flask, Elixir/Phoenix, Terraform** ab. Bei gleicher `id` gewinnt der Overlay-
Eintrag; der Core-`$STACK_MAP` bleibt unberührt (additiv darüber gemergt).
Default-Profil: **`developer`** (bei unklarem/leerem Stack: **`core`**).

### Schritt 2 — Dry-Run-Plan erzeugen

**Wichtig:** `--target claude-project` installiert ins **aktuelle Arbeitsverzeichnis**. Daher
IMMER aus dem **Zielprojekt-Root** laufen und das Script per **absolutem Pfad** aus dem ECC-Repo
aufrufen — niemals `cd "$ECC_REPO"` (sonst landet alles in ECCs eigenem `.claude/`).

```bash
cd "<ZIELPROJEKT-ROOT>"   # = das Projekt, das ECC-ready werden soll (i.d.R. das aktuelle cwd)
node "$ECC_REPO/scripts/install-plan.js"  --profile <profil> --target claude-project --json
node "$ECC_REPO/scripts/install-apply.js" --target claude-project --profile <profil> --dry-run --json
```
Bei `--skills`/`--config` die entsprechenden Flags statt `--profile` verwenden.

**Baseline-Audit (Verify-Vorbereitung):** `node "$AUDIT"` aus dem **Zielprojekt-Root** laufen
lassen und den Score notieren (z.B. `7/39`). Das ist die Vergleichsbasis für das Verify-Audit in
Schritt 8 — so wird „fehlender Kontext generiert" messbar statt nur behauptet.

### Schritt 3 — Einmal bestätigen (AskUserQuestion)

Dem User kompakt zeigen:
- erkannter Stack + Evidenz (welche Dateien)
- gewähltes Profil + Sprach-Packs
- was angelegt wird: `.claude/rules/ecc/` (common + Sprach-Pack), selektive `.claude/skills/ecc/`,
  `PROJECT_RULES.md`, `state/{context,decisions,progress,tasks}.md` **plus** additive State-Sync-Hooks
  in der projekt-lokalen `.claude/settings.json` (SessionStart→`pre`, Stop/PreCompact→`post`)
- Warnungen zu bereits existierenden Dateien (→ Merge statt Überschreiben)

Genau **eine** Bestätigungsfrage. Bei `--dry-run`: hier stoppen, nichts schreiben.

### Schritt 4 — ECC project-level installieren (nach OK)

```bash
cd "<ZIELPROJEKT-ROOT>"
node "$ECC_REPO/scripts/install-apply.js" --target claude-project --profile <profil>
```
Legt `.claude/rules/ecc/` + selektive `.claude/skills/ecc/` im Projekt an (managed namespace).
Verifizieren: `Install root` in der Ausgabe muss auf das **Zielprojekt** zeigen, nicht auf `$ECC_REPO/.claude`.

### Schritt 4b — State-Sync-Hooks registrieren (additiv, ECC-Core unberührt)

Den Hybrid-Loop verdrahten: `state/` (Quelle der Wahrheit) ⇄ `WORKING-CONTEXT.md` (Loop-Futter).
Registrierung erfolgt **ausschließlich** in der projekt-lokalen `.claude/settings.json` — nie in ECC.

1. **`.claude/settings.json` lesen/anlegen** und die drei Lifecycle-Hooks **mergen** (vorhandene
   Hooks-Arrays erweitern, nicht ersetzen). Idempotenz: nur eintragen, falls der `state-sync.js`-Aufruf
   noch nicht vorhanden ist.

   ```jsonc
   {
     "hooks": {
       "SessionStart": [{ "matcher": "*", "hooks": [{ "type": "command",
         "command": "node \"$CLAUDE_PROJECT_DIR/bestpractice-extras/scripts/state-sync/state-sync.js\" pre" }] }],
       "Stop":        [{ "matcher": "*", "hooks": [{ "type": "command",
         "command": "node \"$CLAUDE_PROJECT_DIR/bestpractice-extras/scripts/state-sync/state-sync.js\" post" }] }],
       "PreCompact":  [{ "matcher": "*", "hooks": [{ "type": "command",
         "command": "node \"$CLAUDE_PROJECT_DIR/bestpractice-extras/scripts/state-sync/state-sync.js\" post" }] }]
     }
   }
   ```

   Liegt `bestpractice-extras/` **nicht** im Zielprojekt (Fremd-Repo), den absoluten Pfad zum
   BestPractice-Repo verwenden:
   `node "$EXTRAS/scripts/state-sync/state-sync.js" pre|post --project "$CLAUDE_PROJECT_DIR"`.

2. **`state/.sync/` ins Projekt-`.gitignore`** aufnehmen (Snapshot-Cache, kein VCS) — nur anhängen,
   falls noch nicht vorhanden.

3. **Initialen PRE-Sync** ausführen, damit `WORKING-CONTEXT.md` sofort existiert (nach Schritt 5,
   sobald `state/` befüllt ist):

   ```bash
   node "$EXTRAS/scripts/state-sync/state-sync.js" pre --project "<ZIELPROJEKT-ROOT>"
   ```

   Erwartung: `[state-sync] PRE ok: WORKING-CONTEXT.md aus state/ generiert`. Der No-op-Guard
   überspringt still, falls (noch) kein `state/` existiert.

### Schritt 5 — Projekt-Kontext füllen (Routine aus adopt-project)

Templates aus `$TEMPLATES` ins Projekt kopieren. Dann **deterministisch vorbefüllen** (Auto-Kontext):

```bash
node "$HARVEST" --project "<ZIELPROJEKT-ROOT>"   # NACH dem Kopieren von state/
```
Erzeugt verlustfreie HARVEST-Marker-Blöcke aus **echtem Code**: `state/context.md`
(`### Current Truth` aus README-Erstabsatz + `git log -20`), `state/tasks.md` (`### Now` aus
TODO/FIXME mit `file:line`) und — falls vorhanden — `PROJECT_RULES.md` (`## Sensitive Areas` aus
Telltale-Imports stripe/jwt/bcrypt/migration). **Idempotent** (Re-Run dedupliziert) und
**verlustfrei** (Mensch-Inhalt außerhalb der Marker bleibt). `--dry-run` zeigt nur an.

Anschließend die generierten Blöcke mit **echten** Werten prüfen/verfeinern (nicht ersetzen):
- `PROJECT_RULES.template.md` → `PROJECT_RULES.md`: alle `[Platzhalter]` durch verifizierte
  Werte ersetzen; nicht zutreffende Abschnitte löschen. Sensitive Areas (auth, payments,
  migrations, crypto) per Grep auf Telltale-Imports (`stripe`, `jwt`, `bcrypt`, `migration`)
  identifizieren. 3–5 konkrete Projekt-Regeln aus echten Code-Mustern ableiten.
- `state/{context,decisions,progress,tasks}.md` aus `$TEMPLATES/state/` kopieren. Diese Templates
  enthalten **Marker-Sektionen** (`###`-Sub-Headings + HTML-Kommentar-Guidance); die Struktur
  **erhalten**, nur Inhalte ergänzen:
  - `context.md`: `### Purpose` aus README + Manifest-Beschreibung (2–3 Sätze), `### Current Truth`
    aus `git log -20 --oneline` + Architektur-Kernfakten.
  - `tasks.md`: `### Now`/`### Next` aus echten offenen TODOs/Issues/Ist-Zustand befüllen
    (Grep nach `TODO`/`FIXME`, offene Punkte aus README). Neu = Grundgerüst lassen.
  - `decisions.md`/`progress.md`: bei Bestand befüllen, sonst leeres Gerüst belassen.
  Der State-Sync liest nur diese vier Dateien; die HTML-Kommentare bleiben im generierten
  `WORKING-CONTEXT.md` unsichtbar.
- Optionale projekt-spezifische `.claude/rules/<area>.md` (mit `paths:`-Frontmatter) **nur** für
  Bereiche, die das Projekt wirklich hat (z.B. `api-routes.md`, `database.md`, `testing.md`).

### Schritt 6 — Bestehenden Kontext mergen

Wenn `.harness-backup/<ts>/` oder altes `CLAUDE.md`/`state/` existiert: custom Inhalte (keine
generischen Harness-Regeln) in `PROJECT_RULES.md` „Project-Specific Rules" bzw. die neuen
`state/`-Dateien mergen. Nichts kommentarlos verwerfen.

### Schritt 7 — Optionaler CLAUDE.md-Starter

Falls gewünscht und keine projekt-`CLAUDE.md` existiert: minimaler Starter mit erkannten
build/test/lint/dev-Befehlen. Vorhandene `CLAUDE.md` nie ohne Diff+OK ersetzen.

### Schritt 8 — Report

**Verify-Audit (Delta):** `node "$AUDIT"` erneut aus dem Zielprojekt-Root laufen lassen und den
**Score-Delta** gegen die Baseline aus Schritt 2 ausweisen (z.B. `7/39 → 30/39`). Belegt konkret,
dass Kontext generiert wurde und die Custom-Tools/Hooks greifen.

Berichten: welche Dateien angelegt/gefüllt, welche Werte verifiziert vs. erfragt, ob die
State-Sync-Hooks registriert wurden und ob der initiale PRE-Sync `WORKING-CONTEXT.md` erzeugt hat,
offene Fragen (max 5, nach Wichtigkeit), nächster Schritt (i.d.R.: PROJECT_RULES.md prüfen,
dann mit `/plan` → `/feature-dev` loslegen).

## Idempotenz

Erneuter Aufruf merged, überschreibt nichts kommentarlos. Der ECC-Installer trackt den
project-level State; bereits installierte Surfaces werden inkrementell aktualisiert. Die
State-Sync-Hooks werden nur eingetragen, falls der `state-sync.js`-Aufruf noch fehlt.

## Verwandt

- `/project-init` — nur Dry-Run-Inspektion (ECC, weiterhin verfügbar)
- `/ecc-guide` — interaktive Komponenten-Discovery vor Installation
- `bestpractice-extras/scripts/state-sync/` — State-Sync-Adapter (PRE/POST, `selftest.js`)
- `scripts/install-plan.js` / `scripts/install-apply.js` — deterministische Plan-/Apply-Operationen
- `config/project-stack-mappings.json` — Stack→Rules/Skills-Hinweise

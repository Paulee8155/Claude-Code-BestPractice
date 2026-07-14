---
description: Richtet ein Projekt schlank (plugin-only) für ECC ein — Stack erkennen, Dry-Run zeigen, einmal bestätigen, dann De-Cruft + Slim-Scaffold + maschinelle Abnahme. Funktioniert auch in fremden Repos.
---

# /ecc-onboard

Macht ein Projekt **schlank** ECC-ready. ECC-Core ist **global** (`ecc@ecc`) — ins Projekt kommt
nur der minimale projektlokale Kern. Ein deterministisches Script erledigt die Mechanik; du
verfeinerst danach `PROJECT_RULES.md` + `CLAUDE.md` mit echten Werten.

Der schlanke Fußabdruck (alles andere kommt global vom Plugin):
`.claude/settings.json` (env `ECC_HOOK_PROFILE=standard`, `ECC_GATEGUARD=off`) ·
`state/{context,decisions,tasks,progress}.md` + `state/.ecc-managed` · `WORKING-CONTEXT.md` ·
`PROJECT_RULES.md` · `CLAUDE.md` · `.claude/memory.md` · `SECURITY.md` · `.gitignore`.
**Keine** vendored `.claude/rules/ecc`, `skills/ecc`, `commands/rpi`, `plugin.json`, keine
Per-Projekt-Hooks (state-sync läuft **global**).

## Verwendung

```text
/ecc-onboard                 # aktuelles Projekt, Dry-Run → 1× OK → Apply
/ecc-onboard --project <dir> # anderes/fremdes Projekt
/ecc-onboard --with-cbm      # zusätzlich Codebase Memory aktivieren (opt-in, s.u.)
```

## Codebase Memory (`--with-cbm`, optional)

**Nur auf ausdrücklichen Wunsch.** Ohne das Flag ändert sich am Onboarding nichts —
CBM wird dann weder aktiviert noch geprüft, und `onboard-verify` meldet lediglich
„optional nicht aktiviert".

Mit dem Flag ruft `onboard.js` dieselbe Projektlogik wie `/cbm enable`
(`scripts/cbm/project.js`): `.mcp.json` additiv ergänzen, `.cbmignore`-Managed-Block
pflegen, Projekt **einmalig** indexieren, Architektur-Smoke-Test. Es wird nichts
automatisch für andere Projekte indexiert.

Voraussetzung ist die globale Binary (`./install-vps.sh --with-cbm`). Fehlt sie,
bricht der Lauf mit der Installationsanweisung ab, statt still weiterzumachen.
Der Nutzer muss `--with-cbm` in der Bestätigung (Schritt 2) ausdrücklich mit abnicken —
es kostet **1 MCP-Server und 8 Tools** in diesem Projekt.

## Voraussetzung (einmalig, global)

state-sync ist global verankert: Symlink `~/.claude/state-sync` → Repo-Engine + globale
SessionStart/Stop/PreCompact-Hooks in `~/.claude/settings.json`. Der Onboard-Preflight meldet,
falls das fehlt. Wiederherstellen:

```bash
ln -sfn "/root/projekte/Claude Code BestPractice/bestpractice-extras/scripts/state-sync" /root/.claude/state-sync
# + globale Hooks in ~/.claude/settings.json (siehe docs/WO-LAEUFT-WAS.md)
```

**Continuous-Learning-Destillierer aktivieren (einmalig, global, gilt für alle Projekte).**
Der `observe`-Hook erfasst Beobachtungen ab Profil `standard`, aber der LLM-Destillierer
(Hintergrund-Observer, der Beobachtungen → Instincts verdichtet) ist per Default **aus**
(`observer.enabled=false`). Ohne diesen Schalter sammeln sich nur Rohbeobachtungen, es
entstehen **nie** Instincts. Onboard-Preflight soll prüfen und – falls fehlend – anlegen:

```bash
CFG="${XDG_DATA_HOME:-$HOME/.local/share}/ecc-homunculus/config.json"
# Soll-Zustand: {"version":"2.1","observer":{"enabled":true,"run_interval_minutes":5,"min_observations_to_analyze":20}}
python3 -c "import json,os;p=os.path.expanduser('$CFG');print(json.load(open(p)).get('observer',{}).get('enabled'))" 2>/dev/null
```

Der Destillierer ruft danach alle 5 Min Haiku auf (laufende, geringe Kosten) und startet
lazy beim nächsten Tool-Aufruf je Projekt (ab `min_observations_to_analyze`). Instincts dann
via `/ecc:instinct-status` sichtbar, Cluster via `/ecc:evolve`.

## Ablauf

### Schritt 1 — Dry-Run (read-only)

```bash
node "/root/projekte/Claude Code BestPractice/bestpractice-extras/scripts/onboard/onboard.js" --project "<ZIELPROJEKT-ROOT>" [--with-cbm]
```

Zeigt Preflight (node, globale Engine/Hooks), erkannte **Altlasten** (Vendoring-Signatur →
Backup-Plan) und den **Slim-Scaffold-Plan**. Schreibt nichts. Mit `--with-cbm` wird
zusätzlich der CBM-Aktivierungsplan gezeigt (ebenfalls read-only).

### Schritt 2 — Einmal bestätigen (AskUserQuestion)

Dem User kompakt zeigen: was nach `.harness-backup/<stamp>/` verschoben wird (reversibel) und
was angelegt/gemergt wird. Genau **eine** Bestätigung.

### Schritt 3 — Apply (nach OK)

```bash
node "/root/projekte/Claude Code BestPractice/bestpractice-extras/scripts/onboard/onboard.js" --project "<ZIELPROJEKT-ROOT>" --apply [--with-cbm]
```

Führt aus: De-Cruft (move → Backup) → Slim-Scaffold (settings env-merge + state-sync-Hook-Strip,
`state/`, Sentinel, `.gitignore`) → `consumer-scaffold.js` → `harvest.js` (Auto-Kontext aus
README/git/TODO) → [CBM-Aktivierung bei `--with-cbm`] → initialer PRE-Sync (`WORKING-CONTEXT.md`)
→ **`onboard-verify.js`** (Abnahme). Idempotent: Re-Run mergt, überschreibt keine User-Inhalte.
CBM läuft bewusst **nach** dem De-Cruft — der kann die `.mcp.json` ins Backup verschieben.

### Schritt 4 — `PROJECT_RULES.md` + `CLAUDE.md` verfeinern (LLM)

Das Script legt beide aus Vorlagen an. Jetzt mit **echten, verifizierten** Werten füllen
(keine `[Platzhalter]`, kein `TODO`): Stack/Runtime/Befehle (build/test/lint) aus echtem Code,
Sensitive Areas per Grep auf Telltale-Imports (`stripe`, `jwt`, `bcrypt`, `migration`),
3–5 konkrete Projektregeln. Vorhandene Dateien nur mit Diff+OK ändern. Danach `onboard-verify`
erneut laufen lassen — die Platzhalter-Warnung (7b) muss verschwinden.

### Schritt 5 — Abnahme

```bash
node "/root/projekte/Claude Code BestPractice/bestpractice-extras/scripts/onboard/onboard-verify.js" --project "<ZIELPROJEKT-ROOT>"
```

**Fertig = alle Pflicht-Checks grün** (Exit 0). Berichten: was verschoben/angelegt wurde,
Audit-Score, offene Punkte, nächster Schritt (i.d.R. `/plan` → `/feature-dev`).
**Wirkung der globalen Hooks** greift erst in einer **frischen Session**.

## Sicherheitsregeln

1. **Nie ohne Bestätigung schreiben** (erst Dry-Run, dann ein OK).
2. **De-Cruft verschiebt** nach `.harness-backup/` — nie Hard-Delete; reversibel.
3. **Kein Vendoring**: kein `install-apply.js`, kein `.claude/rules/ecc` ins Projekt.
4. **Keine Platzhalter** in `PROJECT_RULES.md` — nur verifizierte Fakten aus echtem Code.
5. **ECC-Core unberührt**: nur Env-Vars (`ECC_HOOK_PROFILE`) + Schicht 2, nie das Plugin patchen.

## Verwandt

- `bestpractice-extras/scripts/onboard/onboard.js` — deterministischer Orchestrator
- `bestpractice-extras/scripts/onboard/onboard-verify.js` — maschinelle Abnahme-Suite
- `bestpractice-extras/scripts/state-sync/` — Engine (global verlinkt) + `selftest.js`
- `docs/WO-LAEUFT-WAS.md` — Landkarte (Single Source), state-sync global

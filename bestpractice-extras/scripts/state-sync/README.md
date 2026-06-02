# State-Sync-Adapter

Wrapper/Adapter des Hybrid-Harness: koppelt das vom Menschen gepflegte `state/`
(Quelle der Wahrheit) an ECCs Loop-Futter `WORKING-CONTEXT.md` — **ohne** den
ECC-Core zu berühren. Rein additiv, projekt-lokal via Hooks registriert.

## Datenfluss

```
state/{context,decisions,tasks,progress}.md   (Quelle der Wahrheit, Mensch)
   │  PRE  (SessionStart)
   ▼
<projekt-root>/WORKING-CONTEXT.md             (Loop liest/füllt SYNC-Zonen)
   │  POST (Stop / PreCompact)
   ▼  nur Delta
state/progress.md  +  state/tasks.md          (Erfolge / neue ToDos zurück)
```

- **PRE** (`pre`) generiert `WORKING-CONTEXT.md` aus `state/`. Die `STATE:*`-Blöcke
  werden bei jedem Lauf überschrieben (Spiegel der Wahrheit). Die Agenten-Eingabe-
  zonen (`SYNC:progress-inbox`, `SYNC:tasks-inbox`) bleiben **erhalten**.
- **POST** (`post`) liest **nur** die `SYNC:*`-Zonen, bildet das Delta gegen den
  letzten Snapshot und hängt neue Zeilen an `state/progress.md` bzw.
  `state/tasks.md` an. `WORKING-CONTEXT.md` wird dabei **nicht** verändert.

## Verwendung (manuell)

```bash
node state-sync.js pre  --project /pfad/zum/projekt   # state/* -> WORKING-CONTEXT.md
node state-sync.js post --project /pfad/zum/projekt   # WORKING-CONTEXT.md -> state/* (Delta)
```

Ohne `--project` wird `CLAUDE_PROJECT_DIR` bzw. das aktuelle Verzeichnis genutzt
(so ruft der Hook das Skript auf).

## Hook-Registrierung (projekt-lokal, additiv)

`/ecc-onboard` trägt dies in die **projekt-lokale** `.claude/settings.json` ein
(nicht in ECC). Schema = Standard-Claude-Code-Hooks:

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

## Sicherheits-Garantien

- **Marker** `<!-- STATE:<datei>:START/END -->` / `<!-- SYNC:<name>:START/END -->`
  → exakte Sektionsgrenzen, kein Clobbering von Mensch-Inhalt.
- **Snapshot** `state/.sync/last-working-context.md` (gitignored) → POST schreibt
  nur das Delta zurück; wiederholte POSTs ohne neuen Input sind No-ops (idempotent).
- **No-op-Guard**: kein `state/` → still beenden (fremde Projekte unberührt).
- **ECC-Guard**: Root mit Basename `ecc` wird übersprungen — nie
  `ecc/WORKING-CONTEXT.md` überschreiben.
- **Exit 0**: Hooks brechen die Session nie ab; Fehler gehen sichtbar auf stderr.

## Dateien

| Datei | Rolle |
|---|---|
| `lib.js` | Marker, atomares I/O, Zone-Extraktion, Delta-Diff, Root-Auflösung, Guards |
| `to-working-context.js` | PRE: `state/*` → `WORKING-CONTEXT.md` (+ Snapshot) |
| `from-working-context.js` | POST: `WORKING-CONTEXT.md` → Delta nach `state/*` |
| `state-sync.js` | CLI-Dispatcher (`pre`/`post`) für Hook + Hand |
| `selftest.js` | Roundtrip-Verifikation (`node selftest.js`, Exit 0 = grün) |

## Test

```bash
node selftest.js   # 7 Checks: Generierung, No-op, Delta-Sync, Idempotenz, PRE-Bewahrung, 2 Guards
```

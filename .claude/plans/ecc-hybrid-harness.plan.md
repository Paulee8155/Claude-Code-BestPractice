# Plan: ECC-Core + BestPractice-Wrapper (Hybrid-Harness)

> **Temporär** — nach vollständiger Umsetzung löschen.
> Erstellt: 2026-06-02 · Branch: `main` · Status: **bestätigt, Schritt 1 startbereit**

## Master-Ziel

Derselbe autonome ECC-Workflow wie beim ECC-Erfinder: Loop starten, zurücklehnen,
Agenten iterieren/testen/committen lassen. `bestpractice-extras/` wirkt nur als **Wrapper/Adapter**,
der ECC steuert — **ohne den ECC-Core je zu beschädigen**.

## Verifizierter Kernbefund (Prämisse korrigiert)

- `WORKING-CONTEXT.md` ist in ECC **kein** Code-erzwungener Loop-Zwang, sondern eine **Konvention**.
  `grep WORKING-CONTEXT` in allen Hooks/Skripten/Sources = **0 Treffer**. Vorkommen nur in Doku +
  ECCs eigener `ecc/WORKING-CONTEXT.md` (Selbstbeschreibung).
- Der „Loop" ist **agenten-getrieben**: Skills (`continuous-agent-loop`, `autonomous-loops`) +
  Slash-Commands (`/feature-dev`, `/loop`, `checkpoint`, `build-fix`). Kein Daemon.
- ECC-Hooks sind via Plugin (`ecc@ecc`) registriert (`ecc/.claude/hooks/hooks.json`):
  **SessionStart** → `session-start-bootstrap.js`, **Stop** → `session-end.js` (async),
  **PreCompact** → `pre-compact.js`. Diese Lifecycle-Punkte nutzen wir **additiv**.

## Tragendes Prinzip

`state/` (4 modulare Dateien, vom Menschen gepflegt) = **Quelle der Wahrheit**.
`WORKING-CONTEXT.md` (Projekt-Root) wird daraus **generiert** (Loop-Futter) und nach jedem Lauf
**zurückgeparst** (Erfolge → `progress.md`, neue ToDos → `tasks.md`).

```
state/{context,decisions,progress,tasks}.md
  │ PRE-Sync (SessionStart) ──► <root>/WORKING-CONTEXT.md  (ECC-Loop liest/aktualisiert)
  └ POST-Sync (Stop/PreCompact) ◄── Delta zurück (progress.md, tasks.md)
```

## Bestätigte Entscheidungen

1. **Sync-Wiring:** additiv, ECC-Core makellos. Skripte in `bestpractice-extras/scripts/state-sync/`,
   Hook-Registrierung additiv in projekt-lokaler `.claude/settings.json`. **Keine** ECC-Datei editieren.
2. **Scope:** pro Projekt via `/ecc-onboard` (isoliert). Karpathy-Regeln zusätzlich global.
3. **Ordnername:** `state/` (sichtbar) — bestehende Onboard-Konvention bleibt; Snapshot-Cache `state/.sync/` (gitignored).

---

## SCHRITT 1 — State-Sync-Adapter (DETAIL)

**Neue/geänderte Dateien:**

| # | Datei | Inhalt |
|---|---|---|
| 1 | `bestpractice-extras/scripts/state-sync/lib.js` | Marker-Konstanten, sicheres Read/Write, Snapshot-Diff, Root-Auflösung, No-op-Guard |
| 2 | `…/state-sync/to-working-context.js` | **PRE**: `state/*` → `<root>/WORKING-CONTEXT.md` (idempotent, Provenienz-Header, Marker) |
| 3 | `…/state-sync/from-working-context.js` | **POST**: `WORKING-CONTEXT.md` → Delta in `state/progress.md` + `state/tasks.md` |
| 4 | `…/state-sync/state-sync.js` | CLI: `state-sync.js <pre\|post> [--project <root>]` (Hook + manuell) |
| 5 | `…/state-sync/README.md` | Kurz-Doku |
| 6 | `bestpractice-extras/templates/state/{context,tasks,progress,decisions}.md` | Marker-Sektionen statt leerer Stubs |
| 7 | `.gitignore` | `state/.sync/` ergänzen |

**Schema-Mapping (`state/` ↔ `WORKING-CONTEXT.md`):**

| `state/`-Datei | WORKING-CONTEXT-Sektion | Richtung |
|---|---|---|
| `context.md` | `## Purpose` / `## Current Truth` | PRE (read-only) |
| `decisions.md` | `## Decisions` | PRE (read-only) |
| `tasks.md` | `## Active Queues` | PRE + POST (neue ToDos zurück) |
| `progress.md` | `## Latest Execution Notes` | POST (Erfolge zurück) |

**Sicherheits-Garantien:**
- `<!-- STATE:<datei>:START/END -->`-Marker → exakte Sektionsgrenzen, kein Clobbering.
- Snapshot `state/.sync/last-working-context.md` → nur Delta zurückgeschrieben, human-content bleibt.
- No-op-Guard: kein `state/` → still beenden (fremde Projekte unberührt).
- Ziel ist `<projekt-root>/WORKING-CONTEXT.md`, **niemals** `ecc/WORKING-CONTEXT.md`.

**Verifikation:** Test-`state/` in diesem Repo anlegen → `pre` generiert Root-`WORKING-CONTEXT.md` →
Update darin simulieren → `post` schreibt Erfolge/ToDos nachweislich verlustfrei zurück.

---

## SCHRITT 2 — Universelles Onboarding (`/ecc-onboard` erweitern)

- `state/`-Init aus neuen Templates. Neu = Grundgerüst; Bestehend = `context.md` aus README + `git log`,
  `tasks.md` aus Ist-Zustand/TODOs automatisch befüllen.
- Hook-Registrierung des State-Sync additiv in `<projekt>/.claude/settings.json` (Teil von Schritt 4 des Commands).
- Merge-statt-Überschreiben bleibt; Dry-Run + 1× OK bleibt.

## SCHRITT 3 — Karpathy + RPI-Advisor (sanfte Injektion)

- **Karpathy:** `bestpractice-extras/rules/karpathy-principles.md` soft global via **einer** `@`-Import-Zeile
  in `/root/.claude/CLAUDE.md`. Additiv, überschreibt keine ECC-Regel.
- **RPI-Advisor:** 8 Agenten aus `_archive/rpi-agents/` als Berater-Namespace installieren + Wrapper-Command
  `/mega-plan` (in `bestpractice-extras/commands/`): dispatcht relevante Advisor (CTO/PM/UX) **parallel** als
  Subagents → synthetisiert Briefing → übergibt an ECCs `/plan`/Loop. ECC-Dev-Agenten unangetastet.

## SCHRITT 4 — Mega-Doku

- `docs/MEGA-WORKFLOW.de.md`: Wo wird was gespeichert, RPI+ECC orchestrieren, neu vs. bestehend, Recovery.
- `docs/build_guide.py` um Kapitel „Hybrid-Mega-Workflow" erweitern → `.docx` + `.pptx` neu bauen.

## Risiken

- HIGH: Parser-Roundtrip-Clobbering → Marker + Snapshot-Diff.
- MED: ECC-Update → Wrapper getrennt, nichts überschrieben.
- MED: Hook-Performance → POST async + No-op-Guard.
- LOW: Namensdrift `.state`/`state` → auf `state/` konsolidiert.

## Akzeptanz

- [ ] Schritt 1: Sync-Roundtrip verlustfrei verifiziert
- [ ] Schritt 2: `/ecc-onboard` legt `state/` + Sync-Hooks an (neu & bestehend)
- [ ] Schritt 3: Karpathy global aktiv, `/mega-plan` dispatcht RPI-Advisor
- [ ] Schritt 4: `MEGA-WORKFLOW.de.md` + neu gebaute Office-Dateien
- [ ] ECC-Core unverändert (`git diff` zeigt keine Änderung unter `ecc/`)

<!-- GENERIERT vom State-Sync-Adapter (Hybrid-Harness). NICHT von Hand editieren
     ausserhalb der SYNC:*-Zonen. Quelle der Wahrheit: state/*.md.
     Bei jedem SessionStart neu erzeugt; STATE:*-Bloecke werden ueberschrieben. -->
# WORKING CONTEXT — Claude Code BestPractice

> Auto-generiert aus `state/`. STATE:*-Bloecke spiegeln die Quelle der Wahrheit
> (read-only fuer den Loop). Neue Erfolge/ToDos gehoeren in die SYNC:*-Zonen unten —
> der POST-Sync uebernimmt sie verlustfrei zurueck nach `state/`.

<!-- STATE:context:START -->
## Purpose & Current Truth

<!-- Quelle der Wahrheit fuer Zweck & aktuellen Stand. Vom Menschen gepflegt.
     Fliesst (read-only) in WORKING-CONTEXT.md -> "## Purpose & Current Truth". -->

### Purpose
VPS-weites Claude-Code-Harness (Zwei-Schichten): **ECC-Core** (Schicht 1, vendored unter `ecc/`,
unberuehrt) + **BestPractice-Extras** (Schicht 2, additive Wrapper). ECC fuehrt; eigene Tools
(RTK, state-sync, mgrep, /start, /mega-plan, /ecc-onboard) integrieren sich nahtlos statt zu ersetzen.

### Current Truth
- Schicht-2-Mechanik ist seit **2026-06-05 scharf in diesem Repo**: State-Sync projekt-lokal
  verdrahtet (Variante A); `WORKING-CONTEXT.md` wird beim Session-Start aus `state/` gespiegelt.
- ECC-Core unberuehrt (`git status -- ecc/` leer); RTK-Hook global intakt; ecc/-Schreibguard aktiv.
- Globale `ecc-onboard.md`-Drift behoben (6,3K -> 13K); rpi-Advisors + attribution-policy +
  dev/review-Contexts global deployed; `install-vps.sh` deployt das kuenftig automatisch.
- Engine: ECC (Everything Claude Code, @affaanmustafa), global nach `~/.claude` installiert.
<!-- STATE:context:END -->

<!-- STATE:decisions:START -->
## Decisions

<!-- Architektur-/Design-Entscheidungen (ADR-leicht). Format: - [JJJJ-MM-TT] Entscheidung — Begruendung -->

- [2026-06-05] State-Sync **Variante A (projekt-lokal)** statt global — ECC-konform (Schicht 2 = pro Projekt additiv), keine globale settings.json-Verschmutzung, kein No-op-Laerm in Nicht-ECC-Projekten.
- [2026-06-05] Globale ECC-Memory-Hooks (SessionStart/Stop/PreCompact) bleiben unangetastet — sie schreiben session-data/, NICHT WORKING-CONTEXT.md (separates System).
- [2026-06-05] Office-Snapshots (docx/pptx) werden aus der Markdown-Single-Source nachgezogen, nicht parallel gepflegt.
<!-- STATE:decisions:END -->

<!-- STATE:tasks:START -->
## Active Queues

<!-- Aktive Aufgaben-Queue. Mensch + Loop. PRE spiegelt nach "## Active Queues". -->

### Now
- [ ] An einem REALEN Projekt testen: `/ecc-onboard` laufen lassen und pruefen, dass state/ + WORKING-CONTEXT.md + lokale State-Sync-Hooks entstehen.

### Next
- [ ] Weitere Projekte (WMS, Jarvis, Werkstatt) ECC-ready machen via `/ecc-onboard`.
- [ ] Optional: docx/pptx vollstaendig aus der Markdown-Single-Source regenerieren (Generator-Script existiert noch nicht).
- [ ] Optional: Variante B (globaler State-Sync) erwaegen, falls WORKING-CONTEXT auch in nicht-onboardeten Projekten gewuenscht.

### Done
- [x] [2026-06-05] Schicht-2 in diesem Repo scharf geschaltet (State-Sync aktiv, ecc-onboard-Drift behoben, Extras+Contexts deployed, Guides aktualisiert).
<!-- STATE:tasks:END -->

<!-- STATE:progress:START -->
## Progress So Far

<!-- Verlauf erledigter Arbeit (append-only). -->

- [2026-06-05] Diagnose der 4 ECC-Probleme (WORKING-CONTEXT / Onboarding / Stack / RTK+Extras) mit Datei:Zeile-Belegen.
- [2026-06-05] Schritt 0: globale ecc-onboard.md auf 13K-Version aktualisiert (Drift behoben).
- [2026-06-05] Schritt 2: install-vps.sh additiv erweitert (rpi-Advisors, attribution-policy, start.md mit -ef-Guard, contexts/).
- [2026-06-05] Schritt 3: rpi-Advisors + attribution-policy.md global deployed (agents 63 -> 67).
- [2026-06-05] Schritt 4: contexts/{dev,review}.md angelegt + global deployed.
- [2026-06-05] Schritt 5: Repo onboardet — state/ aus Templates, harvest, State-Sync-Hooks projekt-lokal gemergt, PRE-Sync -> WORKING-CONTEXT.md.
- [2026-06-05] Schritt 7: Guides aktualisiert (ECC-ERKLAERBUCH Abschnitt 15, CLAUDE.md Hooks-Liste).
- [2026-06-05] Verifikation: state-sync selftest 10/10 gruen; ecc/ unberuehrt; RTK intakt.
<!-- STATE:progress:END -->

---
<!-- SYNC-Append-Zonen: der Loop/Agent schreibt hier; POST parst sie zurueck. -->

## Latest Execution Notes

<!-- SYNC:progress-inbox:START -->
<!-- Agent/Loop: neue Erfolge hier eintragen (POST-Sync uebernimmt sie nach state/progress.md). -->
<!-- SYNC:progress-inbox:END -->

## New Tasks Discovered

<!-- SYNC:tasks-inbox:START -->
<!-- Agent/Loop: neu entdeckte ToDos hier eintragen (POST-Sync uebernimmt sie nach state/tasks.md). -->
<!-- SYNC:tasks-inbox:END -->

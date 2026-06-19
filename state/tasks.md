# tasks

<!-- Aktive Aufgaben-Queue. Mensch + Loop. PRE spiegelt nach "## Active Queues". -->

### Now
<!-- HARVEST:now:START -->
- FIXME: Leitet aus Projekt-Signalen (README, git log, TODO/FIXME, sensitive Imports)  (`bestpractice-extras/scripts/context-harvest/harvest-lib.js:6`)
- FIXME: Markdown-Zeilen fuer state/tasks.md -> ### Now (aus TODO/FIXME). */  (`bestpractice-extras/scripts/context-harvest/harvest-lib.js:58`)
- TODO: out.push(`- ${h.kind || 'TODO'}: ${truncate(h.text, 120)} (\`${h.file}:${h.line}\`)`);  (`bestpractice-extras/scripts/context-harvest/harvest-lib.js:62`)
- FIXME: if (!out.length) out.push('- _(keine offenen TODO/FIXME gefunden)_');  (`bestpractice-extras/scripts/context-harvest/harvest-lib.js:64`)
- FIXME: Liest Projekt-Signale (README, git log -20, TODO/FIXME, sensitive Imports) und  (`bestpractice-extras/scripts/context-harvest/harvest.js:9`)
- FIXME: const raw = git(root, ['grep', '-nE', 'TODO|FIXME', '--', ...SOURCE_GLOBS]);  (`bestpractice-extras/scripts/context-harvest/harvest.js:63`)
- FIXME: const kind = /FIXME/.test(m[3]) ? 'FIXME' : 'TODO';  (`bestpractice-extras/scripts/context-harvest/harvest.js:67`)
<!-- HARVEST:now:END -->
- [ ] An einem REALEN Projekt testen: `/ecc-onboard` laufen lassen und pruefen, dass state/ + WORKING-CONTEXT.md + lokale State-Sync-Hooks entstehen.

### Next
- [ ] Weitere Projekte (WMS, Jarvis, Werkstatt) ECC-ready machen via `/ecc-onboard`.
- [ ] Optional: docx/pptx vollstaendig aus der Markdown-Single-Source regenerieren (Generator-Script existiert noch nicht).
- [ ] Optional: Variante B (globaler State-Sync) erwaegen, falls WORKING-CONTEXT auch in nicht-onboardeten Projekten gewuenscht.

### Done
- [x] [2026-06-05] Schicht-2 in diesem Repo scharf geschaltet (State-Sync aktiv, ecc-onboard-Drift behoben, Extras+Contexts deployed, Guides aktualisiert).

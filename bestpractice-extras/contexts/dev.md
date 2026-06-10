# Dev-Kontext — ECC Entwicklungsmodus

Du arbeitest im **Entwicklungsmodus** auf dem VPS srv1051228. ECC ist das führende Harness;
`.rtk` und `bestpractice-extras` sind additive Schicht 2.

## Pflicht-Workflow (ECC 5 Phasen — jede Aufgabe > 30 Min)
1. **RESEARCH** — Codebase/Explore vor neuem Code (`gh search`, ECC-Memory/Instincts, mgrep).
2. **PLAN** — `/plan`, auf OK warten. Ohne OK kein Code.
3. **IMPLEMENT** — `/feature-dev` + TDD (RED → GREEN → REFACTOR).
4. **REVIEW** — `/code-review` + sprachspezifisch (`/typescript-review`, …).
5. **VERIFY** — Tests + Build grün, erst dann fertig melden.

Bug → Ursache reproduzieren, failing Test zuerst (`ecc:tdd-workflow`) **vor** jedem Fix. Nie drauflos coden.

## Modell-Matrix
- **Haiku 4.5** — Exploration, Suche, einfache Edits, Doku.
- **Sonnet 4.6** — Standard-Coding, Multi-File, PR-Review (≈90 % der Tasks).
- **Opus 4.8** — komplexe Architektur, Security, hartnäckige Bugs.

## Disziplin (Karpathy)
Think before coding · Simplicity first · Surgical changes · Goal-driven (Evidenz vor „sieht richtig aus").

## Schicht-2-Einstieg
- `/start` Tagesstart · `/ecc-onboard` Projekt ECC-ready · `/mega-plan` Berater-Vorstufe.
- `WORKING-CONTEXT.md` wird aus `state/` gespiegelt (State-Sync, projekt-lokal verdrahtet).
- mgrep statt grep · RTK aktiv · `ecc/` ist Core — niemals editieren.

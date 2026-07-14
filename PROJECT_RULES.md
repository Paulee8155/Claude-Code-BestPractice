# PROJECT_RULES — Claude Code BestPractice

> Projektspezifische Fakten. Arbeitsvertrag/Workflow stehen in `CLAUDE.md`.
> Landkarte (Single Source): `docs/WO-LAEUFT-WAS.md`.

## Identität

- Name: Claude Code BestPractice
- Typ: Harness/Doku-Repo (Schicht-2-Wrapper um den globalen ECC-Core `ecc@ecc`)
- Primärsprache: Node.js (Schicht-2-Scripts, CommonJS) + Markdown-Doku
- Status: aktiv (führendes Harness des VPS-Setups)

## Stack

- Node ≥ 18, keine externen Laufzeit-Abhängigkeiten in den Scripts.
- Doku-Build: Python (`python-docx`, `python-pptx`) via `bestpractice-extras/scripts/build-docs/build.py`.
- Kein Webdienst (kein Deploy) — reines Harness-/Doku-Repo.

## Architektur (zwei Schichten)

- Schicht 1 — ECC-Core: globales Plugin unter `~/.claude/plugins/cache/ecc/ecc/2.0.0`. Nicht vendoren, nicht patchen.
- Schicht 2 — `bestpractice-extras/`: eigene agents/commands/rules/templates + `scripts/` (state-sync, onboard, mgrep, build-docs).

## Kernkomponenten

- `scripts/state-sync/` — Engine `state/` ⇄ `WORKING-CONTEXT.md`; **global** verlinkt nach `~/.claude/state-sync/`. Tests: `selftest.js`.
- `scripts/onboard/onboard.js` + `onboard-verify.js` — schlankes, idempotentes Onboarding + maschinelle Abnahme.
- `scripts/onboard/consumer-scaffold.js`, `scripts/context-harvest/harvest.js` — Konformitäts-Artefakte + Auto-Kontext.

## Sensitive Areas

- Secrets nie ins Repo: `MXBAI_API_KEY` u. a. leben user-scoped in `~/.claude/settings.json`.
- `~/.claude/settings.json` ist global (alle Projekte) — Änderungen dort mit Bedacht (rtk-Hook + globaler state-sync nicht brechen).

## Arbeitsregeln

- ECC-Core unberührt: Verhalten nur über Env-Vars (`ECC_HOOK_PROFILE`) + Schicht 2 ändern.
- state-sync-Engine ist Single Source hier; `~/.claude/state-sync/` ist nur der Symlink.
- Nach Inhaltsänderung an `docs/ECC-Harness-Guide.de.md` immer `build-docs/build.py` laufen lassen (docx/pptx nie von Hand editieren).
- Onboarding-/Engine-Änderungen: `selftest.js` + `onboard-verify.js` müssen grün bleiben.

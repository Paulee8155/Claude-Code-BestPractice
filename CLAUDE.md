# Claude Code BestPractice — Projektkontext

Zwei-Schichten-Harness: **ECC-Core (Schicht 1)** + **BestPractice-Extras (Schicht 2)**.

## Architektur

| Schicht | Pfad | Regel |
|---|---|---|
| **1 — ECC-Core** | `ecc/` (vendored, als Plugin `ecc@ecc` registriert) | **Unberührt lassen.** Nicht von Hand editieren — additiv erweitern, nicht patchen. |
| **2 — Extras** | `bestpractice-extras/` | Eigene agents/commands/rules/templates + `state-sync/`. Additive Wrapper um den Core. |
| Doku | `docs/` | ECC-Erklärbuch, Harness-Guide, Mega-Workflow, Audit-Reports. |

## Arbeitsweise

- **ECC-Workflow einhalten:** RESEARCH → PLAN (`/plan`, wartet auf OK) → IMPLEMENT (TDD) → REVIEW (`/code-review`) → VERIFY.
- **Core unberührt:** Änderungen am ECC-Verhalten laufen über Schicht 2, nie durch Edits in `ecc/`.
- **Audit:** `node ~/.claude/plugins/cache/ecc/ecc/2.0.0-rc.1/scripts/harness-audit.js` → Repo-Integrität.
- **Modell:** Opus 4.8 (1M) Standard; `/model-route` vor mehrdeutigen/architektonischen Aufgaben.

## Hooks (verifiziert aktiv über Plugin)

- `post:quality-gate` (PostToolUse) — aktiv, nicht in `ECC_DISABLED_HOOKS`.
- `stop:format-typecheck`, `stop:session-end` — aktiv über Plugin (globales `Stop: []` unterdrückt sie nicht).
- Deaktiviert (bewusst): `pre:bash:gateguard-fact-force`, `pre:edit-write:gateguard-fact-force`.

## Schicht-2-Befehle

- `/ecc-onboard` — Projekt ECC-ready machen (Stack-Detection + state-sync).
- `/mega-plan` — RPI-Berater (CTO/PM/UX/Intake) parallel → Briefing → ECCs `/plan`.

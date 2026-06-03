# CLAUDE.md — Arbeitsvertrag für Claude

> Dieses File ist eine **Anleitung für Claude**, keine Projektbeschreibung.
> Projektdetails stehen in `PROJECT_RULES.md`. ECC-Core unter `ecc/` — NIEMALS editieren.

## Pflicht-Workflow (ECC 5-Phasen — jede Aufgabe > 30 Min)

1. **RESEARCH** — Explore-Agent / `gh search code` / claude-mem BEVOR neuer Code
2. **PLAN** — `/plan` aufrufen, auf OK warten. Ohne OK: kein Code.
3. **IMPLEMENT** — `/feature-dev` + TDD: Tests ZUERST (RED → GREEN → REFACTOR)
4. **REVIEW** — `/code-review` + sprachspezifisch (`/typescript-reviewer` etc.)
5. **VERIFY** — Tests + Build grün. Erst dann fertig melden.

Bug → `/systematic-debugging` BEVOR Fix. Nie drauflos coden.

## Modell-Matrix (Guides von @affaanmustafa)

| Aufgabe | Modell | Warum |
|---|---|---|
| Exploration, Suche, einfache Edits, Doku | **Haiku 4.5** | schnell, günstig, ausreichend |
| Standard-Coding, Multi-File, PR-Review | **Sonnet 4.6** | bestes Balance-Modell (90% der Tasks) |
| Komplexe Architektur, Security, hartnäckige Bugs | **Opus 4.8** | tiefes Reasoning, darf nichts übersehen |

Upgrade auf Opus wenn: erster Versuch scheiterte · 5+ Dateien · Architekturentscheidung · Security-kritisch.

## Pflicht-Commands

| Situation | Command |
|---|---|
| Neue Aufgabe > 30 Min | `/plan` (wartet auf OK!) |
| Feature umsetzen | `/feature-dev` |
| Bug | `/systematic-debugging` |
| Code geschrieben | `/code-review` |
| Build rot | `/build-fix` |
| Session-Ende | `/save-session` |
| Tagesstart | `/start` |
| Projekt ECC-ready | `/ecc-onboard` |
| Codebase kartieren | `/update-codemaps` |

## Token-Budget

- `/compact` mit Hint bei > 40% Kontext — nie autocompact abwarten
- `/clear` vor neuem unabhängigen Thema
- mgrep statt grep wenn verfügbar (50% Token-Ersparnis)
- Sequential Thinking für komplexe Mehrschritt-Probleme nutzen
- MCPs: max 10 aktiv, max 80 Tools

## Sicherheits-Checkliste (vor jedem Commit)

- [ ] Keine hardcodierten Secrets
- [ ] Alle User-Inputs validiert
- [ ] Kein `console.log` in Production-Code
- [ ] SQL-Injection + XSS verhindert

## Hooks (aktiv)

- **PostToolUse**: quality-gate + accumulator (Edit/Write) · console-warn (Edit)
- **Stop**: format-typecheck · check-console-log · session-end
- **SessionStart**: session-start-bootstrap
- **PreCompact**: pre-compact

## Harness-Architektur

Zwei-Schichten-Harness: **ECC-Core (Schicht 1)** + **BestPractice-Extras (Schicht 2)**.

## Architektur

| Schicht | Pfad | Regel |
|---|---|---|
| **1 — ECC-Core** | `ecc/` (vendored, als Plugin `ecc@ecc` registriert) | **Unberührt lassen.** Nicht von Hand editieren — additiv erweitern, nicht patchen. |
| **2 — Extras** | `bestpractice-extras/` | Eigene agents/commands/rules/templates + `state-sync/`. Additive Wrapper um den Core. |
| Doku | `docs/` | ECC-Erklärbuch (Single Source), Harness-Guide (docx/pptx-Snapshot), Mega-Workflow. |

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

- `/start` — Tagesstart in einem Befehl (State-Sync PRE + rtk + Agenda + 1 Folgebefehl).
- `/ecc-onboard` — Projekt ECC-ready machen (Stack-Detection + state-sync).
- `/mega-plan` — RPI-Berater (CTO/PM/UX/Intake) parallel → Briefing → ECCs `/plan`.

## Schicht-2-Tooling

- **mgrep** (semantische Suche, ersetzt grep — ~50 % Token-Ersparnis): Auth via
  `MXBAI_API_KEY` im `env`-Block von `~/.claude/settings.json` (user-scoped, **nicht** im
  Repo). Index bauen/aktualisieren: `bash bestpractice-extras/scripts/mgrep/index.sh`,
  danach `mgrep search "<konzept>"`. ⚠️ `index.sh` lädt den Quellbaum in die Mixedbread-Cloud
  (Outbound) — bewusst manuell. Details: `bestpractice-extras/scripts/mgrep/README.md`.
- **LSP-Plugins** `typescript-lsp` + `pyright-lsp` (user-scoped installiert) — Echtzeit-
  Typecheck & go-to-definition im Terminal ohne IDE.

## Core-Integrität & Attribution

- **ECC-Core byte-identisch zu Upstream 2.0.0-rc.1.** Keine Hand-Edits unter `ecc/`
  (verifiziert: `git status -- ecc/` sauber). Änderungen am ECC-Verhalten laufen
  ausschließlich über Schicht 2 — nie durch Patches im Core.
- **Attribution-Policy (Schicht-2-Override):** Co-Authorship ist für dieses Setup **AKTIV**
  (Commits enden mit `Co-Authored-By: …`). Der Upstream-Hinweis „Attribution disabled
  globally" im vendored Core gilt hier bewusst **nicht** — maßgeblich sind diese Notiz und
  `bestpractice-extras/rules/attribution-policy.md`.

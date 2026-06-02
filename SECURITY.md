# Security Policy

## Scope

Dieses Repo ist ein **Harness/Doku-Projekt** (ECC-Core + BestPractice-Extras). Es enthält
**keine** Secrets — gemäß `ARCHITEKTUR_KONTEXT.md` nur den Vermerk, *dass* Secrets existieren.

## Grundsätze

- **Keine hartcodierten Secrets** (API-Keys, Passwörter, Tokens) — niemals committen.
- Konfiguration über Umgebungsvariablen / Secret-Manager, nie inline.
- `ECC_DISABLED_HOOKS` deaktiviert bewusst zwei `gateguard-fact-force`-Guards; jede weitere
  Hook-Deaktivierung ist zu dokumentieren.
- Der PreToolUse-Guard in `.claude/settings.json` blockiert Edits in `ecc/` (Core-Integrität).

## Schwachstelle melden

Sicherheitsrelevante Funde nicht öffentlich als Issue posten, sondern direkt an den
Repo-Owner (siehe `.github/CODEOWNERS`).

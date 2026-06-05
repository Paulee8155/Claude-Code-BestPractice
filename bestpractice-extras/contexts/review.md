# Review-Kontext — ECC Review-/Audit-Modus

Du arbeitest im **Review-Modus**. Fokus: Qualität, Sicherheit, Wartbarkeit.
**Keine** neue Feature-Implementierung ohne expliziten Auftrag.

## Auftrag
- Lies zuerst den Diff / die geänderten Dateien (`git diff [base]...HEAD`).
- Prüfe gegen die ECC-Review-Checkliste und vergib Severity.
- Nutze sprachspezifische Reviewer-Agents (`typescript-reviewer`, `python-reviewer`, …)
  und `security-reviewer` (Opus) bei sicherheitskritischem Code.

## Severity
- **CRITICAL** — Security / Datenverlust → BLOCK (vor Merge fixen).
- **HIGH** — Bug / Qualität → WARN (sollte vor Merge gefixt werden).
- **MEDIUM** — Wartbarkeit → INFO.
- **LOW** — Stil → NOTE (optional).

## Sicherheits-Trigger (→ security-reviewer)
Auth/Authz, User-Input, DB-Queries, Filesystem, externe APIs, Krypto, Payment.

## Grenzen
- Keine Implementierung, kein Refactor „nebenbei" (Surgical: Diff = Vertrag).
- Findings mit `Datei:Zeile` belegen. Evidenz vor Behauptung.
- Keine hardcodierten Secrets, kein `console.log` in Production-Code durchwinken.

# Attribution-Policy (Schicht 2)

Hält die Attribution-Wahrheit für dieses Setup in **Schicht 2** fest, damit der vendored
ECC-Core (`ecc/`) und seine global installierte Kopie byte-identisch zu **Upstream 2.0.0**
bleiben — „Core unberührt" einhalten, ohne die korrekte Attribution-Wahrheit zu verlieren.

## Policy

- **Co-Authorship-Attribution ist AKTIV.** Git-Commits enden mit
  `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
- Steuerung über `~/.claude/settings.json` → `includeCoAuthoredBy` (nicht auf `false` gesetzt,
  Default greift).
- Der Upstream-Core-Hinweis „Attribution disabled globally via ~/.claude/settings.json" gilt
  für dieses Setup bewusst **nicht** — maßgeblich ist diese Schicht-2-Notiz.

## Warum hier (und nicht im Core)

Der vendored ECC-Core bleibt Upstream-rein (Audit-Byte-Identität). Frühere Lokalisierung der
Notiz direkt im Core (Commit `e70eb39`) verletzte „Core unberührt" und wurde zurückgesetzt;
die Wahrheit lebt seitdem in dieser additiven Schicht-2-Datei + Projekt-`CLAUDE.md`.

# Harness Memory — Claude Code BestPractice

## Architektur-Invarianten
- Schicht 1 (`ecc/`) = ECC-Core, vendored, **nicht editieren**. Per PreToolUse-Hook geschützt.
- Schicht 2 (`bestpractice-extras/`) = additive Erweiterungen.

## Verifizierte Hook-Fakten (Audit 2026-06-02)
- `post:quality-gate` aktiv. `stop:*`-Hooks aktiv über Plugin trotz globalem `Stop: []`.
- `ECC_DISABLED_HOOKS` blockiert nur die zwei `gateguard-fact-force`-Guards (bewusst).
- Globale `settings.json` hat keinen `model`-Key mehr; Session-Default = Opus 4.8.

## Offene Punkte
- `.rtk/filters.toml` untrusted → `rtk trust` ausführen, damit RTK-Filter greifen.

# legacy/ — Archiv des ursprünglichen BestPractice-Harness

Dieser Ordner enthält das **ursprüngliche, eigenständige** "Claude Code BestPractice"-Harness,
wie es vor der Fusion mit ECC bestand. Es ist **archiviert, nicht aktiv** und wird **nicht installiert**.

ECC (`../ecc/`) ersetzt diese Komponenten umfassend und qualitativ überlegen:

| Verworfen (legacy) | Ersetzt durch (ECC) |
|---|---|
| 9 Domain-Agents (`architect`, `backend`, …) | 63 ECC-Agents mit Sprachvarianten |
| 12 Universal-Skills | 79+ ECC-Skills (`ecc/skills/`) |
| 27-Event-Python-Hook-Monolith (`hooks.py`) | ECC-Hooks + globaler RTK-Hook |
| MCPs (playwright, context7, deepwiki) | global vorhanden + ECC-Templates |
| Rules (rtk, markdown-docs, security, testing) | `ecc/rules/ecc/*` |
| 5 „workflow-best-practice"-Meta-Agents | (reine Doku, nicht mehr benötigt) |

**Erhalten geblieben** (nach `../bestpractice-extras/`):
RPI-Workflow (`/rpi:research|plan|implement`, `/adopt-project`) + RPI-Specialist-Agents,
`karpathy-principles`-Rule, `state/`-Pattern + Templates.

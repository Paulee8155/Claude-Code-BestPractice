# Evals

Automatisierte Akzeptanz-Checks für die BestPractice-Extras (Schicht 2).

| Eval | Quelle | Prüft |
|---|---|---|
| `state-sync-roundtrip` | `bestpractice-extras/scripts/state-sync/selftest.js` | Verlustfreier PRE/POST-Roundtrip, Idempotenz, Guards |
| `harness-score` | `run.sh` | Harness-Audit-Score bleibt ≥ Schwelle (Regression-Schutz) |

## Ausführen

```bash
bash evals/run.sh
```

Exit 0 = alle grün. Wird in `.github/workflows/ci.yml` aufgerufen.

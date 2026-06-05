# context

<!-- Quelle der Wahrheit fuer Zweck & aktuellen Stand. Vom Menschen gepflegt.
     Fliesst (read-only) in WORKING-CONTEXT.md -> "## Purpose & Current Truth". -->

### Purpose
VPS-weites Claude-Code-Harness (Zwei-Schichten): **ECC-Core** (Schicht 1, vendored unter `ecc/`,
unberuehrt) + **BestPractice-Extras** (Schicht 2, additive Wrapper). ECC fuehrt; eigene Tools
(RTK, state-sync, mgrep, /start, /mega-plan, /ecc-onboard) integrieren sich nahtlos statt zu ersetzen.

### Current Truth
- Schicht-2-Mechanik ist seit **2026-06-05 scharf in diesem Repo**: State-Sync projekt-lokal
  verdrahtet (Variante A); `WORKING-CONTEXT.md` wird beim Session-Start aus `state/` gespiegelt.
- ECC-Core unberuehrt (`git status -- ecc/` leer); RTK-Hook global intakt; ecc/-Schreibguard aktiv.
- Globale `ecc-onboard.md`-Drift behoben (6,3K -> 13K); rpi-Advisors + attribution-policy +
  dev/review-Contexts global deployed; `install-vps.sh` deployt das kuenftig automatisch.
- Engine: ECC (Everything Claude Code, @affaanmustafa), global nach `~/.claude` installiert.

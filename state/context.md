# context

<!-- Quelle der Wahrheit fuer Zweck & aktuellen Stand. Vom Menschen gepflegt.
     Fliesst (read-only) in WORKING-CONTEXT.md -> "## Purpose & Current Truth". -->

### Purpose
VPS-weites Claude-Code-Harness (Zwei-Schichten): **ECC-Core** (Schicht 1, vendored unter `ecc/`,
unberuehrt) + **BestPractice-Extras** (Schicht 2, additive Wrapper). ECC fuehrt; eigene Tools
(RTK, state-sync, mgrep, /start, /mega-plan, /ecc-onboard) integrieren sich nahtlos statt zu ersetzen.

### Current Truth
<!-- HARVEST:current-truth:START -->
- > **Mein VPS-weites Claude-Code-Harness.** Engine ist **ECC** (Everything Claude Code, > von [@affaanmustafa](https://x.com/affaanmustafa)); ergänzt um die wenigen einzigartigen > Stärken meines früheren BestPractice-Harness. Global installiert nach `~/.claude`, aktiv in > **all…
- Jüngste Commits (Ist-Stand):
  - ce4dc0a fix(onboard): /ecc-onboard auf Plugin-Pfad — vendored ecc/-Referenzen entfernt
  - 8293011 feat(harness): Plugin-only-Migration — ECC-Duplikate entfernt, claude-mem/superpowers abgelöst
  - d99f3d0 feat(harness): ECC-Core entvendoren — globales Plugin via gepinnter GitHub-Quelle
  - 0aa6d8e docs(harness): reproduzierbarer Doku-Build + Hook-Scope-Doku synchronisiert
  - 7674181 feat(harness): Schicht-2 scharf — State-Sync aktiv, ecc-onboard-Drift behoben, Extras deployed
  - cc9b64e feat(harness): mgrep verankert, LSP dokumentiert, Doku aktualisiert
  - 7513e39 feat(onboard): consumer-scaffold + ecc-onboard Schritt 4c
  - 986da6a feat(harness): Guides-Alignment — Hooks aktiv, Modell-Matrix, onboard-Fix
<!-- HARVEST:current-truth:END -->
- Schicht-2-Mechanik ist seit **2026-06-05 scharf in diesem Repo**: State-Sync projekt-lokal
  verdrahtet (Variante A); `WORKING-CONTEXT.md` wird beim Session-Start aus `state/` gespiegelt.
- ECC-Core unberuehrt (`git status -- ecc/` leer); RTK-Hook global intakt; ecc/-Schreibguard aktiv.
- Globale `ecc-onboard.md`-Drift behoben (6,3K -> 13K); rpi-Advisors + attribution-policy +
  dev/review-Contexts global deployed; `install-vps.sh` deployt das kuenftig automatisch.
- Engine: ECC (Everything Claude Code, @affaanmustafa), global nach `~/.claude` installiert.

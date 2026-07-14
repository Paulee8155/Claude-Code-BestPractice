# Claude Code BestPractice — fusioniert mit ECC

> **Mein VPS-weites Claude-Code-Harness.** Engine ist **ECC** (Everything Claude Code,
> von [@affaanmustafa](https://x.com/affaanmustafa)); ergänzt um die wenigen einzigartigen
> Stärken meines früheren BestPractice-Harness. Global installiert nach `~/.claude`, aktiv in
> **allen** Projekten auf der VPS — RTK-sicher, namespace-sauber, ohne Konflikte.

## 📖 Begleit-Dokument (immer offen neben dem Code)

- **`docs/ECC-Harness-Guide.de.docx`** — ausführliches Nachschlagewerk (Word)
- **`docs/ECC-Harness-Guide.de.pptx`** — Onboarding-Deck (PowerPoint)

Beide erklären auf Deutsch: wann welcher Command, welches Modell, welcher MCP, der 5-Phasen-Workflow,
Codemaps, Memory & Persistenz, Security. Neu generierbar mit `python3 docs/build_guide.py`.

## 🚀 Installation / Re-Install (VPS-weit)

```bash
./install-vps.sh                 # ECC (core) global nach ~/.claude + BestPractice-Extras
./install-vps.sh --dry-run       # nur Plan anzeigen, nichts schreiben
./install-vps.sh --profile full  # größeres ECC-Profil
./install-vps.sh --harden        # zusätzlich deny-Sicherheitsbasis (opt-in, mit Backup)
./install-vps.sh --with-cbm      # zusätzlich Codebase Memory global installieren (opt-in)
```

Das Skript ist idempotent. Es installiert ECC namespace-sicher (`rules/ecc/`, `skills/ecc/`,
`agents/`, `commands/`), layert /ecc-onboard + die Karpathy-Rule und lässt **RTK-Hook und
`settings.json` unangetastet**. ECC-Hooks bleiben **inaktiv** (Security-First).

## 🧠 Codebase Memory (optional)

Code-Intelligence-Graph (Symbole, Aufrufketten, Routen, Blast Radius) — gepinnt auf
**v0.9.0**, headless (keine UI).

**Binary global, MCP-Server projektlokal.** Die Binary wird einmal VPS-weit installiert;
aktiviert wird der Server nur in Projekten, die ihn ausdrücklich anfordern — jeder aktive
MCP-Server kostet sonst in *jeder* Session Budget (hier: 1 Server + 8 Tools).

```bash
./install-vps.sh --with-cbm     # einmalig: Binary + /cbm + Skill
/cbm enable                     # pro Projekt (Dry-Run → OK → Session neu starten)
/cbm status · doctor · reindex · disable
```

Bewusst **nicht** benutzt: der Upstream-Auto-Installer (er schreibt ungefragt Agent-Configs
**und einen PreToolUse-Hook auf Grep/Glob**), `curl | bash`, `latest`-Downloads, die
UI-Variante (Port 9749), Auto-Indexing und Hintergrund-Watcher.

Details, Sicherheitsgrenzen, Update- und Rollback-Verfahren:
[`bestpractice-extras/scripts/cbm/README.md`](bestpractice-extras/scripts/cbm/README.md)

## 🗂 Repo-Struktur

```
.
├── ecc/                   # Vendored ECC — die Engine (63 Agents, 249 Skills, ~80 Commands, manifest-Installer)
├── bestpractice-extras/   # Kuratierte BestPractice-Stärken (kollisionsfrei, ECC-ergänzend)
│   ├── commands/          #   /ecc-onboard (One-Shot-Projekt-Setup)
│   ├── rules/             #   karpathy-principles.md
│   ├── templates/         #   PROJECT_RULES, project-profile, tech-stack, state/-Vorlagen
│   └── _archive/          #   archiviert (inaktiv): RPI-Commands/-Agents, /adopt-project
├── install-vps.sh         # RTK-sicherer Rollout-Orchestrator (opt-in --harden)
├── docs/                  # Word- + PowerPoint-Guide + Generator (build_guide.py)
└── legacy/                # Archiv des ursprünglichen BestPractice-Harness (NICHT installiert)
```

## 🔀 Was die Fusion behält vs. verwirft

**Behalten** (einzigartig, ergänzt ECC):

- **/ecc-onboard** — One-Shot-Projekt-Setup: Stack-Detection → Dry-Run → Install + PROJECT_RULES.md + state/
- **`state/`-Pattern** + Templates (menschenlesbare Projekt-Persistenz)
- **Karpathy-Principles** (always-on Disziplin-Rule)

**Archiviert** (unter `bestpractice-extras/_archive/`, NICHT installiert — ECC deckt es ab):

- RPI-Workflow (`/rpi:*`) + 8 RPI-Specialist-Agents, `/adopt-project` → ersetzt durch ECCs 5-Phasen-Workflow + /ecc-onboard

**Verworfen** (ECC ist überlegen, siehe `legacy/README.md`):

- 9 Domain-Agents → ECCs 63 Agents · 12 Skills → ECCs 249 · Python-Hook-Monolith → ECC-Hooks + RTK
- BP-MCPs (global bereits vorhanden) · BP-Rules (von `ecc/rules/ecc/*` abgedeckt)

## 🛡 Sicherheit & Koexistenz

- **RTK** (PreToolUse:Bash, 60–90 % Token-Ersparnis): unangetastet, koexistiert.
- **superpowers / claude-mem / context-mode / Plugins**: laufen weiter; bei Command-Doppelung Quelle prüfen.
- ECC namespace-sicher → keine Kollision mit eigenen Skills/Rules.
- ECC-Hooks & AgentShield bewusst **opt-in** — nie blind aktiviert.

## 📚 Original-Guides (Quelle)

- Shortform: <https://x.com/affaanmustafa/status/2012378465664745795>
- Longform: <https://x.com/affaanmustafa/status/2014040193557471352>
- Security: <https://x.com/affaanmustafa/status/2033263813387223421>

Lokal im Repo unter `ecc/the-shortform-guide.md`, `ecc/the-longform-guide.md`,
`ecc/the-security-guide.md` sowie `ecc/ECC-WORKFLOW-GUIDE.de.md`.

## 🩺 Wartung

```bash
cd ecc
node scripts/ecc.js doctor          # Health-Check (claude-home: OK)
node scripts/ecc.js list-installed   # was ist installiert
npx ecc consult "security reviews"  # Komponenten-Advisor
```

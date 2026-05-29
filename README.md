# Claude Code BestPractice — fusioniert mit ECC

> **Mein VPS-weites Claude-Code-Harness.** Engine ist **ECC** (Everything Claude Code,
> von [@affaanmustafa](https://x.com/affaanmustafa)); ergänzt um die wenigen einzigartigen
> Stärken meines früheren BestPractice-Harness. Global installiert nach `~/.claude`, aktiv in
> **allen** Projekten auf der VPS — RTK-sicher, namespace-sauber, ohne Konflikte.

## 📖 Begleit-Dokument (immer offen neben dem Code)

- **`docs/ECC-Harness-Guide.de.docx`** — ausführliches Nachschlagewerk (Word)
- **`docs/ECC-Harness-Guide.de.pptx`** — Onboarding-Deck (PowerPoint)

Beide erklären auf Deutsch: wann welcher Command, welches Modell, welcher MCP, der Phasen-Workflow,
RPI, Memory, Security. Neu generierbar mit `python3 docs/build_guide.py`.

## 🚀 Installation / Re-Install (VPS-weit)

```bash
./install-vps.sh                 # ECC (core) global nach ~/.claude + BestPractice-Extras
./install-vps.sh --dry-run       # nur Plan anzeigen, nichts schreiben
./install-vps.sh --profile full  # größeres ECC-Profil
./install-vps.sh --harden        # zusätzlich deny-Sicherheitsbasis (opt-in, mit Backup)
```

Das Skript ist idempotent. Es installiert ECC namespace-sicher (`rules/ecc/`, `skills/ecc/`,
`agents/`, `commands/`), layert die RPI-Commands + Karpathy-Rule und lässt **RTK-Hook und
`settings.json` unangetastet**. ECC-Hooks bleiben **inaktiv** (Security-First).

## 🗂 Repo-Struktur

```
.
├── ecc/                   # Vendored ECC — die Engine (63 Agents, ~79 Skills, 79 Commands, Installer)
├── bestpractice-extras/   # Kuratierte BestPractice-Stärken (kollisionsfrei, ECC-ergänzend)
│   ├── commands/rpi/      #   /rpi:research · /rpi:plan · /rpi:implement
│   ├── commands/          #   /adopt-project
│   ├── agents/rpi/        #   8 RPI-Specialist-Agents
│   ├── rules/             #   karpathy-principles.md
│   └── templates/         #   PROJECT_RULES, project-profile, tech-stack, state/-Vorlagen
├── install-vps.sh         # RTK-sicherer Rollout-Orchestrator (opt-in --harden)
├── docs/                  # Word- + PowerPoint-Guide + Generator (build_guide.py)
└── legacy/                # Archiv des ursprünglichen BestPractice-Harness (NICHT installiert)
```

## 🔀 Was die Fusion behält vs. verwirft

**Behalten** (einzigartig, ergänzt ECC):

- **RPI-Workflow** — `/rpi:research → /rpi:plan → /rpi:implement` + `/adopt-project` (ECC hat kein `/rpi`)
- **`state/`-Pattern** + Templates (menschenlesbare Projekt-Persistenz)
- **Karpathy-Principles** (always-on Disziplin-Rule)

**Verworfen** (ECC ist überlegen, siehe `legacy/README.md`):

- 9 Domain-Agents → ECCs 63 Agents · 12 Skills → ECCs ~79 · Python-Hook-Monolith → ECC-Hooks + RTK
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

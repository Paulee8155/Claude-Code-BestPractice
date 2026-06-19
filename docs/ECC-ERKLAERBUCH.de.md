# Das ECC-Erklärbuch — Dein System von A bis Z

> **Für wen ist das?** Für dich — auch ohne Programmier-Profi zu sein. Dieses Dokument
> erklärt **dein komplettes System**: was jeder Ordner macht, welche Workflows es gibt,
> welche Agenten / Skills / Commands / Hooks existieren, wie alles zusammenhängt und was
> passiert, wenn du das System in einem neuen Projekt einrichtest.
>
> **Stand:** 2026-06-10 · ECC läuft als **globales Plugin** `ecc@ecc` 2.0.0-rc.1 (gepinnt
> auf Upstream `affaan-m/ECC`, 63 Agenten, 249 Skills, 79 Commands, 29 Hooks) — plus deine
> eigenen Erweiterungen (Schicht 2) und das Schicht-2-Tooling (mgrep, LSP-Plugins).
> Seit der **Plugin-only-Migration (2026-06-10)** gibt es keine vendored `ecc/`-Kopie mehr;
> claude-mem und superpowers sind deaktiviert — ECC ist die einzige führende Mechanik.

---

## Inhaltsverzeichnis

1. [Das große Bild — was ist ECC?](#1-das-große-bild)
2. [Die vier Bausteine: Agent, Skill, Command, Hook](#2-die-vier-bausteine)
3. [Schnellstart — das Wichtigste zuerst](#3-schnellstart)
4. [Die Repo-Struktur — was jeder Ordner macht](#4-die-repo-struktur)
5. [Die Haupt-Workflows (5 Phasen)](#5-die-haupt-workflows)
6. [Die Slash-Commands (79)](#6-die-slash-commands)
7. [Die Agenten (63)](#7-die-agenten)
8. [Die Skills (249)](#8-die-skills)
9. [Das Hook-System — die automatische Mechanik](#9-das-hook-system)
10. [Deine eigenen Erweiterungen (RPI, Mega-Plan, State-Sync)](#10-deine-eigenen-erweiterungen)
11. [Ein neues Projekt ECC-ready machen (/ecc-onboard)](#11-ein-neues-projekt-einrichten)
12. [Wie Dokumentation entsteht](#12-wie-dokumentation-entsteht)
13. [End-to-End: Von Null auf fertiges Feature](#13-end-to-end)
14. [Glossar für Nicht-Coder](#14-glossar)
15. [Aktivierungs-Status (Stand 2026-06-10)](#15-aktivierungs-status-stand-2026-06-10)
16. [Wie du ECC jetzt wirklich benutzt — Praxis-Leitfaden](#16-praxis-leitfaden)

---

## 1. Das große Bild

**ECC** ("Everything Claude Code") ist ein **Harness** — also ein Gerüst, das Claude Code
beim Programmieren diszipliniert führt. Es ist kein einzelnes Programm, sondern ein
**Werkzeugkasten**: vordefinierte Spezialisten (Agenten), tiefes Fachwissen (Skills),
Schnellbefehle (Commands) und automatische Sicherheitsnetze (Hooks).

Dein System besteht aus **drei sauber getrennten Schichten**:

```
┌─────────────────────────────────────────────────────────────┐
│  SCHICHT 3 — Deine globale Config                            │
│  ~/.claude/CLAUDE.md, ~/.claude/settings.json               │
│  → Modell-Strategie, Token-Budget, Karpathy-Prinzipien,     │
│    welche Plugins an sind, ECC_HOOK_PROFILE                 │
├─────────────────────────────────────────────────────────────┤
│  SCHICHT 2 — BestPractice-Wrapper (DEIN Eigenbau)           │
│  bestpractice-extras/, docs/MEGA-WORKFLOW.de.md             │
│  → RPI-Berater, /mega-plan, State-Sync-Adapter             │
│  → steuert ECC nur über dessen reguläre Schnittstellen     │
├─────────────────────────────────────────────────────────────┤
│  SCHICHT 1 — ECC-Core (globales Plugin, NIE verändert)     │
│  ~/.claude/plugins/cache/ecc/ecc/2.0.0-rc.1/               │
│  → 63 Agenten · 249 Skills · 79 Commands · 29 Hooks        │
│  → + 6 mitgebrachte MCP-Server (memory, context7, github,  │
│    exa, playwright, sequential-thinking)                    │
└─────────────────────────────────────────────────────────────┘
```

**Die goldene Regel deines Setups:** Schicht 1 (das Plugin) wird **niemals** angefasst.
Seit der Plugin-only-Migration (2026-06-10) gibt es keine vendored `ecc/`-Kopie im Repo
mehr — ECC lebt ausschließlich als globales Plugin `ecc@ecc`, gepinnt auf den Upstream-Tag
`v2.0.0-rc.1` (GitHub `affaan-m/ECC`). Verhalten änderst du nur über Env-Vars
(`ECC_HOOK_PROFILE`, `ECC_GATEGUARD`) und Schicht 2. Dadurch kannst du ECC jederzeit auf
einen neueren Upstream-Tag heben (Eintrag in `~/.claude/settings.json` →
`extraKnownMarketplaces.ecc.source.ref` ändern), ohne deine Erweiterungen zu verlieren.

---

## 2. Die vier Bausteine

Bevor wir in die Details gehen — diese vier Begriffe musst du auseinanderhalten:

| Baustein | Was es ist | Wie aktiviert | Analogie |
|---|---|---|---|
| **Command** | Ein Schnellbefehl, den du tippst | Du tippst `/name` | Knopf im Menü |
| **Agent** | Ein spezialisierter Subagent (eigene KI-Rolle) | `@name` erwähnen oder ein Command ruft ihn | Ein Spezialist, den du hinzuziehst |
| **Skill** | Eine Wissenssammlung (Patterns, Checklisten) | **Automatisch** je nach Kontext, oder per Skill-Tool | Ein Fachbuch, das sich selbst aufschlägt |
| **Hook** | Code, der automatisch bei Ereignissen läuft | Von selbst (vor/nach Aktionen) | Hausautomatik: Tür auf → Licht an |

**Kurz:** Commands rufst **du** auf. Agenten sind die **Arbeiter**. Skills sind das
**Wissen**. Hooks sind die unsichtbare **Mechanik im Hintergrund**.

---

## 3. Schnellstart

Wenn du nur 5 Minuten hast — das ist die ungenutzte Power, die du sofort abrufen solltest.

### Die 10 Commands für den Alltag

| Command | Wofür |
|---|---|
| `/plan` | Vor jeder größeren Aufgabe: Anforderungen klären, Risiken, Schritt-für-Schritt-Plan (wartet auf dein OK) |
| `/feature-dev` | Feature mit Codebase-Verständnis und Architektur-Fokus bauen |
| `/tdd` | Neues Feature test-first entwickeln |
| `/code-review` | Geschriebenen Code auf Qualität & Bugs prüfen |
| `/build-fix` | Build-/Compiler-Fehler schnell und minimal beheben |
| `/security-scan` | Agent/Hook/MCP/Secrets-Oberfläche auf Lücken prüfen |
| `/quality-gate` | Komplette Qualitäts-Pipeline für Datei/Projekt laufen lassen |
| `/learn` | Bewährte Muster aus der Session als Skill sichern |
| `/checkpoint` | Fortschritt nach Verifikationstests sichern |
| `/pr` | GitHub-PR aus aktuellem Branch erstellen |

### Die 8 wertvollsten Agenten

1. **code-reviewer** — nach *jedem* Code-Change; findet Bugs & Security-Issues.
2. **tdd-guide** — erzwingt Tests vor Code, spart späteren Refactor-Stress.
3. **planner** — klärt Feature-Scope *vor* dem Coding, verhindert Architektur-Fehler.
4. **security-reviewer** — verhindert OWASP-Top-10-Lücken und Credential-Leaks.
5. **build-error-resolver** — spart Minuten beim Debuggen von Compiler-Fehlern.
6. **architect** — bei System-Design & Skalierung; verhindert teure Redesigns.
7. **performance-optimizer** — findet N+1-Queries und Bundle-Bloat früh.
8. **\<sprache\>-reviewer** (z. B. `python-reviewer`, `react-reviewer`) — findet Idiom-Fehler, die der allgemeine Reviewer übersieht.

### Die 12 wertvollsten Skills

`tdd-workflow` · `security-review` · `react-patterns` + `react-performance` ·
`django-patterns` / `springboot-patterns` · `codebase-onboarding` · `deep-research` ·
`github-ops` · `deployment-patterns` · `cost-tracking` + `context-budget` ·
`continuous-learning-v2` · `agent-architecture-audit` · `code-tour`.

### Deine eigenen Power-Tools

- `/mega-plan <Ziel>` — bei vagen/großen Zielen: 4 Berater (Intake, CTO, Product, UX) beraten **parallel**, bevor `/plan` startet.
- `/ecc-onboard` — neues Projekt in einem Befehl ECC-ready machen.
- **mgrep** — semantische Suche statt grep (~50 % Token-Ersparnis). Einrichtung +
  Index siehe [Abschnitt 9b](#9b-mgrep-semantische-suche). Nutzung: `mgrep search "<konzept>"`.
- **LSP-Plugins** (`typescript-lsp`, `pyright-lsp`) — Echtzeit-Typecheck & go-to-definition
  im Terminal, ohne IDE.

---

## 4. Die Repo-Struktur

Der ECC-Werkzeugkasten liegt seit der Migration unter
`~/.claude/plugins/cache/ecc/ecc/2.0.0-rc.1/` (globales Plugin, read-only behandeln).
Jeder Ordner hat eine klare Aufgabe.

| Ordner | Was drin ist und wofür |
|---|---|
| **agents** | "Spezialisten zum Anfordern" — vordefinierte KI-Rollen (Code-Prüfer, Sicherheits-Prüfer, Architekt …). Jede Datei = ein Experte. (~63) |
| **assets** | Bilder/Grafiken fürs Projekt (z. B. Logo). Reine Deko. |
| **commands** | Die `/`-Schnellbefehle (z. B. `/code-review`, `/plan`). Jede Datei = ein Knopf. (~79) |
| **config** | Einstellungen. Wichtigste Datei: `project-stack-mappings.json` — Tabelle "welche Technik braucht welche Regeln/Werkzeuge". |
| **contexts** | "Arbeitsmodi" — kurze Verhaltens-Profile (Entwickeln / Recherchieren / Prüfen). |
| **docs** | Dokumentation in vielen Sprachen + Architektur-/Sicherheits-Erklärungen. |
| **ecc2** | Die nächste Generation ("ECC 2.0", in Rust) — früher Prototyp mit Dashboard & Sitzungs-Speicher. Noch nicht fertig. |
| **examples** | Beispiel-Konfigurationen für Projekttypen (Next.js, Django, Go, Rust …) zum Abschauen. |
| **hooks** | "Automatik-Auslöser" — zentrale Datei: `hooks.json`. |
| **integrations** | Anbindungen an Fremd-Werkzeuge. |
| **legacy-command-shims** | Altlasten-Schublade: alte Befehlsnamen für Gewohnheits-Nutzer. |
| **manifests** | "Packlisten" für die Installation (`core`, `developer`, `full`). |
| **mcp-configs** | Konfiguration für externe KI-Dienste (MCP-Server). |
| **plugins** | Erklärt, wie man ECC als Plugin in Claude Code einklinkt. |
| **research** | Notizen und Analysen (Hintergrund-Material). |
| **rules** | Die "Hausordnung" — Programmier-Standards je Sprache + `common`. |
| **schemas** | Formale "Formular-Vorlagen", die prüfen, dass Configs korrekt aufgebaut sind. |
| **scripts** | Die Automatik-Programme, die das Repo am Laufen halten (`install-plan.js`, `install-apply.js`, Codemaps). |
| **skills** | Das größte Wissensarchiv (~249 Skills) — Tests, Sicherheit, Frontend, Design … |
| **src** | Eigener Python-Quellcode für eine kleine LLM-/Anbieter-Schnittstelle. |
| **tests** | Selbstkontrolle: prüft, dass das Repo selbst korrekt funktioniert. |

Daneben im Hauptordner: Anleitungs-Dokumente (`README.md`, `ECC-WORKFLOW-GUIDE.de.md`,
die drei Leitfäden short-/longform/security) und das Dashboard `ecc_dashboard.py`.

---

## 5. Die Haupt-Workflows

ECC ist das **führende Harness**. Der Kern ist eine **5-Phasen-Pipeline**. Wichtig: Der
"Loop" ist **kein Daemon**, sondern agenten-getrieben.

| Phase | Was passiert | Command / Agent / Skill |
|---|---|---|
| **1. RESEARCH** | Codebase verstehen, vorhandene Lösungen wiederverwenden (GitHub-Suche → Lib-Docs → Exa), Explore-Subagents parallel. | Explore-Subagents, `gh search`, context7, `codebase-onboarding` |
| **2. PLAN** | Anforderungen restaten, Risiken bewerten, Schritt-Plan. **Wartet zwingend auf dein OK**, bevor Code angefasst wird. Pflicht bei Aufgaben > 30 Min. | `/plan`, `planner`/`architect`-Agenten |
| **3. IMPLEMENT** | TDD: Tests zuerst (RED → GREEN → REFACTOR), minimal, 80 %+ Coverage. | `/feature-dev`, `tdd-guide`, `*-test`-Skills |
| **4. REVIEW** | Code-Review auf Qualität/Sicherheit; CRITICAL/HIGH blockieren den Merge. | `/code-review` + sprach-spezifisch, `security-reviewer` |
| **5. VERIFY** | Tests + Build müssen grün sein. Bei Fehlern zurück zu Phase 3. | `/build-fix`, `quality-gate`, `checkpoint` |

**Quer dazu:**
- **Bug** → erst reproduzieren + failing Test schreiben (`ecc:tdd-workflow`), nie blind
  einen Fix raushauen. (Das frühere `/systematic-debugging` stammte aus superpowers —
  dieses Plugin ist seit 2026-06-10 deaktiviert.)
- **Neues/bestehendes Projekt** → `/ecc-onboard` (Stack-Detection + Setup).
- **Continuous Learning** → `/learn-eval`, `/promote` für bewährte Muster.

---

## 6. Die Slash-Commands

Ein **Slash-Command** ist ein schneller Befehl, den du als `/name` eintippst.

### Research & Planning
- `/plan` — Anforderungen prüfen, Risiken bewerten, Schritt-für-Schritt-Plan.
- `/plan-prd` — schlanke, problemzentrierte PRD erzeugen → an `/plan` weitergeben.
- `/multi-plan` — Multi-Model-Plan ohne Code-Änderungen.
- `/feature-dev` — geführte Feature-Entwicklung mit Architektur-Fokus.

### Implementation & Build
- `/tdd` — Test-First für neue Features.
- `/gan-design` — Generator/Evaluator-Loop für Frontend/visuelle Arbeit mit Scoring.
- `/gan-build` — Generator/Evaluator-Loop für Implementation mit begrenzten Iterationen.
- `/multi-backend` · `/multi-frontend` — Multi-Model-Workflow für Backend bzw. Frontend.
- `/multi-execute` — Multi-Model-Plan ausführen (Claude als einziger Datei-Schreiber).
- `/multi-workflow` — vollständiger Multi-Model-Workflow (Research → Plan → Execute → Optimize → Review).

### Code Review & Quality
- `/code-review` — Review für lokale Änderungen oder GitHub-PR.
- `/review-pr` — umfassende PR-Review mit spezialisierten Agenten.
- `/security-scan` — AgentShield gegen Agent/Hook/MCP/Permission/Secret-Oberflächen.
- `/quality-gate` — ECC-Qualitäts-Pipeline für Datei/Projekt.
- `/santa-loop` — adversarischer Dual-Review: zwei unabhängige Reviewer müssen **beide** zustimmen.

### Sprach-/Framework-spezifische Reviews
`/cpp-review` · `/flutter-review` · `/go-review` · `/kotlin-review` · `/python-review` ·
`/react-review` · `/rust-review` · `/fastapi-review` — je ein tiefer Review für die Sprache.

### Build Fixes
`/build-fix` (generisch) · `/cpp-build` · `/flutter-build` · `/go-build` · `/gradle-build` ·
`/kotlin-build` · `/react-build` — inkrementelle Behebung von Build-/Compiler-Fehlern.

### Testing
`/cpp-test` · `/flutter-test` · `/go-test` · `/kotlin-test` · `/react-test` · `/rust-test`
— TDD-Workflow je Sprache. Plus `/test-coverage` — Coverage analysieren, Lücken füllen.

### Git & PR
- `/pr` — GitHub-PR aus aktuellem Branch.
- `/prp-prd` · `/prp-plan` · `/prp-implement` · `/prp-pr` · `/prp-commit` — die "PRP"-Variante des Plan→Implement→PR-Flows.

### Continuous Learning & Knowledge
- `/learn` — wiederverwendbare Muster als Candidate-Skills sichern.
- `/learn-eval` — Muster extrahieren, Qualität selbst bewerten, Speicherort bestimmen.
- `/promote` — projekt-lokale Instincts global hochstufen.
- `/prune` — alte, nie hochgestufte Instincts (>30 Tage) löschen.
- `/skill-create` — aus Git-Historie Muster extrahieren → SKILL.md erzeugen.
- `/skill-health` — Skill-Portfolio-Dashboard mit Charts.
- `/instinct-export` · `/instinct-import` · `/instinct-status` — Instincts verwalten.

### Refactoring & Cleanup
- `/refactor-clean` — Dead Code sicher entfernen (Verifikation nach jedem Schritt).
- `/evolve` — Instincts analysieren und weiterentwickeln.
- `/update-codemaps` — token-sparsame Architektur-Karten erzeugen.
- `/update-docs` — Doku aus Quell-Dateien (Scripts, Schemas, Routes) synchronisieren.

### Project Setup
- `/project-init` — Stack erkennen, Dry-Run-Onboarding-Plan erstellen.
- `/projects` — bekannte Projekte und Instinct-Statistiken auflisten.
- `/pm2` — PM2-Service-Commands für erkannte Services erzeugen.
- `/setup-pm` — Package Manager (npm/pnpm/yarn/bun) konfigurieren.

### Automation & Loops
- `/loop-start` — autonomen Loop mit Safety-Defaults und Stop-Bedingungen starten.
- `/loop-status` — Loop-Zustand, Fortschritt, Failure-Signale inspizieren.

### Verification & Checkpoints
- `/checkpoint` — Checkpoints nach Verifikationstests erstellen/auflisten.
- `/save-session` · `/resume-session` — Sitzungs-Zustand sichern/fortsetzen.

### Sonstiges
- `/harness-audit` — Repo-Harness-Audit mit priorisierter Scorecard.
- `/model-route` — bestes Modell-Tier für die Aufgabe empfehlen (Complexity/Risk/Budget).
- `/ecc-guide` — durch ECCs Agenten/Skills/Commands/Hooks navigieren.
- `/cost-report` — lokalen Kosten-Report aus der Cost-Tracker-SQLite erzeugen.
- `/marketing-campaign` — komplette Marketing-Kampagne planen/ausführen.
- `/hookify` · `/hookify-help` · `/hookify-configure` · `/hookify-list` — Hooks aus Verhalten erzeugen/verwalten.
- `/jira` — Jira-Ticket abrufen/aktualisieren/kommentieren.

---

## 7. Die Agenten

Ein **Agent** (Subagent) ist eine spezialisierte KI-Rolle für eine bestimmte Aufgabe. Du
rufst ihn per `@agent-name` auf — oder ein Command/Hook zieht ihn automatisch hinzu.

### Code-Reviewer (nach Sprache)
| Agent | Aufgabe |
|---|---|
| **code-reviewer** | Allgemeiner Review für Qualität, Patterns, Best Practices — nach jeder Änderung. |
| **typescript-reviewer** | TS/JS: Type-Safety, async-Korrektheit, Node/Web-Sicherheit. |
| **python-reviewer** | Python: PEP 8, Idiome, Type-Hints, Sicherheit. |
| **go-reviewer** | Go: idiomatisches Go, Concurrency, Error-Handling. |
| **rust-reviewer** | Rust: Ownership, Lifetimes, unsafe, Idiome. |
| **cpp-reviewer** | C++: Memory-Safety, Modern C++, Concurrency. |
| **swift-reviewer** | Swift: Protocol-Design, Value Semantics, Concurrency. |
| **kotlin-reviewer** | Kotlin/Android: Idiome, Coroutines, Compose. |
| **java-reviewer** | Java: Spring Boot & Quarkus, Architektur-Fokus. |
| **csharp-reviewer** | C#/.NET: async, nullable References, Performance. |
| **fsharp-reviewer** | F#: Functional Idioms, Type-Safety. |
| **flutter-reviewer** | Flutter/Dart: Widgets, State Management, Clean Architecture. |
| **react-reviewer** | React: Hook-Korrektheit, Performance, Server/Client Boundaries. |
| **fastapi-reviewer** | FastAPI: async, Pydantic, Security. |
| **django-reviewer** | Django: ORM, DRF, Migration-Safety. |
| **database-reviewer** | PostgreSQL: Queries, Schema-Design, Performance. |
| **mle-reviewer** | ML-Engineering: Data Contracts, Pipelines, Model Serving. |
| **healthcare-reviewer** | Healthcare: CDSS-Sicherheit, PHI-Compliance, Clinical Safety. |
| **security-reviewer** | Vulnerabilities, OWASP Top 10, Crypto. |

### Build- & Fehler-Resolver (nach Sprache)
| Agent | Aufgabe |
|---|---|
| **build-error-resolver** | Allgemeiner TS/Build-Error-Fixer (minimaler Diff). |
| **react-build-resolver** | React/Vite/webpack/Next.js, JSX/TSX, Hydration. |
| **cpp-build-resolver** | C++/CMake/Linker/Template-Fehler. |
| **dart-build-resolver** | Dart/Flutter: Analysis, Pub, BuildRunner. |
| **django-build-resolver** | Django/Python: Migration & Dependency-Fehler. |
| **go-build-resolver** | Go: go vet & Compiler-Errors. |
| **java-build-resolver** | Java/Maven/Gradle, Spring/Quarkus Auto-Detection. |
| **kotlin-build-resolver** | Kotlin/Gradle: Compiler & Gradle. |
| **pytorch-build-resolver** | PyTorch: Tensor-Shapes, Device, Mixed Precision. |
| **rust-build-resolver** | Rust/Cargo: Borrow-Checker & Linker. |
| **swift-build-resolver** | Swift/Xcode: SPM & Code-Signing. |
| **harmonyos-app-resolver** | HarmonyOS/ArkTS: Navigation & State Management. |

### Architektur, Planung & Analyse
| Agent | Aufgabe |
|---|---|
| **architect** | System-Design und technische Entscheidungen. |
| **code-architect** | Analysiert Codebase, designt Feature-Architekturen mit Blueprints. |
| **planner** | Planung für komplexe Features/Refactoring — erzeugt PRD, Architektur, Task-Lists. |
| **code-explorer** | Analysiert Code: Execution Paths, Layers, Dependencies. |
| **harness-optimizer** | Optimiert die Agent-Harness-Konfiguration (Reliability, Cost). |
| **network-architect** | Enterprise-/Multi-Site-Netzwerk-Architekturen. |
| **homelab-architect** | Home-/Lab-Netzwerk-Pläne mit Safe Staged Changes. |

### Testing & QA
| Agent | Aufgabe |
|---|---|
| **tdd-guide** | Test-Driven Development — erzwingt write-tests-first. |
| **e2e-runner** | E2E-Tests mit Playwright/Vercel Agent Browser, Quarantine flaky Tests. |
| **pr-test-analyzer** | Bewertet Test-Coverage-Qualität in PRs. |
| **comment-analyzer** | Prüft Code-Comments auf Accuracy & Rot-Risk. |
| **silent-failure-hunter** | Findet Silent Failures & verschluckte Fehler. |
| **type-design-analyzer** | Prüft Type-Design auf Encapsulation & Invarianten. |

### Code-Qualität & Refactoring
| Agent | Aufgabe |
|---|---|
| **code-simplifier** | Vereinfacht Code für Klarheit (fokussiert auf zuletzt Geändertes). |
| **refactor-cleaner** | Dead-Code-Cleanup mit knip, depcheck, ts-prune. |
| **performance-optimizer** | Bottlenecks, Bundle-Size, Render-Optimierung. |

### Dokumentation
| Agent | Aufgabe |
|---|---|
| **doc-updater** | Doku & Codemaps — fährt `/update-codemaps` und `/update-docs`. |
| **docs-lookup** | Holt aktuelle Library-Docs über Context7. |

### GAN-Harness (Generator/Evaluator)
| Agent | Aufgabe |
|---|---|
| **gan-planner** | Macht aus One-Liner-Prompt eine volle Produkt-Spec mit Eval-Kriterien. |
| **gan-generator** | Implementiert nach Spec, iteriert auf Evaluator-Feedback. |
| **gan-evaluator** | Testet Live-App via Playwright, scored gegen Rubric. |

### Open-Source Pipeline
| Agent | Aufgabe |
|---|---|
| **opensource-forker** | Fork fürs Open-Sourcing: Secrets/Interna entfernt. |
| **opensource-sanitizer** | Verifiziert Sanitization mit 20+ Regex-Patterns vor Release. |
| **opensource-packager** | Generiert CLAUDE.md, README, LICENSE, CONTRIBUTING. |

### Netzwerk & Spezial-Domänen
| Agent | Aufgabe |
|---|---|
| **network-config-reviewer** | Reviews Router/Switch-Configs auf Security & Guardrails. |
| **network-troubleshooter** | Diagnose mit OSI-Layer-Workflow, Evidence-Backed Root Cause. |
| **marketing-agent** | Campaigns, Landing Pages, Email-Sequences, Copy. |
| **seo-specialist** | Technical SEO, Core Web Vitals, Structured Data. |
| **a11y-architect** | Accessibility / WCAG 2.2, Inclusive UX. |
| **loop-operator** | Betreibt autonome Agent-Loops, greift bei Stillstand ein. |
| **conversation-analyzer** | Analysiert Transkripte für Hook-Kandidaten (`/hookify`). |
| **chief-of-staff** | Email/Slack/Messenger-Triage in 4 Tiers, Draft-Replies. |

> **Die 8 wertvollsten Agenten** sind oben im [Schnellstart](#3-schnellstart) gelistet.

---

## 8. Die Skills

### Was ist ein Skill?
Ein **Skill** ist ein Spezialist-Modul, das automatisch bestimmte Aufgaben oder Kontexte
erkennt und sein Fachwissen einbringt — meist **ohne** dass du etwas aufrufst (Trigger z. B.:
Dateiname enthält `.md`, du schreibst "erstelle eine API", eine Datei importiert ein bestimmtes
Paket). Ein Skill bündelt Patterns, Checklisten und Werkzeugketten. Unterschied: **Command** =
du tippst ihn, **Agent** = arbeitet autonom, **Skill** = Wissen, das sich kontextbasiert
selbst aktiviert.

### Kategorie-Überblick (249 Skills)

| # | Kategorie | Anzahl | Beispiele |
|---|---|---|---|
| 1 | Agenten-Architektur & autonome Systeme | ~16 | `agent-architecture-audit`, `autonomous-loops`, `eval-harness`, `claude-devfleet` |
| 2 | Sprach-Patterns & Testing | ~65 | `react-patterns`, `python-patterns`, `django-celery`, `golang-testing`, `rust-patterns`, `swiftui-patterns` |
| 3 | Frontend & Design | ~18 | `frontend-a11y`, `design-system`, `motion-foundations…advanced`, `liquid-glass-design` |
| 4 | Datenbanken & Backend | ~18 | `postgres-patterns`, `redis-patterns`, `prisma-patterns`, `database-migrations` |
| 5 | Git, GitHub, PR & Workflows | ~12 | `git-workflow`, `github-ops`, `code-tour`, `architecture-decision-records` |
| 6 | Debugging, Verification & Quality | ~22 | `tdd-workflow`, `e2e-testing`, `verification-loop`, `safety-guard`, `production-audit` |
| 7 | Deployment, DevOps & Infra | ~16 | `docker-patterns`, `deployment-patterns`, `bun-runtime`, `homelab-*` |
| 8 | Content Creation & Writing | ~12 | `article-writing`, `brand-voice`, `content-engine`, `investor-materials` |
| 9 | Media & Video | ~5 | `manim-video`, `remotion-video-creation`, `video-editing`, `fal-ai-media` |
| 10 | Sicherheit, Compliance & Healthcare | ~14 | `security-review`, `security-scan`, `hipaa-compliance`, `healthcare-cdss-patterns` |
| 11 | Research & Intelligence | ~10 | `deep-research`, `market-research`, `exa-search`, `scientific-thinking-*` |
| 12 | Continuous Learning | ~5 | `continuous-learning-v2`, `knowledge-ops`, `rules-distill` |
| 13 | Konfiguration & Ops | ~8 | `configure-ecc`, `codebase-onboarding`, `ecc-guide`, `cost-tracking`, `context-budget` |
| 14 | Superpowers & Meta | ~8 | `subagent-driven-development`, `dispatching-parallel-agents`, `systematic-debugging`, `verification-before-completion` |
| 15 | Spezialdomänen & Nische | ~15 | `cost-aware-llm-pipeline`, `ck` (Per-Project Memory), `windows-desktop-e2e`, `council` |
| 16 | Lernhilfen & Onboarding | ~6 | `learn`, `learn-eval`, `checkpoint`, `product-lens`, `product-capability` |
| 17 | API Connectors & Integrationen | ~4 | `api-connector-builder`, `jira-integration`, `x-api` |
| 18 | Sonstige Fachbereiche | ~10 | `recursive-decision-ledger`, `iterative-retrieval`, `parallel-execution-optimizer`, `search-first` |

> Die vollständige Skill-Liste mit Einzel-Beschreibungen liegt im Plugin unter
> `~/.claude/plugins/cache/ecc/ecc/2.0.0-rc.1/skills/<name>/SKILL.md`.
> Per `/ecc-guide` oder `skill-scout` durchsuchbar.

> **Die 12 wertvollsten Skills** sind oben im [Schnellstart](#3-schnellstart) gelistet.

---

## 9. Das Hook-System

### Was ist ein Hook?
Ein **Hook** ist ein kleines Programm, das **von selbst** läuft, sobald ein Ereignis eintritt
— wie eine Hausautomatik: Tür öffnen (Ereignis) → Licht an (Hook). Bei ECC läuft Code
automatisch **vor** oder **nach** Aktionen. So entsteht ein **Sicherheitsnetz**: vorher prüfen
/ warnen / blockieren, nachher aufräumen / protokollieren / formatieren.

### Die Lifecycle-Events
- **PreToolUse** — **bevor** ein Werkzeug läuft (Befehl, Datei-Schreiben). Ideal zum Prüfen/Blockieren.
- **PostToolUse** — **nachdem** ein Werkzeug erfolgreich lief. Aufräumen, Formatieren, Protokollieren.
- **PostToolUseFailure** — wenn ein Werkzeug **fehlschlug** (z. B. externen Dienst als "krank" markieren).
- **Stop** — wenn der Assistent seine **Antwort beendet** (abschließende Sammel-Checks).
- **SessionStart** — beim **Start einer Sitzung** (Kontext laden, Paketmanager erkennen).
- **SessionEnd** — beim **Beenden** (Abschluss-Marker).
- **PreCompact** — **bevor** der Verlauf komprimiert wird (Zustand sichern).

### Alle Hooks im Überblick

| Event | Hook-ID | Auslöser | Was er macht | Profil |
|---|---|---|---|---|
| PreToolUse | `pre:bash:dispatcher` | Bash | Bündel-Hook: mehrere Terminal-Vorprüfungen (s. u.) | je Sub-Hook |
| PreToolUse | `pre:write:doc-file-warning` | Write | Warnt bei unüblichen Doku-Dateien (nur Warnung) | standard, strict |
| PreToolUse | `pre:edit-write:suggest-compact` | Edit, Write | Schlägt Kompaktieren an sinnvollen Stellen vor | standard, strict |
| PreToolUse | `pre:observe:continuous-learning` | `*` | Sammelt Beobachtungen fürs Lernen | standard, strict |
| PreToolUse | `pre:governance-capture` | Bash, Write, Edit | Erfasst Secrets/Richtlinienverstöße — **nur mit** `ECC_GOVERNANCE_CAPTURE=1` | standard, strict |
| PreToolUse | `pre:config-protection` | Write, Edit | Blockiert Änderungen an Linter/Formatter-Configs (Code fixen statt Regeln aufweichen) | standard, strict |
| PreToolUse | `pre:mcp-health-check` | `*` | Prüft externe Dienste (MCP), blockiert kranke Aufrufe | standard, strict |
| PreToolUse | `pre:edit-write:gateguard-fact-force` | Edit, Write | **GateGuard** — verlangt Recherche vor erster Datei-Änderung — **aktuell abgeschaltet** | standard, strict |
| PreCompact | `pre:compact` | `*` | Sichert Zustand vor Kompaktierung | standard, strict |
| SessionStart | `session:start` | `*` | Lädt Kontext, erkennt Paketmanager | (immer) |
| PostToolUse | `post:bash:dispatcher` | Bash | Bündel-Hook: Terminal-Nachbearbeitung (s. u.) | je Sub-Hook |
| PostToolUse | `post:quality-gate` | Edit, Write | Qualitäts-Checks nach Datei-Änderungen | standard, strict |
| PostToolUse | `post:edit:design-quality-check` | Edit, Write | Warnt bei generischer "Vorlagen-Optik" im Frontend | standard, strict |
| PostToolUse | `post:edit:accumulator` | Edit, Write | Merkt geänderte JS/TS-Dateien für Sammel-Formatierung | standard, strict |
| PostToolUse | `post:edit:console-warn` | Edit | Warnt vor vergessenen `console.log` | standard, strict |
| PostToolUse | `post:governance-capture` | Bash, Write, Edit | Governance-Erfassung aus Ausgaben — **nur mit** `ECC_GOVERNANCE_CAPTURE=1` | standard, strict |
| PostToolUse | `post:session-activity-tracker` | `*` | Zählt Werkzeugaufrufe/Datei-Aktivität (Metriken) | standard, strict |
| PostToolUse | `post:observe:continuous-learning` | `*` | Sammelt Ergebnisse fürs Lernen | standard, strict |
| PostToolUse | `post:ecc-metrics-bridge` | `*` | Pflegt Sitzungs-Metriken für Statusleiste | minimal, standard, strict |
| PostToolUse | `post:ecc-context-monitor` | `*` | Warnt bei vollem Kontext, hohen Kosten, Scope-Creep, Endlosschleifen | standard, strict |
| PostToolUseFailure | `post:mcp-health-check` | `*` | Markiert fehlgeschlagene Dienste als krank, versucht Reconnect | standard, strict |
| Stop | `stop:format-typecheck` | `*` | Formatiert + typ-prüft **einmal** alle geänderten JS/TS-Dateien | standard, strict |
| Stop | `stop:check-console-log` | `*` | Prüft auf zurückgelassene `console.log` | standard, strict |
| Stop | `stop:session-end` | `*` | Speichert Sitzungs-Zustand nach jeder Antwort | minimal, standard, strict |
| Stop | `stop:evaluate-session` | `*` | Wertet Sitzung auf wiederverwendbare Muster aus | minimal, standard, strict |
| Stop | `stop:cost-tracker` | `*` | Erfasst Token-/Kosten-Kennzahlen | minimal, standard, strict |
| Stop | `stop:desktop-notify` | `*` | Desktop-Benachrichtigung mit Aufgaben-Zusammenfassung | standard, strict |
| SessionEnd | `session:end:marker` | `*` | Abschluss-Marker beim Sitzungsende (blockiert nichts) | minimal, standard, strict |

### Das Dispatcher-Muster
Jeder zusätzliche Hook-Eintrag startet einen eigenen Node.js-Prozess — das kostet Zeit.
Deshalb bündelt ECC für Terminal-Befehle **einen** Dispatcher-Hook, der intern **mehrere
kleine Unter-Checks** nacheinander aufruft. Spart Startzeit, feste Reihenfolge; blockiert
ein Sub-Hook, brechen die nachfolgenden ab.

**`pre:bash:dispatcher`** (vor jedem Befehl):
- `pre:bash:block-no-verify` — blockiert Umgehen von Verifikation (alle Profile)
- `pre:bash:auto-tmux-dev` — startet Dev-Server automatisch in tmux (alle Profile)
- `pre:bash:tmux-reminder` — erinnert an tmux für lange Befehle (**nur strict**)
- `pre:bash:git-push-reminder` — Vor-Checks vor `git push` (**nur strict**)
- `pre:bash:commit-quality` — prüft Commit-Message-Qualität (**nur strict**)
- `pre:bash:gateguard-fact-force` — Fakten-Zwang (standard, strict) — **abgeschaltet**

**`post:bash:dispatcher`** (nach jedem Befehl):
- `post:bash:command-log-audit` — Audit-Log (alle Profile)
- `post:bash:command-log-cost` — Kosten-Log (alle Profile)
- `post:bash:pr-created` — erkennt erstellte PRs (standard, strict)
- `post:bash:build-complete` — meldet fertige Builds (standard, strict)

### Das Profil-System
Jeder Hook trägt eine Liste von Profilen, in denen er laufen darf:
- **minimal** — nur das Nötigste (Metriken, Speicherung, Kosten).
- **standard** — **Default**: das volle Qualitäts- & Lern-Sicherheitsnetz.
- **strict** — alles aus standard **plus** strengere Erinnerungen.

Gesteuert über Umgebungs-Variablen (`env`-Block in `settings.json`):
- **`ECC_HOOK_PROFILE`** — `minimal` / `standard` / `strict` (Upstream-Default: `standard`).
- **`ECC_GATEGUARD`** — `off` schaltet die beiden GateGuard-Hooks ab.
- **`ECC_GOVERNANCE_CAPTURE`** — schaltet die beiden Governance-Hooks erst mit `1` scharf.
- (`ECC_DISABLED_HOOKS` — gezielte ID-Liste — existiert weiterhin, wird bei dir aber
  **nicht mehr** genutzt; der frühere Listen-Hack wurde durch das Profil-System ersetzt.)

### Dein Scope-Setup (seit 2026-06-05/10)
- **Global** (`~/.claude/settings.json`): `ECC_HOOK_PROFILE=minimal` + `ECC_GATEGUARD=off`
  → in Nicht-ECC-Projekten feuern nur essenzielle Hooks (Metriken, Session-Speicherung,
  Kosten). Commands/Skills/Agents/MCPs des Plugins bleiben überall verfügbar.
- **Projekt-lokal** (onboarded, z. B. dieses Repo): `.claude/settings.json` setzt
  `ECC_HOOK_PROFILE=standard` → volle Pipeline (quality-gate, console-warn, observe,
  governance, metrics …) nur dort.
- **Wirkung:** env-Änderungen greifen erst in einer **frischen Session**.

### ⚠️ GateGuard ist bei dir bewusst abgeschaltet
`ECC_GATEGUARD=off` (global). GateGuard würde die **erste Änderung pro Datei blockieren**
und vorher Recherche erzwingen (Wer importiert die Datei? Welche Schemata hängen dran?).
Du hast ihn deaktiviert, weil er beim normalen Arbeiten genervt hat.

### Was strict zusätzlich brächte
Nur **drei** zusätzliche Terminal-Erinnerungen: `tmux-reminder`, `git-push-reminder`,
`commit-quality`. Alles andere ist in `standard` bereits aktiv. (Genau diese drei sind
Nag-Erinnerungen ähnlicher Art wie GateGuard — deshalb lohnt strict für dich aktuell nicht.)

---

## 9b. mgrep — semantische Suche

**mgrep** (`@mixedbread/mgrep`) ersetzt grep/ripgrep durch **semantische** Suche: statt nach
exakten Mustern zu raten, findet es Code/Doku nach **Konzept** ("wie werden Agent-Modelle
zugewiesen?") — laut Guide ~50 % weniger Token. Es ist **Schicht-2-Tooling**, kein ECC-Core.

### Wie es funktioniert
mgrep indexiert den Quellbaum in der **Mixedbread-Cloud** (Embeddings) und sucht dann
dagegen. Das heißt: einmal hochladen (Index), danach beliebig oft suchen.

### Einrichtung (einmalig)
1. **CLI:** `npm install -g @mixedbread/mgrep`
2. **API-Key** auf platform.mixedbread.com erzeugen (`mxb_…`).
3. **Key hinterlegen** im `env`-Block von `~/.claude/settings.json`:
   `{ "env": { "MXBAI_API_KEY": "mxb_…" } }` — user-scoped, **nicht** im Repo. Das ist der
   von der mgrep-Doku empfohlene headless-Weg (umgeht den interaktiven Browser-Login, der in
   der Claude-Bash-Umgebung nicht zuverlässig greift).

### Index bauen / aktualisieren
```bash
bash bestpractice-extras/scripts/mgrep/index.sh
```
Liest den Key aus `settings.json`, setzt das Datei-Limit, startet `mgrep watch`. (Seit der
Plugin-only-Migration ist der Baum deutlich kleiner — kein vendored `ecc/` mehr.) Nach dem initialen Sync (`processed / uploaded`) mit **Ctrl+C**
beenden — der Store bleibt durchsuchbar; `watch` muss **nicht** laufen.

### ⚠️ Outbound-Hinweis
`mgrep watch` lädt Dateiinhalte in die externe Cloud. Pro Repo eine bewusste Entscheidung;
`.gitignore` wird respektiert (keine `node_modules`/Secrets). Der Claude-Code Auto-Mode
**blockt** den Bulk-Upload absichtlich als Exfiltrations-Schutz — deshalb wird er **manuell**
über das Script angestoßen, nie automatisch durch Claude.

### Suchen
```bash
mgrep search "consumer scaffold onboarding"   # konzeptuell, auch in .docx
```
Details: `bestpractice-extras/scripts/mgrep/README.md`.

---

## 10. Deine eigenen Erweiterungen

Alle Eigenbauten liegen getrennt vom Upstream unter `bestpractice-extras/` und `docs/`. Sie
sind **rein additive Wrapper um ECC** — der ECC-Core (`ecc/`) bleibt unverändert. Entstanden
in 4 Commits (`f26bf3f` → `bad3f72`).

### RPI-Berater-Agenten (4 read-only Advisor)
In `bestpractice-extras/agents/` (destilliert aus einem 8-Agenten-Satz im `_archive/`):

| Advisor | Datei | Perspektive |
|---|---|---|
| Intake | `rpi-requirement-parser.md` | Anforderungen, Constraints, offene Fragen |
| CTO | `rpi-cto-advisor.md` | Technik-Strategie, Architektur-Fit, Risiko (Modell: opus) |
| Product | `rpi-product-manager.md` | Scope, Requirements, Akzeptanzkriterien |
| UX | `rpi-ux-designer.md` | Flows, States, Accessibility |

Alle sind **read-only** und liefern je einen kurzen Markdown-Brief (~350–400 Wörter) —
keine Implementierung.

### `/mega-plan` Command
`bestpractice-extras/commands/mega-plan.md` — eine **Planungs-Vorstufe vor ECCs `/plan`**
für vage/vielschichtige Ziele:
1. Relevante Advisor wählen (Default: **Intake + CTO immer**; PM bei Produktbezug, UX bei UI; override per `--advisors cto,pm,ux`).
2. Advisor **parallel** dispatchen (alle in EINER Antwort).
3. Briefs zu **einem** Briefing verdichten (geschärftes Ziel, Richtung + Alternativen, Scope in/out, Risiken + Mitigationen, offene Entscheidungen). Widersprüche werden benannt, nicht glattgebügelt.
4. Briefing an ECCs `/plan` übergeben → normaler Flow.

### State-Sync-Adapter (6 Module)
`bestpractice-extras/scripts/state-sync/` — koppelt das vom Menschen gepflegte `state/`
(Quelle der Wahrheit) an ECCs Loop-Futter `WORKING-CONTEXT.md`, **ohne** ECC zu berühren.
Kernbefund: `WORKING-CONTEXT.md` ist in ECC nur **Konvention**, kein erzwungener Zwang —
also additiv andockbar.

```
state/{context,decisions,tasks,progress}.md   (Wahrheit, Mensch)
   │ PRE  (SessionStart)  → schreibt STATE:*-Blöcke, bewahrt SYNC:*-inbox-Zonen
   ▼
<root>/WORKING-CONTEXT.md                      (Loop liest STATE:*, füllt SYNC:*)
   │ POST (Stop / PreCompact)  → nur Delta gegen Snapshot
   ▼
state/progress.md + state/tasks.md             (Erfolge / neue ToDos zurück)
```

| Datei | Rolle |
|---|---|
| `lib.js` | Marker-Konstanten, atomares I/O, Zone-Extraktion, Delta-Diff, Guards |
| `to-working-context.js` | PRE: `state/*` → `WORKING-CONTEXT.md` (+ Snapshot) |
| `from-working-context.js` | POST: `WORKING-CONTEXT.md` → Delta nach `state/*` |
| `state-sync.js` | CLI-Dispatcher (`pre`/`post`) für Hook + Hand |
| `selftest.js` | Roundtrip-Verifikation (7 Checks, Exit 0 = grün) |
| `README.md` | Doku |

**Sicherheits-Garantien:** Marker-Sektionen verhindern Überschreiben menschlichen Inhalts;
Snapshot (`state/.sync/`, gitignored) macht POST idempotent; **No-op-Guard** (kein `state/`
→ still beenden); **ECC-Guard** (überspringt Root mit Basename `ecc`); Exit 0 (Hooks brechen
Session nie ab). Registriert wird der Adapter **projekt-lokal** in `.claude/settings.json`
durch `/ecc-onboard` — nicht in ECC.

### Hybrid-Mega-Workflow & Karpathy
- `docs/MEGA-WORKFLOW.de.md` — die Gesamtdarstellung (Schichten, Sync-Loop, RPI+ECC-Orchestrierung, Recovery-Tabelle, Spickzettel). Wird zusätzlich als Word/PowerPoint gebaut.
- **Karpathy-Prinzipien** (`bestpractice-extras/rules/karpathy-principles.md`) — soft-global via `@`-Import in `~/.claude/CLAUDE.md`: Think-First, Simplicity, Surgical Changes, Goal-Driven. Immer aktiv, überschreibt keine ECC-Regel.

---

## 11. Ein neues Projekt einrichten

`/ecc-onboard` ist der "Einrichtungs-Knopf". Prinzip: **Nichts wird geschrieben, bevor du
nicht genau einmal "OK" gesagt hast** — Vorhandenes wird zusammengeführt, nie blind
überschrieben.

1. **Technik erkennen (nur lesen).** ECC liest `package.json`, `pyproject.toml`, `go.mod`,
   `Cargo.toml`, `Dockerfile` … und leitet Sprache/Framework ab. Über
   `config/project-stack-mappings.json` wird ein **Installations-Profil** gewählt (Default:
   `developer`; bei unklarem Stack: `core`).
2. **Trockenlauf (Dry-Run).** Plan erstellen, *was passieren würde* — ohne zu schreiben
   (`install-plan.js`, `install-apply.js --dry-run`).
3. **Einmal bestätigen.** Kompakte Anzeige: erkannte Technik (mit Beleg), Profil, was
   angelegt würde, Warnungen zu existierenden Dateien. Dann **eine** Rückfrage.
4. **Installieren (nach OK):**
   - `.claude/rules/ecc/` — passende Programmier-Regeln (allgemein + Sprach-Paket).
   - `.claude/skills/ecc/` — relevante Anleitungen.
   - `PROJECT_RULES.md` — projektspezifische Regeln mit **echten** Werten aus dem Code (keine Platzhalter); Login/Zahlung/DB werden automatisch erkannt.
   - `state/` mit `context.md`, `decisions.md`, `progress.md`, `tasks.md` — das "Projekt-Gedächtnis", gefüllt aus README, `git log` und echten TODOs.
5. **Automatik verdrahten (State-Sync-Hooks)** — **nur** in der projekt-eigenen
   `.claude/settings.json`: SessionStart → PRE (`state/` → `WORKING-CONTEXT.md`),
   Sitzungsende/PreCompact → POST (Delta zurück ins `state/`). `state/.sync/` kommt in die
   `.gitignore`.
6. **Bestehendes mergen & Bericht.** Altes `CLAUDE.md`/`state/` wird übernommen statt
   verworfen. Schluss-Bericht: was angelegt, was verifiziert vs. erfragt, Automatik aktiv,
   nächster Schritt (meist: `PROJECT_RULES.md` prüfen → `/plan` → `/feature-dev`).

**Eingebaute Sicherheit:** idempotent (mehrfaches Ausführen ergänzt nur); im ECC-Repo selbst
bricht ein "ECC-Guard" still ab; ohne `state/` passiert nichts; Fehler beenden nie die Sitzung.

---

## 12. Wie Dokumentation entsteht

Zwei Ebenen:

**1. Geschriebene Anleitungen (von Hand).** Normale Markdown-Texte: `README.md`,
`ECC-WORKFLOW-GUIDE.de.md`, die drei Leitfäden, der Ordner `docs/` mit Übersetzungen. Bei
Bedarf manuell aktualisiert. (Dieses Erklärbuch gehört auch dazu.)

**2. Die Begleit-Dokumente (gebaute Snapshots).** `docs/ECC-Harness-Guide.de.docx` (Word)
und `docs/ECC-Harness-Guide.de.pptx` (PowerPoint) sind Snapshots für die Weitergabe an
Nicht-Coder — sie haben eine **eigene** Markdown-Quelle: `docs/ECC-Harness-Guide.de.md`.
- **Single Source ist Markdown:** Der Harness-Guide wird ausschließlich in
  `docs/ECC-Harness-Guide.de.md` gepflegt; dieses Erklärbuch und `docs/MEGA-WORKFLOW.de.md`
  sind separate, ebenfalls von Hand gepflegte Markdown-Dokumente.
- **Reproduzierbar bauen:** `python3 bestpractice-extras/scripts/build-docs/build.py` erzeugt
  docx + pptx neu aus der md-Quelle (python-docx + python-pptx). Nach jeder Inhaltsänderung an
  der md einmal laufen lassen — so driften die Snapshots nicht mehr.

---

## 13. End-to-End

Was Schritt für Schritt passiert, wenn du von Null ein Feature baust:

1. **Onboarding (einmalig)** — `/ecc-onboard`: Stack erkennen, Dry-Run, **1× OK**, dann
   Rules/Skills installieren, `PROJECT_RULES.md` + `state/` anlegen, State-Sync-Hooks
   registrieren, initialer PRE-Sync (erzeugt `WORKING-CONTEXT.md`).
2. **Session-Start** — SessionStart-Hook fährt **PRE-Sync** (`state/` → `WORKING-CONTEXT.md`).
   Der Loop hat sofort Kontext (Purpose, Decisions, offene Tasks).
3. **Planungs-Vorstufe (bei vagem Ziel)** — `/mega-plan <Ziel>`: 4 RPI-Berater laufen
   parallel read-only → verdichtetes Briefing mit Scope, Risiken, offenen Entscheidungen.
   (Bei trivialen Änderungen überspringen → direkt `/plan`.)
4. **PLAN (Phase 2)** — `/plan` mit dem Briefing: Anforderungen restaten, Risiken, Schritt-Plan,
   **wartet auf dein OK**.
5. **IMPLEMENT (Phase 3)** — `/feature-dev` mit TDD (RED → GREEN → REFACTOR). Karpathy-Regeln
   greifen durchgehend. Bei Bugs zuerst reproduzieren + failing Test (`ecc:tdd-workflow`).
6. **REVIEW (Phase 4)** — `/code-review` (+ sprach-spezifisch). Sicherheitskritischer Code
   zieht `security-reviewer`. CRITICAL/HIGH blockieren.
7. **VERIFY (Phase 5)** — Tests + Build grün; bei Fehlern `/build-fix`, dann zurück zu
   Phase 3. `checkpoint`/`quality-gate` zur Bestätigung.
8. **Session-Ende / Compact** — Stop/PreCompact-Hook fährt **POST-Sync**: Delta gegen
   Snapshot → Erfolge an `state/progress.md`, neue ToDos an `state/tasks.md`. Fortschritt
   überlebt über Sessions.
9. **Commit & Merge** — Conventional-Commits (`feat:`/`fix:`/…), Commit-Messages enden mit
   `Co-Authored-By:`. Branch statt direkt auf `main`; PR via `gh`/`/pr`. Vor Review: CI grün,
   keine Konflikte, Branch aktuell.

**Garantie:** Alle Eigenbauten sind additiv — der ECC-Core (globales Plugin) wird nie
verändert, der Wrapper steuert ECC nur über dessen reguläre Hooks und Slash-Commands.

---

## 14. Glossar

| Begriff | Einfach erklärt |
|---|---|
| **ECC** | "Everything Claude Code" — das führende Harness/Gerüst, das Claude beim Coden diszipliniert. |
| **Harness** | Gerüst aus Regeln, Werkzeugen und Automatik, das die KI führt. |
| **Agent / Subagent** | Eine spezialisierte KI-Rolle für eine Aufgabe (Reviewer, Architekt …). |
| **Skill** | Eine Wissenssammlung, die sich kontextbasiert selbst aktiviert. |
| **Command** | Schnellbefehl, den du als `/name` tippst. |
| **Hook** | Code, der automatisch vor/nach Aktionen läuft (Sicherheitsnetz). |
| **Lifecycle-Event** | Fester Zeitpunkt, an dem Hooks feuern (PreToolUse, Stop …). |
| **Dispatcher** | Ein Hook, der intern mehrere kleine Unter-Checks bündelt (spart Startzeit). |
| **Profil** | Strenge-Stufe der Hooks: minimal / standard / strict. |
| **TDD** | Test-Driven Development: erst Test schreiben, dann Code (RED → GREEN → REFACTOR). |
| **MCP** | Externe KI-Dienste/Werkzeuge, die Claude zusätzlich nutzen kann (z. B. Context7, GitHub). |
| **PRD** | Product Requirements Document — beschreibt, *was* gebaut werden soll. |
| **Instinct** | Ein gelerntes Muster aus `/learn`, das später zum Skill werden kann. |
| **State-Sync** | Dein Adapter, der `state/` (Mensch) und `WORKING-CONTEXT.md` (KI-Loop) synchron hält. |
| **RPI-Berater** | Deine 4 read-only Advisor (Intake, CTO, Product, UX) vor der Planung. |
| **Idempotent** | Mehrfaches Ausführen schadet nicht — es wird nur ergänzt, nichts doppelt. |
| **Vendored** | Eine Kopie einer Abhängigkeit liegt fest im Repo. ECC **war** bis 2026-06-10 vendored (`ecc/`-Ordner) — heute läuft es als globales Plugin. |
| **Plugin** | In Claude Code installierte Erweiterung. ECC-Core = Plugin `ecc@ecc`, gepinnt auf Upstream-Tag `v2.0.0-rc.1`, Cache unter `~/.claude/plugins/cache/ecc/`. |

## 15. Aktivierungs-Status (Stand 2026-06-10)

Die **Plugin-only-Migration** ist abgeschlossen (Commits `d99f3d0` + `8293011`):

- **ECC-Core = globales Plugin.** `ecc@ecc` 2.0.0-rc.1, gepinnt via
  `extraKnownMarketplaces.ecc` auf GitHub `affaan-m/ECC` Tag `v2.0.0-rc.1`. Cache:
  `~/.claude/plugins/cache/ecc/ecc/2.0.0-rc.1/`. Die vendored Kopie `ecc/` im Repo und der
  213-MB-Klon `/root/projekte/ECC` sind **gelöscht**.
- **ECC-Duplikate im Home entfernt:** globale Rules-/Hooks-/Skills-Kopien unter `~/.claude/`
  sind weg (das Plugin liefert sie). Geblieben: 3 Schicht-2-Symlinks (`start`, `mega-plan`,
  `ecc-onboard`), `skills/learned`, `skills/system-architektur`, `rules/ecc-extras/`.
- **Abgelöste Plugins (in `enabledPlugins` auf `false`):** `claude-mem` (ersetzt durch
  ECC-Memory: memory-MCP + Instincts + `/save-session`), `superpowers` (ersetzt durch
  ECC-Workflows: `tdd-workflow`, `verification-loop` …), `context7@claude-plugins-official`
  und `feature-dev` (ECC bringt eigene Pendants mit).
  ⚠️ Plugin-Änderungen greifen erst nach einem **Neustart von Claude Code** — `/clear`
  lädt Plugins **nicht** neu.
- **Hook-Scope:** global `ECC_HOOK_PROFILE=minimal` + `ECC_GATEGUARD=off`; onboarded
  Projekte setzen lokal `standard` (BestPractice, Werkstattauftraege_codex,
  Grow3_Automatisierung, Test-ECC, Verladelisten_Hafen).
- **State-Sync aktiv (projekt-lokal):** `.claude/settings.json` → SessionStart→`pre`,
  Stop/PreCompact→`post` (`bestpractice-extras/scripts/state-sync/state-sync.js`).
- **Backup:** kompletter Stand vor der Migration unter `/root/harness-backup-20260610/`
  (inkl. geretteter Eigenarbeit aus dem ECC-Klon in `ecc-clone-eigenes/`).
- **Unberührt:** RTK-Hook (`PreToolUse:Bash` global), Attribution-Policy (Co-Authorship
  aktiv, Schicht-2-Override).

> Hinweis: Die Office-Snapshots `ECC-Harness-Guide.de.docx/.pptx` werden aus ihrer eigenen
> Markdown-Quelle `docs/ECC-Harness-Guide.de.md` gebaut:
> `python3 bestpractice-extras/scripts/build-docs/build.py`.

---

## 16. Praxis-Leitfaden

> **Das Kapitel beantwortet:** Wie benutze ich ECC konkret, damit ich Token spare und
> schneller/sicherer arbeite? Welche MCPs habe ich, wie funktioniert Memory, wer wählt
> die Modelle?

### 16.1 Deine MCP-Landkarte (was du wirklich hast)

ECC bringt **6 MCP-Server** mit (definiert in der Plugin-`.mcp.json` — du musst nichts
konfigurieren):

| MCP | Wofür | Wann benutzen |
|---|---|---|
| **memory** | Wissensgraph über Sessions hinweg (Entities, Relations, Observations) | „Haben wir das schon mal gelöst?", Architektur-Entscheidungen festhalten |
| **context7** | Aktuelle Library-Dokus (React, Prisma, Django …) | Immer statt WebFetch/Googeln bei Library-Fragen |
| **github** | Issues, PRs, Code-Suche auf GitHub | PR-Flows, Upstream-Recherche |
| **exa** | Web-Suche (HTTP-Dienst) | Recherche jenseits von Library-Dokus |
| **playwright** | Browser-Steuerung | E2E-Tests, UI-Verifikation |
| **sequential-thinking** | Strukturiertes Schritt-für-Schritt-Denken | komplexe Mehrschritt-Probleme |

Dazu unabhängig von ECC: **markitdown** (PDF/Word/Excel/PPTX → Markdown) und die
claude.ai-Connectoren (Gmail, Drive, Notion …).

> **context7-Klarstellung:** Das offizielle context7-Plugin ist bewusst **deaktiviert** —
> context7 läuft über ECC (Tools heißen `mcp__plugin_ecc_context7__*`). Kein Verlust,
> keine Dubletten.

### 16.2 Memory im Detail — drei Gedächtnisse, drei Aufgaben

Dein System hat **drei** Gedächtnis-Mechanismen. Verwechsle sie nicht:

| Mechanismus | Was es speichert | Wie du es benutzt |
|---|---|---|
| **memory-MCP** (Wissensgraph) | Fakten als Graph: Entities („WMS Live"), Relations („nutzt → SQLite"), Observations (Sätze) | aktiv per Tool: `search_nodes` (suchen), `open_nodes` (lesen), `create_entities` / `add_observations` (schreiben) |
| **Instincts** (Continuous Learning) | Gelernte Arbeitsmuster aus deinen Sessions, mit Konfidenz | passiv — ECC sammelt selbst; einsehen mit `/instinct-status`, befördern mit `/promote` |
| **state/ + WORKING-CONTEXT.md** (State-Sync, Schicht 2) | Projekt-Zustand: Kontext, Entscheidungen, Tasks, Fortschritt | automatisch via Hooks (SessionStart/Stop); von Hand pflegst du `state/*.md` |

Dazu `/save-session` / `/resume-session` für ganze Sitzungs-Snapshots
(`~/.claude/session-data/`).

**So nutzt du den memory-MCP richtig:**
- **Session-Anfang:** `search_nodes` mit Stichwort („Auth-Refactor", „Deployment WMS") —
  billiger als Dateien wälzen.
- **Nach wichtigen Entscheidungen:** Entity + Observation anlegen lassen („Merke dir: …").
  Claude macht das nicht immer von selbst — explizit sagen lohnt sich.
- ⚠️ **Speicherort-Falle:** Die Graph-Datei liegt aktuell im npx-Cache
  (`~/.npm/_npx/<hash>/node_modules/@modelcontextprotocol/server-memory/dist/memory.jsonl`),
  weil ECC kein `MEMORY_FILE_PATH` setzt. `npm cache clean` oder ein Versions-Bump des
  Servers kann sie **verwerfen**. Konsequenz: memory-MCP für **kompakte Schlüssel-Fakten**
  nutzen; langlebige Wahrheit gehört in `state/` und die Doku (beides in Git).

### 16.3 Modelle — was automatisch passiert und was du selbst tust

**Subagents: automatisch.** Jeder der 63 ECC-Agenten hat ein festes Modell im
Frontmatter seiner Definition (`model: sonnet` etc.). Du musst **nichts** wählen:
`planner`/`architect` laufen auf Opus, `doc-updater` auf Haiku, fast alle anderen
(Reviewer, Build-Resolver …) auf Sonnet. Ein `/code-review` spawnt also automatisch
einen Sonnet-Reviewer — egal, welches Modell deine Haupt-Session fährt.

**Haupt-Session: du.** Das Modell deiner Session wechselst du mit `/model` (oder
startest mit `claude --model …`). Deine Strategie:

| Situation | Modell |
|---|---|
| Standard (Coding, Review, Doku) | **Opus 4.8 (1M)** — dein Default, mit `/fast` schnell genug |
| Einfache, klar umrissene Aufgabe, Budget schonen | Sonnet 4.6 |
| Worker in Multi-Agent-Setups | Haiku 4.5 (setzen die Agents selbst) |
| Unsicher, was angemessen ist | `/model-route` fragen (empfiehlt Tier nach Komplexität/Risiko) |

**Wann wechseln?** Hoch zu Opus, wenn: erster Versuch gescheitert · 5+ Dateien betroffen ·
Architektur-Entscheidung · Security-kritisch. Runter zu Sonnet, wenn die Aufgabe klar
definiert und mechanisch ist. Effort-Level: `medium` Standard, `high` bei harten
Bugs/Architektur.

### 16.4 Der Workflow im Alltag (so sieht er wirklich aus)

```
Tagesstart        /start          (State-Sync PRE + rtk-Budget + Agenda + 1 Folgebefehl)
   │
Aufgabe > 30 min? ─ ja → vage/groß? ─ ja → /mega-plan <Ziel>  (4 Berater parallel)
   │                        └─ nein → /plan                    (wartet auf dein OK!)
   │ nein → direkt machen (aber Karpathy: erst denken, dann tippen)
   │
IMPLEMENT         /feature-dev + TDD (Tests ZUERST)
BUG?              reproduzieren + failing Test (ecc:tdd-workflow), DANN fixen
   │
REVIEW            /code-review (+ /python-review, /react-review …)
VERIFY            Tests/Build grün; rot → /build-fix → zurück
   │
Session-Ende      /save-session   (State-Sync POST läuft automatisch)
```

Merksatz: **Du tippst Commands, ECC orchestriert Agenten, Skills laden sich selbst,
Hooks passen im Hintergrund auf.**

### 16.5 Neue / bestehende Projekte — mit und ohne ECC

**Ohne Onboarding musst du NICHTS tun.** Das Plugin ist global: alle Commands, Agents,
Skills und MCPs funktionieren in jedem Ordner. Das globale Profil `minimal` sorgt nur
dafür, dass die schwere Hook-Pipeline (quality-gate, observe, governance) dort **nicht**
feuert — essenzielle Hooks (Session-Speicherung, Metriken, Kosten) laufen trotzdem.

**ECC-ready machen lohnt sich, wenn du regelmäßig dort arbeitest:** `/ecc-onboard`
(Dry-Run, ein OK) legt an: `.claude/rules/ecc/` + Skills passend zum Stack,
`PROJECT_RULES.md`, `state/`-Gedächtnis, State-Sync-Hooks und projekt-lokal
`ECC_HOOK_PROFILE=standard` → volle Pipeline nur dort. Danach: frische Session starten.

### 16.6 Token-Spar-Checkliste (Reihenfolge nach Wirkung)

1. **rtk läuft automatisch** (PreToolUse-Hook rewritet Bash-Befehle) — aktuell ~52 %
   Ersparnis auf 38 M Token. Budget prüfen: `rtk gain`.
2. **mgrep statt grep** für konzeptuelle Suche (`mgrep search "<konzept>"`) — ~50 %
   weniger Such-Token. Index vorher einmal manuell bauen (Outbound-Entscheidung!).
3. **Subagents lesen lassen:** Exploration/große Reads an Explore-Agents delegieren —
   nur die Zusammenfassung landet in deinem Kontext.
4. **`/compact` mit Hint bei > 40 % Kontext** („behalte: X, vergiss: Y") — nie
   Autocompact abwarten. `/clear` vor wirklich neuem Thema.
5. **context7 statt WebFetch** bei Library-Fragen — präziser, kürzer.
6. **markitdown für Office/PDF** statt Roh-Bytes lesen.
7. **MCP-Diät:** max. ~10 aktive Server / ~80 Tools — jedes geladene Tool-Schema kostet
   Kontext. Deshalb: abgelöste Plugins aus bleiben lassen.
8. **Modell-Tiering:** Subagents erledigen das automatisch (16.3); Haupt-Session bewusst
   wählen.

# Engineering Harness — ECC × BestPractice

> **Das fusionierte, VPS-weite Claude-Code-Harness — Bedienungsanleitung.**
> Global aktiv in `~/.claude` · ECC 2.0.0-rc.1 (core, führend) · RTK-sicher.
> Quelle/Re-Install: `/root/projekte/Claude Code BestPractice` → `./install-vps.sh`
>
> **Halte mich offen.** Dieses Dokument ist dein Nachschlagewerk neben dem Code: wann welcher Command, welches Modell, welcher MCP. Basiert auf den Guides von @affaanmustafa (X-Links am Ende).
>
> *Single Source ist diese Markdown-Datei (`docs/ECC-Harness-Guide.de.md`). Die Word-/PowerPoint-Snapshots werden daraus gebaut: `bestpractice-extras/scripts/build-docs/`. Stand: 2026-06-05.*

---

## 1 · Was ist dieses Harness?

Dieses Harness ist die Fusion zweier Systeme — mit klarem Fokus auf ECC:

- **ECC (Everything Claude Code)** von Affaan Mustafa — die dominante Engine: 63 Agents, 249 Skills, ~80 Commands, manifest-basierter Installer, Continuous Learning, Security-Scanning. Global installiert (core-Profil): 80 Commands, 63 Agents, 21 ECC-Skills, `rules/ecc` = common + 19 Sprach-/Domain-Packs; mehr Skills via `--profile full` (249).
- **BestPractice-Extras** — die wenigen einzigartigen Stärken deines alten Harness, die ECC ergänzen: `/ecc-onboard` (One-Shot-Projekt-Setup), das `state/`-Pattern, der State-Sync, die RPI-Berater und die Karpathy-Prinzipien.

**Philosophie in einem Satz:** „Konfiguration ist Fine-Tuning, nicht Architektur." Baue wiederverwendbare Muster, halte das Kontextfenster sauber, delegiere an das billigste ausreichende Modell, verifiziere mit Evidenz — und lass Komfort nie die Sicherheit überholen.

*Fünf Kernprinzipien (SOUL.md): Agent-First · Test-Driven · Security-First · Immutability · Plan-Before-Execute.*

## 2 · Setup & VPS-Architektur

ECC ist GLOBAL nach `~/.claude` installiert und damit in JEDEM Projekt auf der VPS aktiv (WMS, Jarvis, n8n, Werkstatt …). Die Installation ist bewusst additiv und namespace-sicher:

- **Namespace-sicher:** ECC liegt unter `rules/ecc/` und `skills/ecc/` — keine Kollision mit Eigenem.
- **RTK bleibt König:** Der globale `PreToolUse:Bash`-Hook (RTK, 60–90 % Token-Ersparnis) wurde NICHT angefasst.
- **Startup-Config additiv:** Der Installer lässt `settings.json`/`CLAUDE.md` unberührt. Bewusste Aufräum-Schritte (feature-dev-Plugin deaktiviert, context-mode entfernt) wurden separat mit Backup vorgenommen.
- **Reproduzierbar:** Quelle ist das Repo; Re-Install via `./install-vps.sh` (idempotent, mit Backup).

**Koexistenz mit deinem bestehenden Setup:**

| Dein Tool | ECC-Pendant | Empfehlung |
| --- | --- | --- |
| superpowers | tdd-workflow, verification-loop … | Beides nutzbar; bei Doppelung ECC bevorzugen |
| claude-mem | /save-session, continuous-learning-v2 | primäre Memory-Quelle; injiziert Kontext automatisch |
| RTK | Token-Ökonomie (§10) | Ergänzen sich: RTK auf Bash-, ECC auf Workflow-Ebene |
| codex / superpowers | diverse Skills/Agents | eigenständiger Mehrwert; bleiben aktiv |

**Aufgeräumt:** feature-dev existierte 3-fach — die ECC-Version ist kanonisch, das gleichnamige Plugin wurde deaktiviert. RPI als Plugin wurde entfernt (durch die schlanken Schicht-2-RPI-Berater ersetzt). Bei Namens-Zweifeln eindeutige ECC-Commands nutzen (`/harness-audit`, `/ecc-guide`, `/ecc-onboard`, `/instinct-status`).

## 3 · Mentales Modell — die Bausteine

| Baustein | Was es ist | Wo (global) | Lebensdauer |
| --- | --- | --- | --- |
| Skills | Durable Kern: wiederverwendbare Workflow-Bündel, laden on-demand | ~/.claude/skills/ecc/ | langlebig |
| Commands | Slash-Einstiegspunkte (/plan, /code-review …) | ~/.claude/commands/ | Komfort-Schicht |
| Subagents | Delegierbare Spezialisten mit eigenem Tool-Scope | ~/.claude/agents/ | pro Aufgabe |
| Hooks | Trigger-Automatik an Lifecycle-Events (s. §14) | ~/.claude/hooks/ | event-gebunden |
| Rules | „Immer befolgen"-Leitlinien je Sprache | ~/.claude/rules/ecc/ | dauerhaft |
| MCP | Prompt-getriebene Wrapper um externe Dienste | .mcp.json / global | pro Session |
| Instincts | Gelernte Muster aus deinen Sessions | homunculus/instincts/ | wächst mit dir |

**Wichtigste Regel:** Die durable Logik gehört in Skills. Commands sind nur der bequeme Einstieg. Was du zum dritten Mal tippst → mach eine Skill draus (`/skill-create`).

## 4 · Agent- & Skill-Katalog

**63 Agents insgesamt — die wichtigsten:**

**Core-Workflow:** planner (Plan vor Code) · architect / code-architect (System-Design) · code-explorer (Codebase tracen) · tdd-guide (Tests zuerst) · code-reviewer (Qualität) · security-reviewer (OWASP / Secrets) · build-error-resolver (Build grün) · refactor-cleaner (toter Code raus) · e2e-runner (kritische Flows) · doc-updater (Doku-Sync) · performance-optimizer (Hot-Paths) · silent-failure-hunter (verschluckte Fehler)

**Sprach-Reviewer:** python-reviewer · typescript-reviewer · react-reviewer · go-reviewer · rust-reviewer · cpp-reviewer · java-reviewer · kotlin-reviewer · swift-reviewer · csharp-reviewer · fsharp-reviewer · django-reviewer · fastapi-reviewer · flutter-reviewer

**Build-Resolver:** go-build-resolver · rust-build-resolver · cpp-build-resolver · java-build-resolver · kotlin-build-resolver · swift-build-resolver · dart-build-resolver · django-build-resolver · react-build-resolver · pytorch-build-resolver

**Spezial:** database-reviewer · a11y-architect · type-design-analyzer · comment-analyzer · gan-planner / generator / evaluator · harness-optimizer · marketing-agent · seo-specialist · network-architect · docs-lookup · mle-reviewer

**21 ECC-Skills (core-Profil) — gruppiert:**

| Gruppe | Skills |
| --- | --- |
| Workflow / Qualität | tdd-workflow · verification-loop · plankton-code-quality · production-audit · eval-harness · council · error-handling |
| Codebase / Recherche | code-tour · iterative-retrieval · skill-scout · skill-stocktake |
| Testing | e2e-testing · ai-regression-testing · windows-desktop-e2e |
| Lernen / Memory | continuous-learning(-v2) · strategic-compact · agent-introspection-debugging |
| Setup / Automatik | configure-ecc · hookify-rules · agent-sort |

**Mehr verfügbar:** Mehr (249 Skills) via `./install-vps.sh --profile full`. claude-mem (mem-search, smart-explore) + superpowers koexistieren.

## 5 · Täglicher Workflow — die 5-Phasen-Pipeline

Der Erfinder arbeitet in klaren Phasen, mit `/clear` dazwischen und Zwischenergebnissen in Dateien (statt alles im Kontext zu halten):

| Phase | Schritt | Output |
| --- | --- | --- |
| 1 · RESEARCH | Explore-Agent / claude-mem | research.md |
| 2 · PLAN | /plan (wartet auf dein OK!) | plan.md |
| 3 · IMPLEMENT | /feature-dev + Skill tdd-workflow | Code + Tests |
| 4 · REVIEW | /code-review (+ /\<sprache\>-review) | review.md |
| 5 · VERIFY | Tests/Build (+ /build-fix) | grün, sonst zurück zu Phase 3 |

- Jeder Schritt: ein klarer Input, ein klarer Output (in Datei speichern).
- Outputs werden Inputs der nächsten Phase. Phasen nicht überspringen.
- `/clear` zwischen großen Phasen — Explorations-Kontext ist für die Umsetzung irrelevant.
- Subagents immer objektiven Kontext mitgeben, nicht nur die Frage.

## 6 · Onboarding & Codebase einmal erkunden (Codemaps)

Die teuerste Verschwendung ist, die Codebase in jeder Session neu zu durchsuchen. ECC-Prinzip: EINMAL erkunden, das Ergebnis in Dateien festhalten, danach immer die kompakte Karte lesen statt den ganzen Code. Drei Ebenen:

### a) Projekt ECC-ready machen — /ecc-onboard (einmalig je Projekt)

Ein Command, ein OK: erkennt den Stack, installiert ECC project-level und legt persistente Projekt-Dateien an, die Claude künftig zuerst liest.

| Schritt | Was passiert | Ergebnis (persistent) |
| --- | --- | --- |
| 1 · Detect | Stack aus package.json / go.mod / pyproject.toml … erkennen | Profil + Sprach-Packs |
| 2 · Dry-Run | install-apply --target claude-project --dry-run | Plan ohne Schreiben |
| 3 · Bestätigung | 1× OK des Users | Freigabe |
| 4 · Install | install-apply --target claude-project | .claude/rules/ecc/ + skills/ecc/ |
| 5 · Kontext | Templates mit echten Werten füllen | PROJECT_RULES.md + state/* |

*Aus dem Zielprojekt-Verzeichnis ausführen (Install landet im aktuellen cwd). Idempotent: erneut ausführen merged, überschreibt nichts blind.*

### b) Architektur kartieren — /update-codemaps (KERN-FEATURE)

Scannt die Struktur EINMAL und schreibt token-arme Architektur-Karten auf Platte. In späteren Sessions liest Claude die kompakte Karte (billig) statt die ganze Codebase neu zu durchsuchen.

| Datei (in docs/CODEMAPS/) | Inhalt |
| --- | --- |
| architecture.md | System-Diagramm, Service-Grenzen, Datenfluss |
| backend.md | Routes → Controller → Service → Repository |
| frontend.md | Page-Tree, Komponenten-Hierarchie, State-Flow |
| data.md | Tabellen, Relationen, Migrations-Historie |
| dependencies.md | externe Dienste, Third-Party-Integrationen |

**Wann neu bauen?** Codemaps sind ein Snapshot — sie aktualisieren sich nicht von selbst. Nach größeren Architektur-Änderungen `/update-codemaps` erneut laufen lassen. Erstes Mal in einem fremden Repo: code-tour-Skill bzw. claude-mem smart-explore/learn-codebase erzeugen Touren/Struktur.

### c) Pro Aufgabe recherchieren — research.md-Pattern

- **Phase-1-Output in Datei:** Ein Explore-/code-explorer-Agent kartiert die für DIE Aufgabe relevanten Dateien/Muster → research.md. Das wird Input für `/plan`.
- **code-tour (optional):** Erzeugt wiederverwendbare .tour-Dateien (öffnen direkt Datei+Zeile) — ideal für Onboarding oder Architektur-Walkthroughs.
- **claude-mem ergänzt:** Injiziert relevanten Kontext aus früheren Sessions ab der 2. Session automatisch. `/mem-search` für gezielte Treffer („schon mal gelöst?").

**Die Regel dahinter:** „In Dateien speichern, nicht im Kopf behalten." research.md → plan.md → review.md, dazwischen `/clear`. Codemaps + PROJECT_RULES.md + state/ sind die dauerhafte Landkarte; der Chat-Kontext bleibt schlank.

## 7 · Playbook — Von 0 auf Feature (durchgespielt)

Kapitel 5–6 erklären die Phasen und das Onboarding einzeln. Hier laufen sie als EIN durchgehender Ablauf zusammen: zwei Startpunkte, ein Feature von Anfang bis grün, dann der tägliche Rhythmus.

### a) Zwei Startpunkte — leeres Projekt ODER bestehende Codebase

**Leeres Projekt (greenfield) — bei null anfangen:**

```
mkdir mein-projekt && cd mein-projekt && git init
claude                 # Claude Code IN diesem Ordner starten
/ecc-onboard           # Stack-Frage → 1x OK → .claude/rules+skills, PROJECT_RULES.md, state/
/plan Baue <Feature X> # erster Plan — wartet auf dein OK
```

**Bestehende Codebase übernehmen — fremden Code zähmen:**

```
git clone <repo> && cd <repo>
claude
/ecc-onboard           # erkennt Stack aus package.json / go.mod / pyproject.toml …
/update-codemaps       # EINMAL kartieren → docs/CODEMAPS/* (danach Karte statt Volltext)
code-tour · smart-explore  # geführte Tour / Struktur-Suche bei fremdem Code
```

**Einmal, nicht jedes Mal:** `/ecc-onboard` und `/update-codemaps` laufen pro Projekt EINMAL. Das Ergebnis ist persistent (Dateien) — jede Folge-Session startet mit der kompakten Karte.

### b) Ein Feature von Anfang bis Ende — Beispiel: neuer /api/search-Endpoint

Eine Aufgabe, fünf Phasen, je ein Datei-Output, `/clear` dazwischen, billigstes ausreichendes Modell:

| Phase | Du tippst | Modell | Output (Datei) |
| --- | --- | --- | --- |
| 1 · RESEARCH | Explore-Agent: Routing/Handler/Tests kartieren (+ claude-mem) | Haiku | research.md |
| — /clear — | Explorations-Kontext ist für die Umsetzung irrelevant | — | — |
| 2 · PLAN | /plan /api/search: Query → Filter → Paginierung, Tests zuerst | Opus | plan.md (wartet auf OK) |
| 3 · IMPLEMENT | /feature-dev plan.md umsetzen (Skill tdd-workflow) | Sonnet→Opus | Code + Tests (RED→GREEN) |
| 4 · REVIEW | /code-review (+ /python-review / /go-review …) | Opus | review.md |
| 5 · VERIFY | Tests/Build grün? sonst /build-fix → zurück zu Phase 3 | Sonnet | grün → commit / PR |

**Konkret getippt (copy-paste-tauglich):**

```
# Phase 1 — Research (Output in Datei, nicht im Kopf)
Explore-Agent: kartiere vorhandenes Routing/Handler/Tests für Suche → research.md
/clear
# Phase 2 — Plan (wartet auf dein OK)
/plan Neuer Endpoint /api/search: Volltext-Query, Filter, Paginierung; Tests zuerst. Quelle: research.md
/clear
# Phase 3 — Implement (TDD: erst RED, dann GREEN)
/feature-dev Setze plan.md um — Tests zuerst
# Phase 4 — Review
/code-review   # + /python-review bzw. /<sprache>-review für die geänderten Dateien
# Phase 5 — Verify
/build-fix     # nur falls Build/Tests rot — sonst committen
/save-session  # Stand sichern (für morgen)
```

### c) Der tägliche Rhythmus

| Wann | Was du tust | Warum |
| --- | --- | --- |
| Session-Start | /start · claude-mem injiziert Kontext (ab 2. Session) · rtk gain | nahtlos weiter, wo du warst |
| Vor großer Aufgabe | /resume-session · /mem-search „schon gelöst?" | Alt-Wissen nutzen statt neu lösen |
| Während | in Phasen arbeiten · /clear zwischen Phasen · /checkpoint | Kontext schlank, billiges Modell |
| Nebenfrage | /aside (oder /fork) | Haupt-Task-Kontext nicht verlieren |
| Session-Ende | /learn-eval → /evolve → /promote · /save-session | ECC lernt — morgen schneller |

**Der Loop, der ECC ausmacht:** Was du zum 3. Mal tippst → `/skill-create`. Bewährte Muster → `/promote` (global). So wirst du mit jeder Session schneller — genau das trennt ECC von „nur Configs".

## 8 · Cheat-Sheet — wann welcher Command

| Situation | Command | Zweck |
| --- | --- | --- |
| Tagesstart | /start | frischer Kontext aus state/ + rtk-Budget + 1 Folgebefehl |
| Neues Feature planen | /plan | Anforderungen, Risiken, Schritte — wartet auf dein OK |
| Vages/vielschichtiges Ziel | /mega-plan | RPI-Berater parallel → Briefing → /plan |
| Feature umsetzen | /feature-dev | nutzt Skills/Agents, TDD zuerst |
| Bug | /systematic-debugging | Root-Cause vor Fix |
| Projekt ECC-ready machen | /ecc-onboard | Stack erkennen → 1× OK → Rules/Skills + PROJECT_RULES.md + state/ |
| Codebase kartieren (1×) | /update-codemaps | token-arme Architektur-Karten in docs/CODEMAPS/ |
| Code geschrieben | /code-review (+ /python-review …) | Qualität + Security der Änderungen |
| Build/Tests rot | /build-fix | inkrementelle, minimale Fixes |
| Coverage / Qualität | /test-coverage · /quality-gate | Lücken finden, Pipeline prüfen |
| Aufräumen | /refactor-clean | toter Code + lose Dateien raus |
| Library-Doku live | context7-MCP · docs-lookup-Agent | aktuelle API-Doku statt Halluzination |
| Session sichern/laden | /save-session · /resume-session · /sessions | über den Tag hinaus arbeiten |
| Gelerntes extrahieren | /learn-eval → /evolve → /promote | Self-Improvement-Loop |
| Modell / Kosten | /model-route · /cost-report | billigstes ausreichendes Modell |
| Harness prüfen | /harness-audit · /ecc-guide | Config-Scorecard / Onboarding |
| Parallel / Loop | /multi-plan · /loop-start · /loop-status | mehrere Modelle / Automation |

Sprach-spezifisch: `/go-build|review|test`, `/rust-*`, `/cpp-*`, `/kotlin-*`, `/react-*`, `/flutter-*`, `/python-review`, `/fastapi-review`. PRP-Pipeline: `/prp-prd → /prp-plan → /prp-implement → /prp-commit → /prp-pr`.

## 9 · Wann welcher MCP

Faustregel: 20–30 MCPs konfiguriert, aber < 10 aktiv / < 80 Tools. Ungenutztes pro Projekt mit `/mcp` deaktivieren — das Kontextfenster ist kostbar.

**Bei dir aktiv (global):**

| Aufgabe | MCP / Tool | Hinweis |
| --- | --- | --- |
| PDF/Word/Excel/PPTX lesen | markitdown | Dokumente → Markdown (lokal, global aktiv) |
| Aktuelle Library-/API-Doku | context7 | React, Prisma, Next.js … statt veraltetem Wissen (Plugin) |
| Frühere Arbeit / „schon gelöst?" | claude-mem | deine Memory-Quelle: /mem-search, Auto-Injektion ab 2. Session |
| Dienste anbinden | claude.ai-Connectoren | n8n · Notion · Gamma · Google Drive · Microsoft Learn · Kiwi |
| Bash-Token sparen | RTK (Hook, kein MCP) | 60–90 % Ersparnis, läuft transparent global |
| Semantische Code-/Doku-Suche | mgrep (CLI/Skill, kein MCP) | ~50 % weniger Token als grep — Details in §15 |

**Optional / empfohlen — NICHT installiert, bei Bedarf nachrüsten:**

| Aufgabe | MCP / Tool | Hinweis |
| --- | --- | --- |
| Web-Recherche / Discovery | exa | breite Suche, wenn GitHub+Docs nicht reichen |
| GitHub (PRs, Issues, Code-Suche) | github | du nutzt die gh-CLI statt MCP |
| Browser / E2E / Screenshots | playwright | headless Automation, visuelle Tests |
| Strukturierter Wissensgraph | memory | NICHT nötig, claude-mem deckt das ab |
| Schrittweises Reasoning | sequential-thinking | komplexe Mehrschritt-Probleme (s. §15) |

**Memory-Klarstellung:** Der „memory"-MCP (Wissensgraph) ist NICHT installiert und nicht nötig — claude-mem ist deine primäre Memory-Quelle (§11). EINE Quelle pro Projekt, sonst doppelte Wahrheit.

## 10 · Token-Ökonomie & Modellstrategie

Billigstes ausreichendes Modell pro Aufgabe — das ist die Subagent-Architektur:

| Aufgabe | Modell | Warum |
| --- | --- | --- |
| Exploration / Suche / einfache Edits / Doku | Haiku 4.5 | schnell, billig, reicht zum Finden |
| Standard-Coding / Multi-File / PR-Review | Sonnet 4.6 | bestes Balance-Modell (90 % der Tasks) |
| Komplexe Architektur / Security-Analyse | Opus 4.8 (1M) | tiefes Reasoning, darf nichts übersehen |
| Hartnäckige Bugs (5+ Dateien, 1. Versuch scheiterte) | Opus 4.8 (1M) | ganzes System im Kopf halten |
| Worker in Multi-Agent-Setup | Haiku 4.5 | viele günstige Parallel-Agents |

**Default-Praxis:** Opus 4.8 (1M) ist als Standard tragbar (schnell genug via `/fast`); für klar abgegrenzte Routinearbeit auf Sonnet 4.6 herabstufen. Effort-Level: `medium` Standard, `high` bei schweren Bugs/Architektur. Hilfe: `/model-route`, `/cost-report`.

**Agenten-Zuweisungen (Default):** security-reviewer → Opus (darf nichts übersehen) · architect, planner → Opus · code-reviewer, tdd-guide, build-error-resolver → Sonnet · doc-updater, code-tour → Haiku.

**Upgrade auf Opus wenn:** erster Versuch scheiterte · Aufgabe umfasst 5+ Dateien · Architekturentscheidung · Security-kritischer Code.

- Strategisches Compacting: Auto-Compact aus, manuell `/compact` mit Hint an logischen Punkten.
- Modulare Dateien (hunderte statt tausende Zeilen) → bessere First-Try-Trefferquote.
- `/refactor-clean` nach langen Sessions.

## 11 · Memory & Sessions

**claude-mem ist deine primäre, persistente Memory-Quelle:**

- **Automatisch:** injiziert relevanten Kontext aus früheren Sessions ab der 2. Session je Projekt — ohne Zutun.
- **/mem-search „…":** gezielt frühere Arbeit finden („schon gelöst?", „wie haben wir X gemacht?").
- **Erfasst von selbst:** Beobachtungen/Entscheidungen werden automatisch gespeichert — kein manuelles Speichern.

**Sessions explizit sichern/laden (ECC-Commands, ergänzend):**

| Command | Zweck |
| --- | --- |
| /save-session | Stand nach ~/.claude/session-data/ sichern |
| /resume-session | letzte Session laden & weitermachen |
| /sessions | Historie durchsuchen/verwalten |
| /checkpoint | Checkpoint im laufenden Lauf |
| /aside | Nebenfrage ohne Kontextverlust |

Gute Session-Datei: Was funktioniert hat (mit Evidenz) · Was nicht ging · Was offen ist. **EINE Memory-Quelle:** claude-mem ist gesetzt — den generischen „memory"-MCP NICHT zusätzlich aktivieren. Keine Secrets in Memory.

## 12 · Continuous Learning (Self-Improvement)

Das unterscheidet ECC von „nur Configs": es lernt aus deinen Sessions.

| Command | Zweck |
| --- | --- |
| /learn | Muster aus der Session extrahieren |
| /learn-eval | extrahieren + Qualität selbst bewerten |
| /evolve | Instincts analysieren → bessere Skill-Struktur |
| /promote | Projekt-Instincts global befördern |
| /instinct-status | alle Instincts mit Confidence-Score |
| /skill-create | aus Git-History eine Skill generieren |

Routine: Session-Ende → `/learn-eval` → bei guten Mustern `/evolve` → Bewährtes mit `/promote` global verfügbar machen.

## 13 · Parallelisierung

- **/fork** — Konversation forken für nicht-überlappende Nebenaufgaben (Fragen zur Codebase).
- **Git-Worktrees** — für überlappende parallele Arbeit ohne Konflikte; eigene Claude-Instanz je Worktree.
- **Cascade-Methode** — neue Tasks in neuen Tabs, alt→neu abarbeiten, max. 3–4 gleichzeitig.
- **ECC-Multi-Model** — `/multi-plan`, `/multi-workflow`, `/multi-backend`, `/multi-frontend`, `/loop-start`.

```
git worktree add ../feature-a feature-a
cd ../feature-a && claude   # eigene Instanz
```

## 14 · Hooks — was bei dir aktiv ist

Hooks sind kleine Programme, die **von selbst** an Lifecycle-Events feuern (vorher prüfen/blockieren, nachher aufräumen/formatieren/protokollieren). Wichtig zu wissen: Die ECC-`hooks.json` enthält 20+ Hooks, aber das ECC-`plugin.json` registriert **keine** Hooks automatisch — sie wurden gezielt in `~/.claude/settings.json` aktiviert.

**Global aktiv (`~/.claude/settings.json`):**

| Hook-Typ | IDs | Zweck |
| --- | --- | --- |
| PostToolUse | post:quality-gate · post:edit:accumulator · post:edit:console-warn | Quality-Gate nach Edit/Write · Sammel-Formatierung merken · console.log warnen |
| Stop | stop:format-typecheck · stop:check-console-log · stop:session-end | Format+Typecheck · console.log prüfen · Session sichern |
| SessionStart | session:start (Bootstrap) | vorigen Kontext laden, Paketmanager erkennen |
| PreCompact | pre:compact | State sichern vor Kontext-Kompaktierung |

**Projekt-lokal aktiv (`.claude/settings.json`) — State-Sync (Schicht 2):**

| Event | Aufruf | Zweck |
| --- | --- | --- |
| SessionStart | state-sync.js pre | state/ → WORKING-CONTEXT.md spiegeln (Loop hat sofort Kontext) |
| Stop / PreCompact | state-sync.js post | Delta zurück nach state/progress.md + tasks.md |

**Bewusst abgeschaltet:** `pre:bash:gateguard-fact-force` und `pre:edit-write:gateguard-fact-force` (GateGuard) via `ECC_DISABLED_HOOKS` — würden die erste Änderung pro Datei blockieren und Recherche erzwingen (beim normalen Arbeiten störend). Hook-Profil bleibt `standard`: alle nützlichen Hooks laufen weiter; `strict` brächte nur drei zusätzliche Nag-Erinnerungen (tmux, git-push, commit-quality).

**Profil-Steuerung (env in settings.json):** `ECC_HOOK_PROFILE` (minimal/standard/strict) · `ECC_DISABLED_HOOKS` (gezielt abschalten) · `ECC_GOVERNANCE_CAPTURE=1` (Governance-Hooks scharf).

## 15 · Power-Tools — mgrep, LSP, Sequential Thinking

Schicht-2-Werkzeuge, die den Alltag beschleunigen. Kein ECC-Core.

### mgrep — semantische Suche (~50 % weniger Token)

`@mixedbread/mgrep` ersetzt grep/ripgrep durch **semantische** Suche: findet Code/Doku nach **Konzept** („wie werden Agent-Modelle zugewiesen?") statt nach exaktem Muster. **Status: verankert** (Schicht-2).

- **Einrichtung (einmalig):** CLI `npm install -g @mixedbread/mgrep`; API-Key (`mxb_…`) auf platform.mixedbread.com erzeugen; im `env`-Block von `~/.claude/settings.json` als `MXBAI_API_KEY` hinterlegen (user-scoped, **nicht** im Repo — headless-Weg, umgeht den interaktiven Browser-Login).
- **Index bauen/aktualisieren:** `bash bestpractice-extras/scripts/mgrep/index.sh` — liest den Key, setzt das Datei-Limit, startet `mgrep watch`; nach dem initialen Sync mit Ctrl+C beenden (Store bleibt durchsuchbar).
- **Suchen:** `mgrep search "consumer scaffold onboarding"` — konzeptuell, auch in `.docx`.
- **⚠️ Outbound:** `index.sh` lädt den Quellbaum in die Mixedbread-Cloud. Pro Repo eine bewusste Entscheidung; `.gitignore` wird respektiert. Der Auto-Mode blockt den Bulk-Upload absichtlich (Exfiltrations-Schutz) — deshalb manuell über das Script, nie automatisch durch Claude. Details: `bestpractice-extras/scripts/mgrep/README.md`.

### LSP-Plugins — Echtzeit-Typecheck im Terminal

`typescript-lsp` + `pyright-lsp` (user-scoped installiert) bringen Echtzeit-Typecheck und go-to-definition ins Terminal — ohne IDE.

### Sequential Thinking (MCP)

Registriert als deferred Tool (`mcp__plugin_ecc_sequential-thinking__sequentialthinking`). Einsatz: komplexe Mehrschritt-Probleme, Architektur-Entscheidungen mit vielen Abhängigkeiten, Debugging verschachtelter Systeme. Tool via ToolSearch laden, dann aufrufen.

## 16 · Security im Alltag + VPS-Hinweise

Kernhaltung: Baue so, als würde das Modell irgendwann etwas Feindliches lesen, während es etwas Wertvolles hält (lethal trifecta: private Daten + untrusted Content + externe Kommunikation).

**Bereits aktiv / sicher:**

- **RTK-Hook** (`PreToolUse:Bash`) bleibt unangetastet — Token-Ersparnis global.
- **ECC namespace-sicher** (`rules/ecc/`, `skills/ecc/`) — keine Kollision mit Eigenem.
- **settings.json unberührt** — kein Auto-Edit der Startup-Config; Härtung nur additiv via `./install-vps.sh --harden`.

**Bewusst NICHT automatisch (Least-Agency, opt-in):**

- **deny-Baseline opt-in** — `./install-vps.sh --harden` ergänzt rm -rf / force-push / Secret-Reads (mit Backup).
- **AgentShield** — `npx ecc-agentshield scan` lädt externes Paket — selbst vetten, dann ausführen.
- **mgrep-Upload** — manuell, nie automatisch (s. §15).

**VPS-weit denken:** Da ECC global ist, wirkt es in allen Produktionsprojekten. Härtung gezielt via `./install-vps.sh --harden` (legt vorher ein settings.json-Backup an).

## 17 · CLAUDE.md — Arbeitsvertrag statt Beschreibung

**Erkenntnis aus dem Test-ECC-Onboarding:** CLAUDE.md ist KEIN Projektbeschrieb. Es ist der **Arbeitsvertrag für Claude**: Workflow, Verbote, Commands, Checklisten.

| Was rein muss | Was NICHT rein soll |
| --- | --- |
| Pflicht-Workflow (ECC 5-Phasen) | Projektbeschreibung (→ README / PROJECT_RULES.md) |
| Explizite Verbote (was Claude nicht tun darf) | Architektur-Details (→ docs/CODEMAPS/) |
| Modell-Matrix (welches Modell wofür) | Generische Platzhalter wie [Stack noch nicht konfiguriert] |
| Build/Test/Lint-Commands (copy-paste-tauglich) | |
| Pflicht-Commands pro Situation, Token-Budget-Regeln | |
| Sicherheits-Checkliste, Hook-Status (welche aktiv) | |

## 18 · ECC-CLIs & Wartung

```
cd "/root/projekte/Claude Code BestPractice/ecc"
node scripts/ecc.js doctor          # Health-Check (claude-home: OK)
node scripts/ecc.js list-installed  # was ist installiert
node scripts/ecc.js repair          # ECC-Dateien wiederherstellen
npx ecc consult "security reviews"  # Advisor: welche Komponenten?

# Re-Install / Update VPS-weit:
cd "/root/projekte/Claude Code BestPractice" && ./install-vps.sh
```

Slash-Einstieg: `/ecc-guide` (Onboarding), `/harness-audit` (Config-Scorecard), `/cost-report`, `/skill-health`, `/projects`.

## 19 · Hybrid-Mega-Workflow — State-Sync + RPI-Berater

Der BestPractice-Wrapper koppelt persistenten Projekt-State an ECCs Loop und stellt `/mega-plan` als Planungs-Vorstufe bereit — rein additiv. Der ECC-Core (`ecc/`) bleibt unverändert.

### a) Wo wird was gespeichert

| Artefakt | Ort | Wahrheit? |
| --- | --- | --- |
| State (4 Dateien) | state/{context,decisions,tasks,progress}.md | JA — vom Menschen |
| Loop-Futter | <root>/WORKING-CONTEXT.md (generiert) | Nein — aus state/ |
| Sync-Snapshot | state/.sync/last-working-context.md | Nein — gitignored |
| Karpathy (global) | ~/.claude/rules/ecc-extras/ + @-Import | JA — einmalig |

**Merksatz:** state/ ist die Wahrheit. WORKING-CONTEXT.md ist nur ihr generiertes Spiegelbild für den Loop — nie von Hand pflegen, immer state/ editieren.

### b) Der Sync-Loop (PRE/POST, via Lifecycle-Hooks)

```
state/*.md  --PRE (SessionStart)-->  WORKING-CONTEXT.md   (Loop liest STATE:*, füllt SYNC:*)
WORKING-CONTEXT.md  --POST (Stop/PreCompact)-->  state/progress.md + tasks.md  (nur Delta)
```

- **PRE:** generiert WORKING-CONTEXT.md aus state/; STATE:*-Blöcke gespiegelt, SYNC:*-Eingabezonen bleiben erhalten.
- **POST:** liest nur die SYNC:*-Zonen, bildet das Delta gegen den Snapshot, hängt neue Zeilen verlustfrei an state/ an.
- **Garantien:** Marker (kein Clobbering) · atomar · idempotent · No-op- & ECC-Guard · Exit 0. Test: `selftest.js` (7 Checks).

### c) /mega-plan — RPI-Berater parallel vor /plan

Für vage/vielschichtige Ziele: holt mehrere read-only Experten-Perspektiven parallel ein, verdichtet sie zu einem Briefing und übergibt an ECCs `/plan` (führend).

| Berater | Perspektive |
| --- | --- |
| Intake (requirement-parser) | Anforderungen, Constraints, offene Fragen |
| CTO | Technik-Strategie, Architektur-Fit, Risiko |
| Product | Scope, Requirements, Akzeptanzkriterien |
| UX | Flows, States, Accessibility |

```
/mega-plan <Ziel in einem Satz>     # Berater parallel → Briefing → /plan
/plan                               # ECC, wartet auf dein OK
/feature-dev → /code-review → Verify # normaler ECC-5-Phasen-Flow
```

**ECC-Core unberührt:** Alles liegt in `bestpractice-extras/`. `git diff` zeigt keine Änderung unter `ecc/`. Tiefe Doku: `docs/MEGA-WORKFLOW.de.md`.

## 20 · Aktivierungs-Status & behobene Bugs (Stand 2026-06-05)

Das BestPractice-Repo selbst ist **onboardet** und die Schicht-2-Mechanik ist **scharf**:

- **State-Sync aktiv (Variante A, projekt-lokal):** `.claude/settings.json` enthält additiv `SessionStart→pre`, `Stop→post`, `PreCompact→post` (Aufruf `bestpractice-extras/scripts/state-sync/state-sync.js`). Der `ecc/`-Schreibguard bleibt unberührt. `state/{context,decisions,progress,tasks}.md` ist befüllt, `WORKING-CONTEXT.md` wird beim Session-Start aus state/ gespiegelt.
- **Globale `ecc-onboard.md`-Drift behoben:** war veraltet (6,3 K ohne Schritt 4b/4c); jetzt = Repo-Version (13 K mit State-Sync-Verdrahtung + consumer-scaffold).
- **Global gelayerte Extras erweitert:** rpi-Advisors (`~/.claude/agents/`), `attribution-policy.md` (`~/.claude/rules/ecc-extras/`), Dynamic-Context-Profile `contexts/{dev,review}.md` (`~/.claude/contexts/`). `install-vps.sh` deployt das künftig automatisch.
- **mgrep + LSP verankert:** mgrep als Schicht-2-Tool (MXBAI_API_KEY, `index.sh`); LSP-Plugins `typescript-lsp` + `pyright-lsp` user-scoped installiert.
- **Unberührt:** ECC-Core (`git status -- ecc/` leer), RTK-Hook (`PreToolUse:Bash` global), globale ECC-Lifecycle-Hooks.

**Behobene Bugs:**

- **`/ecc-onboard` install-plan.js vs install-apply.js (behoben 2026-06-03):** `install-plan.js` übergab kein `projectRoot` → Install landete im ECC-Repo statt im Zielprojekt. Fix: für Dry-Run immer `node "$ECC_REPO/scripts/install-apply.js" --target claude-project --profile <profil> --dry-run` aus dem Zielprojekt-Root.
- **Attribution-Policy (Schicht-2-Override):** Co-Authorship ist für dieses Setup AKTIV (Commits enden mit `Co-Authored-By:`); der Upstream-Hinweis „Attribution disabled globally" im vendored Core gilt hier bewusst nicht.

## 21 · Quellen & TL;DR

**Original-Guides von @affaanmustafa** (als X-Threads veröffentlicht; lokal im Repo unter `ecc/`):

- **Shortform-Guide:** https://x.com/affaanmustafa/status/2012378465664745795 (`ecc/the-shortform-guide.md`) — Setup & Philosophie
- **Longform-Guide:** https://x.com/affaanmustafa/status/2014040193557471352 (`ecc/the-longform-guide.md`) — Token, Memory, Evals, Parallelisierung
- **Security-Guide:** https://x.com/affaanmustafa/status/2033263813387223421 (`ecc/the-security-guide.md`) — Agent-Security, Pflichtlektüre
- **Erfinder:** https://x.com/affaanmustafa (@affaanmustafa)

**TL;DR — so arbeitest du „wie der Erfinder":**

- In Phasen denken: Research → /plan → /feature-dev+TDD → /code-review → Verify, `/clear` dazwischen.
- Kontext sauber: < 10 MCPs aktiv, billigstes ausreichendes Modell, modulare Dateien, strategisch compacten.
- Persistieren: /save-session am Ende, /start bzw. /resume-session am Anfang.
- Lernen lassen: /learn-eval → /evolve → /promote.
- Security zuerst: RTK aktiv, ECC-Hooks/AgentShield bewusst aktivieren, nie blind ausführen.
- Bei Unsicherheit: /ecc-guide, `ecc doctor`, die drei Original-Guides.

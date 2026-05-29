# ECC-Workflow-Guide (Deutsch)

> **Dein persönlicher Leitfaden, um in `/root/projekte/ECC` genauso zu arbeiten wie der Erfinder
> von ECC (Affaan Mustafa, @affaan / „cogsec").**
> Dieser Guide ist die Brücke zwischen dem rohen Repo-Code und deinem Alltag. Die drei
> Original-Guides im Repo sind die Tiefen-Doku — dieser Guide ist die auf *dein* Setup
> zugeschnittene Bedienungsanleitung.

**Original-Quellen (liegen lokal im Repo):**
- `the-shortform-guide.md` — Setup & Philosophie
- `the-longform-guide.md` — Token-Ökonomie, Memory, Evals, Parallelisierung
- `the-security-guide.md` — Agent-Security (Pflichtlektüre)

**Status deiner Installation:** ECC `2.0.0-rc.1`, Profil **`developer`**, **projektlokal** in
`/root/projekte/ECC/.claude/` (79 Skills, 82 Commands, 63 Agents, 20 Sprach-Rule-Packs, Hooks).
Wirkt **nur**, wenn Claude Code in diesem Ordner läuft. Dein globales Setup ist unberührt.

---

## 0. Die ECC-Philosophie in einem Satz

> **Konfiguration ist Fine-Tuning, nicht Architektur.** Baue wiederverwendbare Muster (Skills,
> Commands, Agents, Planungs-Pipelines), halte das Kontextfenster sauber, delegiere an das
> billigste ausreichende Modell, verifiziere alles mit Evidenz — und lasse die Bequemlichkeits-Ebene
> niemals die Isolations-Ebene überholen (Security).

Die fünf Kernprinzipien (aus `SOUL.md`): **Agent-First · Test-Driven · Security-First ·
Immutability · Plan-Before-Execute.**

---

## 1. Das mentale Modell — die Bausteine von ECC

| Baustein | Was es ist | Wo bei dir | Lebensdauer |
|---|---|---|---|
| **Skills** | Der **durable** Kern: wiederverwendbare Workflow-Bündel (Prompt + Struktur + Beispiele + ggf. Codemaps). Laden **on-demand**. | `.claude/skills/ecc/<name>/SKILL.md` (79 Stück) | langlebig |
| **Commands** | Slash-Einstiegspunkte (`/plan`, `/code-review` …). ECC sieht sie als **Legacy-Shims** über den Skills. | `.claude/commands/<name>.md` (82 Stück) | Komfort-Schicht |
| **Subagents** | Delegierbare Spezialisten mit eigenem Tool-Scope; laufen im Hintergrund/Vordergrund und schonen Kontext. | `.claude/agents/<name>.md` (63 Stück) | pro Aufgabe |
| **Hooks** | Trigger-basierte Automatik an Lifecycle-/Tool-Events (Format, Lint, Memory, Reminder). | `.claude/hooks/hooks.json` (**noch nicht aktiv** — siehe §8) | dauerhaft, event-gebunden |
| **Rules** | „Immer befolgen"-Leitlinien (Security, Stil, Testing) je Sprache. | `.claude/rules/ecc/<sprache>/…` | dauerhaft |
| **MCP** | Prompt-getriebene Wrapper um externe Dienste. | `.mcp.json` (6 Server) | pro Session aktivierbar |
| **Instincts / Memory** | Gelernte Muster aus deinen Sessions, die ECC sich „merkt". | `.claude/homunculus/instincts/…` | wächst mit dir |

**Wichtigste Regel des Erfinders:** *Die durable Logik gehört in Skills.* Commands sind nur der
bequeme Einstieg. Wenn du etwas zum dritten Mal tippst → mach eine Skill draus (`/skill-create`).

---

## 2. Wie ECC bei DIR installiert ist (und das Verhältnis zu deinem globalen Setup)

ECC ist **projektlokal** installiert. Konkret heißt das:

- Alles liegt unter `/root/projekte/ECC/.claude/`. Es ist **additiv**: Wenn du Claude Code in
  diesem Ordner startest, kommen die ECC-Skills/-Commands/-Agents/-Rules **zusätzlich** zu deinem
  globalen Setup hinzu. Außerhalb dieses Ordners merkst du nichts davon.
- ECC-Rules/-Skills sind **namespaced** (`rules/ecc/…`, `skills/ecc/…`) → keine Kollision mit Eigenem.
- Reversibel: `node scripts/uninstall.js` (oder den Ordner löschen).

**Dein globales Setup & wie es koexistiert:**

| Dein globales Tool | ECC-Pendant | Empfehlung |
|---|---|---|
| **superpowers** (brainstorming, TDD, debugging, plans …) | ECC-Skills `tdd-workflow`, `verification-loop`, `agentic-engineering` … | Beides nutzbar. Bei Doppelung das ECC-Skill bevorzugen, wenn du „wie der Erfinder" arbeiten willst. |
| **claude-mem** (Cross-Session-Memory) | ECC `/save-session`, `/resume-session`, `continuous-learning-v2`, MCP-`memory` | **Eine** Memory-Quelle führen, sonst doppelte Wahrheit. Siehe §5. |
| **codex-Plugin** | ECC bringt `.codex/`-Adapter mit | Codex bleibt nutzbar; ECC kann nach `~/.codex/` portiert werden (`--target codex`). |
| **RTK** (Token-Killer-Hook) | ECC Token-Ökonomie (§4) | Ergänzen sich perfekt — RTK spart auf Bash-Ebene, ECC auf Workflow-Ebene. |
| **context-mode** (`ctx_*`) | — | Bleibt dein Recherche-/Analyse-Tool; ECC ersetzt es nicht. |

> ⚠️ **Namens-Überlappung bei Commands:** Wenn ein Slash-Command (z. B. `/code-review`) sowohl
> global als auch von ECC kommt, kann es zwei Einträge geben. Tippe `/` und schau auf die Quelle,
> oder nutz eindeutige ECC-Commands (`/harness-audit`, `/ecc-guide`, `/instinct-status`).

> ℹ️ **Projekt-`CLAUDE.md`:** Das Repo bringt eine eigene `CLAUDE.md` mit (sie beschreibt, wie man
> *an ECC selbst* mitentwickelt). Für deine eigene Arbeit in diesem Ordner kannst du sie anpassen
> oder durch eine eigene Projekt-`CLAUDE.md` ersetzen.

---

## 3. Der tägliche Workflow — die Phasen-Pipeline

Das Herzstück. Der Erfinder arbeitet in **klaren Phasen**, mit `/clear` dazwischen und
Zwischenergebnissen in Dateien (statt alles im Kontext zu halten).

```
Phase 1  RESEARCH    →  Explore-Agent / context-mode    →  research.md
Phase 2  PLAN        →  /plan                            →  plan.md   (wartet auf dein OK!)
Phase 3  IMPLEMENT   →  /feature-dev + Skill tdd-workflow →  Code + Tests
Phase 4  REVIEW      →  /code-review (+ /<sprache>-review) →  review.md
Phase 5  VERIFY      →  Tests/Build (+ /build-fix bei Fehlern) → grün oder zurück zu Phase 3
```

**Regeln für die Pipeline (aus dem Longform-Guide):**
1. Jeder Schritt bekommt **einen** klaren Input und liefert **einen** klaren Output.
2. Outputs werden zu Inputs der nächsten Phase (in Dateien speichern!).
3. Phasen **nicht überspringen**.
4. `/clear` zwischen großen Phasen (Explorations-Kontext ist für die Umsetzung irrelevant).
5. Bei Subagents: **objektiven Kontext mitgeben**, nicht nur die Frage (der Subagent kennt den Zweck sonst nicht).

**Konkreter Erst-Tag-Ablauf (Copy-Paste-tauglich):**

```text
cd /root/projekte/ECC && claude        # Claude Code in diesem Ordner starten
/ecc-guide                              # ECCs eigene Onboarding-Tour
# 1) Recherche: lass einen Explore-Agent die relevante Codebasis kartieren → in research.md
/plan  Baue Feature X …                 # ECC plant, listet Risiken, WARTET auf dein Bestätigen
# 2) /clear, dann aus dem Plan heraus implementieren:
/feature-dev  Setze plan.md um          # nutzt Skills/Agents, schreibt Tests zuerst (tdd-workflow)
/code-review                            # Qualitäts-/Security-Review der Änderungen
/build-fix                              # nur falls Build/Tests rot
/save-session                           # Stand sichern (für morgen)
```

---

## 4. Token- & Kontext-Ökonomie

**Das Kontextfenster ist kostbar.** Zu viele aktive Tools fressen es auf, bevor du anfängst.

- **MCP-Faustregel:** 20–30 MCPs *konfiguriert*, aber **< 10 aktiv / < 80 Tools**. Prüfen mit
  `/mcp` bzw. `/plugins`. Deine 6 Projekt-MCPs (github, context7, exa, memory, playwright,
  sequential-thinking) liegen gut darunter — Ungenutztes pro Projekt deaktivieren.
- **Strategisches Compacting:** Auto-Compact aus, stattdessen manuell an logischen Punkten
  (`/compact` mit Hint). Im Plan-Modus wird Kontext nach dem Plan ohnehin geleert.
- **Modellwahl** — billigstes ausreichendes Modell pro Aufgabe (Subagent-Architektur):

| Aufgabe | Modell | Warum |
|---|---|---|
| Exploration / Suche | Haiku | schnell, billig, reicht zum Finden |
| Einfache Edits | Haiku | klar umrissene Einzeldatei-Änderungen |
| Multi-File-Implementierung | Sonnet | bester Coding-Kompromiss |
| Komplexe Architektur | Opus | tiefes Reasoning |
| PR-Review | Sonnet | versteht Kontext, fängt Nuancen |
| Security-Analyse | Opus | darf nichts übersehen |
| Doku schreiben | Haiku | einfache Struktur |
| Komplexe Bugs | Opus | muss das ganze System im Kopf halten |

> Default = **Sonnet** für ~90 % des Codings. Upgrade auf **Opus** bei: erster Versuch
> gescheitert · Aufgabe ≥ 5 Dateien · Architektur-Entscheidung · Security-kritisch.
> ECC-Hilfe: `/model-route <aufgabe>` schlägt das Modell vor; `/cost-report` zeigt Kosten.

- **Modulare Dateien** (hunderte statt tausende Zeilen) → bessere First-Try-Trefferquote + weniger Token.
- **`/refactor-clean`** nach langen Sessions: toter Code + lose `.md` raus.
- **mgrep** (Plugin) statt grep: ~50 % weniger Token bei Suchen (optional nachrüstbar).

---

## 5. Memory & Sessions — über den Tag hinaus arbeiten

ECC persistiert Fortschritt in Session-Dateien, damit du am nächsten Tag nahtlos weitermachst.

| Command | Zweck |
|---|---|
| `/save-session` | Aktuellen Stand nach `~/.claude/session-data/` sichern |
| `/resume-session` | Letzte Session laden und weitermachen |
| `/sessions` | Session-Historie durchsuchen/verwalten |
| `/checkpoint` | Checkpoint im laufenden Lauf markieren |
| `/aside` | Kurze Nebenfrage beantworten, ohne den Haupt-Task-Kontext zu verlieren |

**Was eine gute Session-Datei enthält (Longform-Guide):**
- Was nachweislich **funktioniert** hat (mit Evidenz)
- Was versucht wurde und **nicht** ging
- Was **offen** ist / als Nächstes ansteht

**Drei Memory-Ebenen — halte sie getrennt:**
1. **Session-Dateien** (`~/.claude/session-data/`) — Tag-zu-Tag-Fortschritt.
2. **MCP-`memory`-Server** (in `.mcp.json`) — strukturierter Wissensgraph zur Laufzeit.
3. **Instincts** (`.claude/homunculus/instincts/…`) — gelernte Muster (§6).

> ⚠️ **Koexistenz mit claude-mem:** Du hast bereits claude-mem als Cross-Session-Memory. Entscheide
> dich pro Projekt für **eine** primäre Memory-Quelle, um keine widersprüchliche Doppel-Wahrheit zu
> bauen. Empfehlung hier: ECC-Sessions + Instincts für ECC-Arbeit, claude-mem global weiterlaufen lassen.

> 🔒 **Security (Memory ist „Benzin"):** Keine Secrets in Memory-Dateien; Projekt- von User-Memory
> trennen; nach untrusted Runs Memory zurücksetzen (siehe Security-Guide, Abschnitt „Memory").

---

## 6. Continuous Learning / Self-Improvement — ECC lernt aus deinen Sessions

Das ist der Teil, der ECC von „nur Configs" unterscheidet.

| Command | Zweck |
|---|---|
| `/learn` | Wiederverwendbare Muster aus der aktuellen Session extrahieren |
| `/learn-eval` | Muster extrahieren **+ Qualität selbst bewerten**, bevor gespeichert wird |
| `/evolve` | Gelernte Instincts analysieren → bessere Skill-Struktur vorschlagen |
| `/promote` | Projekt-Instincts in den globalen Scope befördern |
| `/instinct-status` | Alle Instincts (Projekt + global) mit Confidence-Scores zeigen |
| `/instinct-export` / `/instinct-import` | Instincts teilen (Datei/URL) |
| `/skill-create` | Aus lokaler Git-History eine wiederverwendbare Skill generieren |
| `/skill-health` | Health-Dashboard deines Skill-Portfolios |

**Der Lern-Loop (Skill `continuous-learning-v2`):** Wenn Claude etwas Nicht-Triviales entdeckt
(Debug-Trick, Workaround, projektspezifisches Muster), wird es als Instinct/Skill gespeichert.
Beim nächsten ähnlichen Problem lädt es automatisch. Design-Entscheidung: Das läuft über einen
**Stop-Hook** (einmal am Session-Ende), **nicht** über UserPromptSubmit (das würde jede Nachricht verlangsamen).

**Praktische Routine:** Session-Ende → `/learn-eval` → bei guten Mustern `/evolve` → Bewährtes mit
`/promote` global verfügbar machen.

---

## 7. Parallelisierung — mehrere Claudes ohne Chaos

Leitsatz: **„Wie viel schaffst du mit der minimal nötigen Parallelisierung?"** — keine willkürliche
Terminal-Zahl, ein Terminal mehr nur bei echter Notwendigkeit.

- **`/fork`** (Claude Code built-in): Konversation forken für nicht-überlappende Nebenaufgaben
  (z. B. Fragen zur Codebasis), statt Nachrichten zu stauen.
- **Git-Worktrees** für *überlappende* parallele Arbeit ohne Konflikte:
  ```bash
  git worktree add ../ECC-feature-a feature-a
  cd ../ECC-feature-a && claude        # eigene Claude-Instanz je Worktree
  ```
- **Cascade-Methode:** neue Tasks in neuen Tabs rechts öffnen, links→rechts (alt→neu) abarbeiten,
  max. 3–4 Tasks gleichzeitig. Chats mit `/rename` benennen.
- **Muster des Erfinders:** Haupt-Chat für Code-Änderungen, Forks für Fragen/Recherche.
- **ECC-Multi-Model:** `/multi-plan`, `/multi-workflow`, `/multi-backend`, `/multi-frontend`
  (kollaborative Planung/Umsetzung über mehrere Modelle) und `/loop-start` für wiederkehrende Loops.

---

## 8. Security im Alltag — und warum „nicht blind kopieren" hier konkret wird

Der Security-Guide (vom selben Autor) ist Pflichtlektüre. Kernhaltung: **Baue so, als würde das
Modell irgendwann etwas Feindliches lesen, während es etwas Wertvolles hält.** Stichworte:
*lethal trifecta* (private Daten + untrusted Content + externe Kommunikation), CVE-2025-59536 /
CVE-2026-21852 (Repo-kontrollierte Hooks/MCP/Env als Ausführungs-Oberfläche).

**Was bei dir bereits aktiv ist:**
- ✅ **Deny-Baseline** in `.claude/settings.local.json` (gitignored): blockt Lesen von
  `.env`, `~/.ssh`, `~/.aws`, gh-Config, Secrets sowie riskante Egress-/Shell-Muster
  (`curl|bash`, `ssh`, `scp`, `nc`).
- ✅ **`.env`** ist via `.gitignore` geschützt (du trägst Keys selbst ein, siehe §9).
- ✅ Lokaler **Supply-Chain-IOC-Scan** des Repos bestanden (`scripts/ci/scan-supply-chain-iocs.js`).

**Bewusst NICHT automatisch passiert (Least-Agency):**
- ⏸️ Die **ECC-Hooks** (`.claude/hooks/hooks.json`, u. a. PreToolUse/PostToolUse/Stop/SessionStart)
  sind **noch nicht aktiv**. Repo-kontrollierte Hooks blind zu aktivieren ist genau das, wovor der
  Security-Guide warnt. **Bewusste Aktivierung**, nachdem du `hooks.json` gesichtet hast:
  trage den Inhalt des `"hooks"`-Objekts aus `.claude/hooks/hooks.json` in die `"hooks"`-Sektion
  deiner `.claude/settings.local.json` ein (oder, wenn du sie versionieren willst, in eine
  `settings.json`). Klein anfangen (z. B. nur PostToolUse-Formatierung + Stop-Memory) und erweitern.
- ⏸️ **AgentShield-Scan:** `npx ecc-agentshield scan` lädt ein **externes** Paket — das wurde vom
  Auto-Mode bewusst geblockt. Führe es selbst aus, wenn du es vetten willst:
  `cd /root/projekte/ECC && npx ecc-agentshield scan` (bzw. `--fix`).

**Minimum-Bar-Checkliste (Security-Guide):** separate Agent-Identitäten · kurzlebige, scoped
Credentials · untrusted Arbeit in Container/VM/Devcontainer · Egress per Default verweigern · Reads
aus Secret-Pfaden beschränken · Anhänge/HTML/Screenshots sanitizen · Approval für Shell/Egress/
Deploy/Off-Repo-Writes · Tool-Calls/Approvals/Netz loggen · Process-Group-Kill + Heartbeat-Dead-Man-
Switch · Memory schmal & wegwerfbar · Skills/Hooks/MCP wie Supply-Chain-Artefakte scannen.

---

## 9. ECC-eigene CLIs & Wartung

```bash
cd /root/projekte/ECC

# Welche Komponenten passen zu meinem Bedarf? (Advisor)
npx ecc consult "security reviews"          # schlägt Profile/Module/Skills vor

# Zustand & Reparatur des ECC-Installs
node scripts/ecc.js list-installed          # was ist installiert (Target/Profil/Version)
node scripts/ecc.js doctor                  # Health-Check
node scripts/ecc.js repair                  # ECC-gemanagte Dateien wiederherstellen

# Nachinstallieren (gezielt, projektlokal)
node scripts/install-apply.js --target claude-project --skills deep-research,exa-search
node scripts/install-apply.js --target claude-project --modules security --dry-run

# Deinstallieren
node scripts/uninstall.js
```

**Secrets (`.env`) befüllen** — Werte trägst nur **du** ein:

| Variable | Wofür |
|---|---|
| `ANTHROPIC_API_KEY` | Anthropic API |
| `GITHUB_TOKEN` | MCP-GitHub-Server |
| `GITHUB_USER`, `DEFAULT_BASE_BRANCH` | CI-/Diff-Skripte |
| `ASTRAFLOW_API_KEY` (optional) | OpenAI-kompatibler Zusatz-Endpoint |

> `exa`-MCP braucht keinen Key (HTTP-Endpoint). `memory`/`sequential-thinking`/`playwright`/
> `context7` laufen über `npx` ohne Key.

**Slash-Commands zum Einstieg:** `/ecc-guide` (Onboarding), `/harness-audit` (Config auf
Zuverlässigkeit/Kosten prüfen), `/cost-report`, `/skill-health`, `/projects`.

---

## 10. Cheat-Sheet — die wichtigsten Befehle

```text
Neues Feature?              → /plan  (dann implementieren)
Feature umsetzen?           → /feature-dev   (+ Skill tdd-workflow)
Code geschrieben?           → /code-review   (oder /python-review, /go-review, /rust-review …)
Build/Tests rot?            → /build-fix
Coverage/Qualität?          → /test-coverage , /quality-gate
Aufräumen nach langer Session? → /refactor-clean
Live-Doku zu Library?       → context7-MCP / Skill documentation-lookup
Session sichern / fortsetzen?  → /save-session  /  /resume-session  /  /sessions
Checkpoint / Nebenfrage?    → /checkpoint  /  /aside
Gelerntes extrahieren?      → /learn-eval , dann /evolve , dann /promote
Instinct-Status?            → /instinct-status
Modell wählen / Kosten?     → /model-route  /  /cost-report
Harness prüfen?             → /harness-audit
Loop/Automation?            → /loop-start  /  /loop-status
ECC-Onboarding?             → /ecc-guide
```

**Sprach-spezifisch** (Auswahl der 82 Commands): `/go-build /go-review /go-test`,
`/rust-build /rust-review /rust-test`, `/cpp-build /cpp-review /cpp-test`,
`/kotlin-build /kotlin-review /kotlin-test`, `/react-build /react-review /react-test`,
`/flutter-build /flutter-review /flutter-test`, `/python-review`, `/fastapi-review`.

**PRP-Pipeline** (Product-Requirement-Prompt): `/prp-prd → /prp-plan → /prp-implement → /prp-commit → /prp-pr`.

---

### TL;DR — so arbeitest du „wie der Erfinder"

1. **In den Ordner**, `claude` starten — ECC ist dann aktiv.
2. **In Phasen** denken: Research → `/plan` → `/feature-dev`+TDD → `/code-review` → Verify, mit `/clear` dazwischen.
3. **Kontext sauber halten**: < 10 MCPs aktiv, billigstes ausreichendes Modell, modulare Dateien, strategisch compacten.
4. **Persistieren**: `/save-session` am Ende, `/resume-session` am Anfang.
5. **Lernen lassen**: `/learn-eval` → `/evolve` → `/promote`; wiederkehrende Handgriffe zu Skills machen.
6. **Security zuerst**: Deny-Baseline aktiv, Hooks/AgentShield bewusst aktivieren, nie blind ausführen.
7. **Bei Unsicherheit**: `/ecc-guide`, `node scripts/ecc.js doctor`, und die drei Original-Guides im Repo.

# Hybrid-Mega-Workflow — ECC-Core + BestPractice-Wrapper

> Derselbe autonome ECC-Workflow wie beim ECC-Erfinder: Loop starten, zurücklehnen,
> Agenten iterieren/testen/committen lassen. `bestpractice-extras/` wirkt nur als
> **Wrapper/Adapter**, der ECC steuert — **ohne den ECC-Core je zu beschädigen**.

## 1. Das Big Picture

Zwei Schichten, klar getrennt:

| Schicht | Rolle | Wird verändert? |
|---|---|---|
| **ECC-Core** (`ecc/`) | Führendes Harness: Agenten, Skills, Slash-Commands, Lifecycle-Hooks (SessionStart/Stop/PreCompact), der agenten-getriebene Loop | **Nie** — vendored Engine |
| **BestPractice-Wrapper** (`bestpractice-extras/`) | Additive Adapter: State-Sync, `/ecc-onboard`, RPI-Berater, `/mega-plan`, Karpathy-Regeln | Ja — hier lebt unser Code |

Der „Loop" ist **kein Daemon**, sondern agenten-getrieben: Skills (`continuous-agent-loop`,
`autonomous-loops`) + Commands (`/feature-dev`, `/loop`, `checkpoint`, `build-fix`). Der
Wrapper koppelt sich rein **additiv** über die Lifecycle-Hooks ein.

## 2. Wo wird was gespeichert?

| Artefakt | Ort | Quelle der Wahrheit? | VCS |
|---|---|---|---|
| **State** (4 modulare Dateien) | `state/{context,decisions,tasks,progress}.md` | **JA** — vom Menschen gepflegt | ✅ |
| **Loop-Futter** (generiert) | `<projekt-root>/WORKING-CONTEXT.md` | Nein — aus `state/` erzeugt | ✅ (optional) |
| **Sync-Snapshot** | `state/.sync/last-working-context.md` | Nein — Delta-Cache | ❌ gitignored |
| **ECC-Rules/Skills** (managed) | `.claude/rules/ecc/`, `.claude/skills/ecc/` | Nein — vom ECC-Installer getrackt | ✅ |
| **Projekt-Regeln** | `PROJECT_RULES.md` | JA — verifizierte Projektfakten | ✅ |
| **Hook-Registrierung** | `.claude/settings.json` (projekt-lokal, additiv) | JA | ✅ |
| **Karpathy-Regeln** (global) | `~/.claude/rules/ecc-extras/karpathy-principles.md` + `@`-Import in `~/.claude/CLAUDE.md` | JA — global, einmalig | ✅ (User-Config) |

**Merksatz:** `state/` ist die Wahrheit. `WORKING-CONTEXT.md` ist nur ihr generiertes
Spiegelbild für den Loop. Nie `WORKING-CONTEXT.md` von Hand pflegen — immer `state/` editieren.

## 3. Der Sync-Loop (PRE/POST)

```
state/{context,decisions,tasks,progress}.md   (Quelle der Wahrheit, Mensch)
   │  PRE  (SessionStart-Hook)  →  state-sync.js pre
   ▼
<projekt-root>/WORKING-CONTEXT.md             (Loop liest STATE:*-Blöcke,
   │                                            schreibt in SYNC:*-inbox-Zonen)
   │  POST (Stop / PreCompact-Hook)  →  state-sync.js post
   ▼  nur Delta (gegen Snapshot)
state/progress.md  +  state/tasks.md          (Erfolge / neue ToDos zurück)
```

- **PRE** generiert `WORKING-CONTEXT.md` aus `state/`. `STATE:*`-Blöcke werden überschrieben
  (Spiegel der Wahrheit). Die Agenten-Eingabezonen (`SYNC:progress-inbox`, `SYNC:tasks-inbox`)
  bleiben **erhalten**.
- Der **Loop/Agent** liest Kontext aus den `STATE:*`-Blöcken und trägt neue Erfolge/ToDos in
  die `SYNC:*`-Zonen ein.
- **POST** liest **nur** die `SYNC:*`-Zonen, bildet das **Delta gegen den Snapshot** und hängt
  die neuen Zeilen verlustfrei an `state/progress.md` bzw. `state/tasks.md` an. `WORKING-CONTEXT.md`
  bleibt dabei unangetastet (nicht-destruktiv).

**Sicherheits-Garantien:** Marker-Sektionen (kein Clobbering), atomares Schreiben, Snapshot-Delta
(idempotent), No-op-Guard (kein `state/` → still), ECC-Guard (nie `ecc/WORKING-CONTEXT.md`),
Exit 0 (Hooks brechen die Session nie ab). Verifiziert durch
`bestpractice-extras/scripts/state-sync/selftest.js` (7 Checks).

## 4. RPI + ECC orchestrieren

Der vollständige Pfad von der vagen Idee zum verifizierten Code:

```
  vages Ziel
     │
     ▼  /mega-plan  (Wrapper, Planungs-Vorstufe)
  ┌─────────────────────────────────────────────┐
  │ RPI-Berater PARALLEL (read-only Subagents):  │
  │  Intake · CTO · PM · UX                       │
  │      → ein verdichtetes Briefing              │
  └─────────────────────────────────────────────┘
     │
     ▼  /plan  (ECC, führend — wartet auf dein OK)
     ▼  /feature-dev  (ECC, TDD: Tests zuerst)
     ▼  /code-review  (+ sprach-spezifisch)
     ▼  Verify (Tests/Build grün; /build-fix bei Fehlern)
     │
     └─ Loop iteriert; Erfolge/ToDos fließen via POST-Sync zurück nach state/
```

- **`/mega-plan`** holt mehrere Experten-Perspektiven parallel ein und übergibt ein Briefing an
  ECCs `/plan`. Nur Planungs-Vorstufe; ECC-Dev-Agenten und der Loop bleiben unangetastet.
- Ab `/plan` läuft der **normale ECC-5-Phasen-Flow** (Research → Plan → Implement → Review → Verify).
- **Karpathy-Regeln** (global) sind immer aktiv: Think-First, Simplicity, Surgical Changes,
  Goal-Driven Execution — sie überschreiben keine ECC-Regel, sondern schärfen jede Aufgabe.

## 5. Neu vs. bestehend (Onboarding)

Ein Command für beides: **`/ecc-onboard`** (Stack-Detection → Dry-Run → 1× OK → Install → Kontext).

| | Neues Projekt | Bestehendes Projekt |
|---|---|---|
| `state/` | leeres Marker-Grundgerüst aus Templates | `context.md` aus README + `git log`; `tasks.md` aus echten TODOs/Ist-Zustand |
| ECC-Rules/Skills | frisch installiert (Profil `developer`/`core`) | inkrementell gemerged |
| `PROJECT_RULES.md` | aus Template, mit verifizierten Fakten | bestehende Regeln gemerged |
| Sync-Hooks | additiv in `.claude/settings.json` | nur ergänzt, falls noch nicht vorhanden |
| Initialer PRE-Sync | erzeugt `WORKING-CONTEXT.md` | erzeugt/aktualisiert `WORKING-CONTEXT.md` |

**Regel:** Bestehendes nie blind überschreiben — inspizieren, Diff zeigen, mergen.

## 6. Recovery

| Symptom | Ursache | Fix |
|---|---|---|
| `WORKING-CONTEXT.md` fehlt | noch kein PRE gelaufen / gelöscht | `node bestpractice-extras/scripts/state-sync/state-sync.js pre --project .` |
| Änderungen am Loop-Futter „verschwinden" | PRE überschreibt `STATE:*`-Blöcke aus `state/` | Inhalte gehören in `state/` (Wahrheit) bzw. in die `SYNC:*`-Zonen, nicht in `STATE:*` |
| Erfolge kommen doppelt in `state/` | Snapshot beschädigt/gelöscht | einmal `pre` laufen lassen (re-snapshot); danach idempotent |
| Marker kaputt (Start ohne Ende) | manuelles Editieren | `pre` regeneriert die `STATE:*`-Blöcke; `SYNC:*`-Zonen prüfen |
| Unsicher, ob der Sync korrekt arbeitet | — | `node bestpractice-extras/scripts/state-sync/selftest.js` (7 Checks) |
| Hook stört fremdes Projekt | kein `state/` vorhanden | No-op-Guard greift automatisch — nichts zu tun |

**Snapshot & Marker sind die Sicherheitsnetze:** Der Snapshot (`state/.sync/`) macht POST idempotent;
die Marker garantieren, dass menschlicher Inhalt nie überschrieben wird.

## 7. Befehls-Spickzettel

```bash
# Onboarding (neu & bestehend)
/ecc-onboard                      # Projekt ECC-ready machen (ein OK)

# Planung
/mega-plan <Ziel>                 # RPI-Berater parallel → Briefing → /plan
/plan                             # ECC-Planung (wartet auf OK)

# Umsetzung & Qualität
/feature-dev                      # geführte Feature-Entwicklung (TDD)
/code-review                      # Review (+ /python-review, /react-review, …)
/build-fix                        # Build-/Typfehler inkrementell beheben

# State-Sync manuell
node bestpractice-extras/scripts/state-sync/state-sync.js pre  --project .
node bestpractice-extras/scripts/state-sync/state-sync.js post --project .
node bestpractice-extras/scripts/state-sync/selftest.js        # Roundtrip-Test
```

---

*Teil des BestPractice-Wrappers. Der ECC-Core (`ecc/`) bleibt bei alledem unverändert —
`git diff` zeigt keine Änderung unter `ecc/`.*

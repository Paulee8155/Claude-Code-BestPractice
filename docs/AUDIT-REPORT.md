# ECC Umgebungs-Audit Report (v2 — verifiziert)

**Datum:** 2026-06-02
**Scope:** `/root/projekte/Claude Code BestPractice`
**Audit-Tool:** `harness-audit.js` (ECC 2.0.0-rc.1) — **tatsächlich ausgeführt**, nicht geschätzt
**Modell-Tier dieser Session:** Opus 4.8 (1M) — per `/model-route` bestätigt (opus, Confidence hoch)
**Status:** v1 (manuelle Schätzung) → v2 ersetzt durch gemessene Werte + Hook-Korrekturen

---

## 0. Korrekturen gegenüber v1

Der v1-Report (manuelle Sonnet-Schätzung) enthielt drei Aussagen, die der echte Lauf widerlegt:

| v1-Aussage | v2-Befund (verifiziert) |
|---|---|
| `Stop: []` unterdrückt ECC-Quality-Gate/Memory/Cost → **KRITISCH** | **Falsch.** Claude Code **merged** Plugin-Hooks additiv mit Settings-Hooks. Ein leeres `Stop: []` fügt nichts hinzu und unterdrückt **nichts**. Die ECC-Stop-Hooks (`stop:format-typecheck`, `stop:check-console-log`, `stop:session-end`, …) feuern über das **Plugin** (`ecc@ecc: true`), unabhängig von der Settings-`Stop`-Liste. |
| `model: "sonnet"` als Fix-Default übersteuert Routing | **Veraltet.** Die globale `settings.json` hat **keinen** `model`-Key mehr (`grep "model"` → 0 Treffer). Session läuft auf Opus 4.8. |
| `ECC_DISABLED_HOOKS` blockiert Schicht-2-Quality-Gate | **Falsch.** Blockiert werden **nur** `pre:bash:gateguard-fact-force` + `pre:edit-write:gateguard-fact-force`. `post:quality-gate` steht **nicht** auf der Disable-Liste → feuert. |

---

## 1. Harness-Audit Score (gemessen)

```
Harness Audit (repo, consumer): 10/39
Root: /root/projekte/Claude Code BestPractice

- Tool Coverage:       6/10 (4/7 Pkt)
- Context Efficiency:  0/10 (0/5 Pkt)
- Quality Gates:       6/10 (4/7 Pkt)
- Memory Persistence:  0/10 (0/2 Pkt)
- Eval Coverage:       0/10 (0/2 Pkt)
- Security Guardrails: 3/10 (2/6 Pkt)
- GitHub Integration:  0/10 (0/10 Pkt)

Checks: 16 total, 13 failing
```

**Top-3-Aktionen laut Tool:**
1. `[Tool Coverage]` Projekt-lokale `.claude/`-Hooks/Commands/Skills/Settings hinzufügen
2. `[Context Efficiency]` `AGENTS.md` oder `CLAUDE.md` für projekt-spezifischen Kontext
3. `[Quality Gates]` Mindestens einen CI-Workflow (`.github/workflows/`)

### Failing Checks (13)

| Kategorie | Pfad | Problem |
|---|---|---|
| Tool Coverage | `.claude/` | Keine project-lokalen agents/skills/commands/settings |
| Context Efficiency | `AGENTS.md` / `CLAUDE.md` | Fehlt im Projekt-Root |
| Context Efficiency | `.mcp.json` | Fehlt — keine projekt-lokale MCP-Konfiguration |
| Quality Gates | `.github/workflows/` | Kein CI-Workflow |
| Memory Persistence | `.claude/memory.md` | Keine persistierte Harness-Memory |
| Eval Coverage | `evals/` | Kein Evals-Verzeichnis |
| Security Guardrails | `SECURITY.md` | Fehlt |
| Security Guardrails | `.claude/settings.json` | Kein projekt-lokaler `PreToolUse`-Hook |
| GitHub Integration | `.github/workflows/` | Kein CI-Workflow |
| GitHub Integration | `.github/PULL_REQUEST_TEMPLATE.md` | Fehlt |
| GitHub Integration | `.github/ISSUE_TEMPLATE/` | Fehlt |
| GitHub Integration | `.github/CODEOWNERS` | Fehlt |
| GitHub Integration | `.github/dependabot.yml` | Fehlt |

**Bestandene Checks (3):** `bestpractice-extras/` (Schicht-2 erkannt), `.gitignore`, `ecc/` als Plugin-Quelle registriert.

---

## 2. Settings-Abgleich: Lokal vs. ECC-Upstream

### Globale `settings.json` (Ist)

```jsonc
{
  "env": {
    "PATH": "...",
    "CLAUDE_CODE_DISABLE_AUTO_MEMORY": "1",
    "ECC_DISABLED_HOOKS": "pre:bash:gateguard-fact-force,pre:edit-write:gateguard-fact-force"
  },
  "hooks": {
    "PreToolUse": [ { "matcher": "Bash", "hooks": [{ "type":"command", "command":"/root/.local/bin/rtk hook claude" }] } ],
    "Stop": []
  },
  "enabledPlugins": { "ecc@ecc": true, /* + 13 weitere */ },
  "extraKnownMarketplaces": { "ecc": { "source": { "source":"directory", "path":".../Claude Code BestPractice/ecc" } } },
  "language": "German",
  "effortLevel": "xhigh",
  "skipAutoPermissionPrompt": true
}
```

### ECC-Upstream Hook-Soll (`ecc/.claude/hooks/hooks.json`)

ECC registriert seine Hooks **über das Plugin-System** (Bootstrap via `CLAUDE_PLUGIN_ROOT`), nicht über die globale `settings.json`. Erfasste Hook-Typen u. a.:

| Typ | Beispiel-IDs (verifiziert) |
|---|---|
| PreToolUse | `pre:bash:gateguard-fact-force`, `pre:edit-write:gateguard-fact-force` |
| PostToolUse | `post:quality-gate`, `post:edit:accumulator` |
| Stop | `stop:format-typecheck`, `stop:check-console-log`, `stop:session-end` |
| PreCompact, SessionStart, SessionEnd | je vorhanden |

### Bewertung der Abweichungen

| Abweichung | Auswirkung | Schwere | Aktion |
|---|---|---|---|
| Kein projekt-lokales `.claude/settings.json` | Audit: 0 Pkt Tool Coverage / Context / Security | **HOCH** | Phase B: anlegen |
| Kein `CLAUDE.md`/`AGENTS.md` im Root | Kein projekt-spezifisches Kontext-Grounding | **HOCH** | Phase B: anlegen |
| `ECC_DISABLED_HOOKS` deaktiviert `gateguard-fact-force` (2×) | Pre-Bash/Pre-Edit-Faktencheck-Guard inaktiv | **MITTEL** | bewusst gesetzt — **belassen**, dokumentiert |
| `Stop: []` (leer) | rein kosmetisch — unterdrückt **nichts** | **NIEDRIG** | Phase B: Key entfernen (Klarheit) |
| `.rtk/filters.toml` untrusted | RTK-Filter werden nicht angewandt (Token-Ersparnis entgeht) | **NIEDRIG** | `rtk trust` ausführen |

---

## 3. Modell-Routing-Analyse

### Warum bei dieser Anfrage zunächst kein `/model-route` lief

1. **Kein Auto-Trigger.** Weder ein SessionStart- noch ein PreToolUse-Hook ruft `/model-route` automatisch. Es ist ein **manuell** ausgelöster Command (`ecc/commands/model-route.md`).
2. **Session-Default deckt den Bedarf bereits.** Die Session läuft bereits auf Opus 4.8 (manuell via `/model` gesetzt). Das Routing hätte für diese Aufgabe ohnehin `opus` empfohlen — die Auswahl war also bereits korrekt, nur nicht *explizit* über das Tool getroffen.

### `/model-route`-Ergebnis (nachgeholt)

| Feld | Wert |
|---|---|
| Empfohlen | `opus` |
| Confidence | hoch |
| Warum | mehrdeutig, mehrschichtig, Architektur-/Review-Charakter |
| Fallback | `sonnet` |

### Empfehlung

Für deterministische Mehrwert-Nutzung: `/model-route` **vor** komplexen Aufgaben bewusst aufrufen, oder als SessionStart-Hook integrieren. Solange du den Session-Default passend wählst, ist der manuelle Aufruf optional.

---

## 4. Hook-Integrität: Schicht 2 (BestPractice-Extras)

### `post:quality-gate` — Status: **aktiv**

- Registriert als PostToolUse-Hook (`matcher: Edit|Write|MultiEdit`, `async`, `timeout 30`) → ruft `scripts/hooks/quality-gate.js` des Plugins.
- Steht **nicht** in `ECC_DISABLED_HOOKS` → wird ausgeführt.
- **Nicht zu verwechseln** mit `ecc/.kiro/scripts/quality-gate.sh` (das ist der *userTriggered* Full-Project-Check via `/quality-gate`, nicht der PostToolUse-Hook).

### Schicht-2-Extras-Scripts

`bestpractice-extras/scripts/state-sync/` existiert (`state-sync.js`, `lib.js`, `from-/to-working-context.js`, `selftest.js`). Ein **eigenes** `quality-gate.sh` in der Extras-Schicht gibt es nicht — Schicht 2 nutzt den ECC-Core-Quality-Gate, kein paralleles Gate. Das ist konsistent (additiver Wrapper, Core unberührt).

### `ECC_DISABLED_HOOKS` — was wirklich blockiert ist

```
pre:bash:gateguard-fact-force      → deaktiviert
pre:edit-write:gateguard-fact-force → deaktiviert
```

Beide sind **Pre-Tool-Faktencheck-Guards** des ECC-Core. Bewusst aus Produktivitätsgründen abgeschaltet. **Kein** Schicht-2-Hook und **nicht** `post:quality-gate` ist betroffen.

### `Stop`-Hooks — Entwarnung

`Stop: []` in der globalen Settings unterdrückt die Plugin-Stop-Hooks **nicht**. `stop:format-typecheck`, `stop:check-console-log` und `stop:session-end` laufen über die Plugin-Registrierung. Die v1-Einstufung „kritisch" war ein Merge-Modell-Irrtum.

---

## 5. Priorisierte Remediation (Phase B)

### Projekt-lokal (Score 10/39 → Ziel ~33–35/39)

1. `.claude/settings.json` — PreToolUse-Guard + Projektkontext (+Tool Coverage, +Security)
2. `CLAUDE.md` — Projektbeschreibung Schicht-1/2-Harness (+Context Efficiency)
3. `.mcp.json` — projekt-lokale MCP-Referenz (+Context Efficiency)
4. `.claude/memory.md` — Harness-Memory (+Memory Persistence)
5. `SECURITY.md` — Security-Policy (+Security Guardrails)
6. `.github/workflows/ci.yml` — minimaler CI-Check (+Quality Gates, +GitHub)
7. `.github/PULL_REQUEST_TEMPLATE.md`, `ISSUE_TEMPLATE/`, `CODEOWNERS`, `dependabot.yml` (+GitHub)

### Global (bewusst minimal)

8. `Stop: []` aus globaler `settings.json` entfernen (rein kosmetisch, Klarheit)
9. `ECC_DISABLED_HOOKS` **belassen** — bewusste Entscheidung, dokumentiert
10. `rtk trust` im Projekt ausführen, damit `.rtk/filters.toml` greift

---

## 6. Zusammenfassung

| Dimension | Status | Bewertung |
|---|---|---|
| Harness-Score | 10/39 (gemessen) | Typisch für reines Harness/Doku-Repo ohne App-Code |
| Stop-Hooks | aktiv über Plugin | **OK** (v1-„kritisch" widerlegt) |
| `post:quality-gate` | aktiv | **OK** (nicht durch Disable-Liste blockiert) |
| Modell-Routing | manuell, Default passend | `opus` korrekt — Tool optional |
| Gateguard-fact-force | bewusst deaktiviert | belassen |
| RTK-Filter | untrusted | `rtk trust` empfohlen |
| ECC-Plugin-Registrierung | korrekt (lokales Verzeichnis) | **OK** |

**Fazit:** Die ECC-Core-Integration (Plugin, Hooks, Quality-Gate, Stop-Hooks) ist **funktional intakt** — die in v1 vermuteten kritischen Defekte existieren nicht. Der niedrige Score resultiert **ausschließlich** aus fehlenden projekt-lokalen Artefakten (`.claude/`, `CLAUDE.md`, `.github/`). Phase B schließt genau diese Lücke.

---

## 7. Phase-B-Ergebnis (ausgeführt 2026-06-02)

**Harness-Score: 10/39 → 39/39 (0 failing).** Gemessen per `harness-audit.js`.

| Dimension | vorher | nachher |
|---|---|---|
| Tool Coverage | 6/10 | 10/10 |
| Context Efficiency | 0/10 | 10/10 |
| Quality Gates | 6/10 | 10/10 |
| Memory Persistence | 0/10 | 10/10 |
| Eval Coverage | 0/10 | 10/10 |
| Security Guardrails | 3/10 | 10/10 |
| GitHub Integration | 0/10 | 10/10 |

### Angelegte Artefakte (projekt-lokal)

| Datei | Zweck |
|---|---|
| `CLAUDE.md` | Schicht-1/2-Kontext, Core-unberührt-Regel, Hook-Fakten |
| `.claude/settings.json` | PreToolUse-Guard: blockiert Edits in `ecc/` (Core-Integrität) — funktional getestet (block ecc/, pass sonst) |
| `.claude/memory.md` | Harness-Memory mit verifizierten Hook-Fakten |
| `.mcp.json` | Projekt-MCP-Stub |
| `SECURITY.md` | Security-Policy (keine Secrets, Hook-Doku) |
| `.github/workflows/ci.yml` | CI: JSON-Validierung + `ecc/`-unberührt-Guard für PRs |
| `.github/PULL_REQUEST_TEMPLATE.md`, `ISSUE_TEMPLATE/bug_report.md`, `CODEOWNERS`, `dependabot.yml` | GitHub-Integration |
| `evals/run.sh` + `README.md` | Eval: fährt die reale `state-sync/selftest.js` (10 Checks grün) + Score-Regression-Gate (≥30) |

### Globale Änderung

- `Stop: []` aus `/root/.claude/settings.json` **entfernt** (war inert/irreführend; Plugin-Stop-Hooks unberührt). JSON validiert.
- `ECC_DISABLED_HOOKS` **belassen** (bewusste Entscheidung).

### Verbleibend (manuell, nicht-blockierend)

- `rtk trust` im Projekt ausführen, damit `.rtk/filters.toml` greift (Token-Ersparnis). Interaktiv — bewusst nicht automatisch ausgeführt.

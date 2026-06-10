# 🗺️ Wo läuft was — ECC-Harness-Landkarte

> **Single Source of Truth** für die Frage „wo liegt was, global vs. lokal, und warum".
> Richtet sich nach der **offiziellen ECC-Architektur** (Gründer Affaan Mustafa, Upstream `2.0.0-rc.1`):
> **ein globales Plugin + Steuerung über Env-Vars**. Lokale Schicht-2-Erweiterungen sind als solche markiert.
>
> Stand: 2026-06-10. **Migration abgeschlossen** (Plugin-only-Umbau): alle ECC-Duplikate im Home
> entfernt, claude-mem + superpowers deaktiviert (ECC führend), ECC-Repo-Klon gelöscht.
> Backup: `/root/harness-backup-20260610/`.

---

## 1. Das Grundprinzip (offiziell)

> „Most Claude Code users should use exactly one install path … install the Claude Code plugin."
> — ECC `README.md:211`. **Do not stack install methods** (`README.md:215`).

- **ECC ist EIN globales Plugin** (`ecc@ecc`), zentral unter `~/.claude/`. Es wird **nie** in ein Projekt kopiert/vendored.
- **Hooks werden über Env-Variablen gesteuert**, nicht über eigene Skripte:
  - `ECC_HOOK_PROFILE=minimal|standard|strict` (Default `standard`)
  - `ECC_DISABLED_HOOKS="id1,id2"` (gezielte Einzel-Ausnahmen)
  - `ECC_GATEGUARD=off`
- **Lokale Policy (Schicht 2, legitim):** ECC-Hooks sollen **nur in ECC-Projekten** feuern, nicht in produktiven Nicht-ECC-Diensten (WMS, Jarvis, n8n …). Umgesetzt mit dem **offiziellen** Profil-Mechanismus (global `minimal`, projekt-lokal `standard`) — kein Eigenbau.

---

## 2. GLOBAL — `~/.claude/` (gilt für alle Projekte am VPS)

| Was | Pfad | Zweck | Status |
|---|---|---|---|
| **ECC-Plugin** (Core: Agents, Skills, Commands, Hooks) | `~/.claude/plugins/cache/ecc/ecc/2.0.0-rc.1/` | **Single Source** des ECC-Verhaltens | ✅ aktiv |
| **Globale Settings** | `~/.claude/settings.json` | `env.ECC_HOOK_PROFILE=minimal` + `ECC_GATEGUARD=off` → zähmt Hooks in Nicht-ECC-Projekten | ✅ umgestellt (2026-06-05) |
| **ECC-Rules global** | ~~`~/.claude/rules/ecc/`~~ | **ENTFERNT 2026-06-10** — 117 Dateien aller Sprachen wurden in **jede** Session injiziert (~Auto-Compact-Ursache). Rules kommen jetzt nur projekt-lokal für die relevante Sprache (`/ecc-onboard`) | ✅ entfernt |
| **Eigene Rules** | `~/.claude/rules/ecc-extras/` | karpathy-principles + attribution-policy (Schicht 2) | ✅ bleibt |
| **Globale Commands** | `~/.claude/commands/` | **nur noch 3 Symlinks** auf Schicht-2-Quellen: `start`, `mega-plan`, `ecc-onboard`. Die 79 ECC-Command-Kopien sind ENTFERNT (Plugin liefert sie) | ✅ entschlackt |
| **Hooks-Kopie** | ~~`~/.claude/hooks/`~~ | **ENTFERNT 2026-06-10** — tote 48K-Kopie der Plugin-Hooks, wurde nirgends geladen | ✅ entfernt |
| **Skills-Kopie** | ~~`~/.claude/skills/ecc/`~~ | **ENTFERNT 2026-06-10** — `skills/learned` + `skills/system-architektur` bleiben | ✅ entfernt |
| **Plugins deaktiviert** | `settings.json` → `enabledPlugins` | `claude-mem` (ECC-Memory führend), `superpowers` (ECC-Workflow führend), `context7@official` (ECC bringt eigenes context7-MCP) → `false`; Caches bleiben 1–2 Wochen als Rollback | ✅ 2026-06-10 |
| **Secret** (mgrep) | `~/.claude/settings.json` → `env.MXBAI_API_KEY` | user-scoped, **nie ins Repo** | ✅ |
| **Migration-Backups** | `~/.claude-ecc-migration-backups/<stamp>/` + `/root/harness-backup-20260610/` | Rollback (settings, rules, commands, skills, hooks, claude-mem-Daten, homunculus, Projekt-.claude, eigene Arbeit aus ECC-Klon: voice-orchestrator + ECC-WORKFLOW-GUIDE.de.md) | ✅ |

**Audit-Pin (ersetzt das vendored `ecc/`):** Plugin-Version **`2.0.0-rc.1`**. Audit läuft gegen das globale Plugin:
`node ~/.claude/plugins/cache/ecc/ecc/2.0.0-rc.1/scripts/harness-audit.js`.

---

## 3. PROJEKT-LOKAL — `<projekt>/.claude/` (nur ECC-Projekte)

| Was | Pfad | Zweck | Schicht |
|---|---|---|---|
| **Projekt-Settings** | `.claude/settings.json` → `env.ECC_HOOK_PROFILE=standard` | reaktiviert die volle ECC-Pipeline **nur hier** (überschreibt global `minimal`) | offiziell |
| **State-Sync-Hooks** | `.claude/settings.json` → SessionStart/Stop/PreCompact → `state-sync.js` | spiegelt `state/` ⇄ `WORKING-CONTEXT.md` | **Schicht 2** |
| **State** | `state/` (context, decisions, progress, tasks) + `WORKING-CONTEXT.md` | Projekt-Gedächtnis | **Schicht 2** |
| **Projekt-Regeln** | `PROJECT_RULES.md` | projektspezifische Vorgaben | **Schicht 2** |
| **MCP-Server** | `.mcp.json` | projektrelevante MCPs | offiziell |

**Was NICHT mehr ins Projekt gehört** (entfällt mit dieser Migration):
- ❌ vendored ECC-Core (`.claude/ecc/` als Vollkopie)
- ❌ `.claude/ecc/install-state.json` (gehört zur zentralen Install-Verwaltung)
- ❌ eigener `hooks.py`-Dispatcher (ersetzt durch Plugin-Hooks via `ECC_HOOK_PROFILE=standard`)

---

## 4. Hook-Mechanik — wer feuert wo

| Ort | `ECC_HOOK_PROFILE` | Effekt |
|---|---|---|
| Nicht-ECC-Dienste (WMS, Jarvis, n8n, LinkedBoost …) | `minimal` (global) | nur essenzielle Hooks; **kein** quality-gate/governance/observe |
| ECC-Projekte (onboarded) | `standard` (projekt-lokal) | volle Pipeline: quality-gate, governance, observe, metrics, console-warn … |
| Überall | — | `ECC_GATEGUARD=off` (gateguard bewusst aus) |

**Bewiesen** (deterministischer `isHookEnabled`-Test, 2026-06-05): bei `minimal` läuft `quality-gate` nicht, bei `standard` schon.
**⚠️ Wirkung erst in frischer Session** — Claude liest `env` nur beim Start.

**DIRECT-Hooks** (nicht profil-gesteuert, laufen überall, no-oppen sich selbst): `stop-format-typecheck`, `check-console-log`, `session-end`, `cost-tracker`.

---

## 5. SCHICHT 2 — eigene Erweiterungen (BestPractice-Repo)

Liegen in `bestpractice-extras/` — **additive Wrapper**, kein Patch am Core:

| Erweiterung | Zweck |
|---|---|
| `scripts/state-sync/` | `state/` ⇄ `WORKING-CONTEXT.md` (SessionStart/Stop/PreCompact) |
| `commands/onboard/ecc-onboard.md` + `scripts/onboard/consumer-scaffold.js` | Projekt ECC-ready machen (env-Block + state/ + PROJECT_RULES) — **kein** Core-Copy |
| `scripts/mgrep/` | semantische Suche (Mixedbread) |
| `scripts/build-docs/` | Office-Snapshots aus Markdown |
| `commands/start.md`, `mega-plan.md` | Tagesstart, RPI-Berater |

> **Warum Schicht 2 statt Core-Patch:** Der Core bleibt Upstream-rein. ECC-Verhalten wird nur über
> Env-Vars + additive Wrapper verändert, nie durch Edits im Plugin.

---

## 6. Projekt-Status (Migration auf den Standard)

| Projekt | Onboarded | Hook-Weg | Status |
|---|---|---|---|
| Grow3_Automatisierung | ✅ | `ECC_HOOK_PROFILE=standard` | ✅ fertig |
| Werkstattauftraege_codex (+prod/staging) | ✅ | `standard`; hooks.py-Eigenbau **entfernt 2026-06-10** | ✅ fertig |
| Verladelisten_Hafen | ✅ | `ECC_HOOK_PROFILE=standard` | ✅ fertig |
| Test-ECC | ✅ | `ECC_HOOK_PROFILE=standard` — **Testbed** für End-to-End-Verifikation | ✅ fertig |
| WMS_Test | ✅ | `standard` gesetzt, hooks.py entfernt, PROJECT_RULES.md ergänzt (alles 2026-06-10) | ✅ fertig |
| Claude Code BestPractice | ✅ (Repo selbst) | `ECC_HOOK_PROFILE=standard` | ✅ fertig |
| WMS_Live, Jarvis, n8n, LinkedBoost … | ❌ (bewusst) | global `minimal` | ✅ bleibt zahm |
| ~~/root/projekte/ECC~~ (Repo-Klon, 213M) | — | **GELÖSCHT 2026-06-10** — Plugin ist Single Source; eigene Arbeit (voice-orchestrator, ECC-WORKFLOW-GUIDE.de.md) gerettet nach `/root/harness-backup-20260610/ecc-clone-eigenes/` | ✅ |

**Hook-Quellen nach dem Umbau (vollständige Liste):**

| Quelle | Hooks |
|---|---|
| `~/.claude/settings.json` | PreToolUse `rtk hook claude` (Token-Optimierung) — sonst nichts |
| ECC-Plugin (`ecc@ecc`) | alle 28 Lifecycle-Hooks, profilgesteuert via `ECC_HOOK_PROFILE` (inkl. `pre:/post:observe` = Continuous Learning bei `standard`/`strict`) |
| Projekt-`settings.json` (onboarded) | state-sync (SessionStart/Stop/PreCompact, Schicht 2) |

---

## 7. Rollback

```bash
# Kompletter Stand VOR dem Plugin-only-Umbau (2026-06-10):
tar xzf /root/harness-backup-20260610/claude-global.tgz -C /root      # rules, commands, skills, hooks, settings, CLAUDE.md
tar xzf /root/harness-backup-20260610/proj-<Projekt>.tgz -C /root/projekte/<Projekt>   # Projekt-.claude
# claude-mem reaktivieren: settings.json → enabledPlugins."claude-mem@thedotmack": true
# Ältere Migration (2026-06-05):
cp /root/.claude-ecc-migration-backups/20260605-150744/global-settings.json /root/.claude/settings.json
```

Wirkung greift jeweils erst in einer **frischen Session**.

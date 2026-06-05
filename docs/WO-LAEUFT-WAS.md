# 🗺️ Wo läuft was — ECC-Harness-Landkarte

> **Single Source of Truth** für die Frage „wo liegt was, global vs. lokal, und warum".
> Richtet sich nach der **offiziellen ECC-Architektur** (Gründer Affaan Mustafa, Upstream `2.0.0-rc.1`):
> **ein globales Plugin + Steuerung über Env-Vars**. Lokale Schicht-2-Erweiterungen sind als solche markiert.
>
> Stand: 2026-06-05. Migration läuft — siehe Status-Spalten.

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
| **ECC-Rules** | `~/.claude/rules/ecc/` | Coding-Standards (Plugin verteilt Rules nicht automatisch → manuell, `README.md:288`) | ✅ vorhanden |
| **Secret** (mgrep) | `~/.claude/settings.json` → `env.MXBAI_API_KEY` | user-scoped, **nie ins Repo** | ✅ |
| **Migration-Backups** | `~/.claude-ecc-migration-backups/<stamp>/` | Rollback aller settings.json | ✅ 2026-06-05-150744 |

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

| Projekt | Onboarded | Hook-Weg Ist | Ziel | Status |
|---|---|---|---|---|
| Grow3_Automatisierung | ✅ | env-Override (gateguard-IDs) | `ECC_HOOK_PROFILE=standard` | ⏳ Phase 4 |
| Werkstattauftraege_codex | ✅ | **eigener hooks.py** (kein Plugin) | hooks.py raus, `ECC_HOOK_PROFILE=standard` | ⏳ Phase 4 |
| Verladelisten_Hafen | ✅ | env-Override | `ECC_HOOK_PROFILE=standard` | ⏳ Phase 4 |
| Test-ECC | ✅ | env-Override | `ECC_HOOK_PROFILE=standard` | ⏳ Phase 4 |
| Claude Code BestPractice | ✅ (Repo selbst) | env-Override + vendored ecc/ | ecc/ raus, `ECC_HOOK_PROFILE=standard` | ⏳ Phase 3+4 |
| WMS, Jarvis, n8n, LinkedBoost … | ❌ (bewusst) | global `minimal` | bleibt zahm | ✅ |

---

## 7. Rollback

```bash
# Globale Settings zurück:
cp /root/.claude-ecc-migration-backups/20260605-150744/global-settings.json /root/.claude/settings.json
# Projekt-Settings zurück (Beispiel):
cp /root/.claude-ecc-migration-backups/20260605-150744/<Projekt>-settings.json <projekt>/.claude/settings.json
```

Wirkung greift jeweils erst in einer **frischen Session**.

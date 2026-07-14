# Harness-Smoke-Test — „Geht alles?" in einem frischen Projekt

> **Zweck:** In ~20–30 Min beweisen, dass das komplette Harness (ECC-Core + Schicht-2-Extras)
> in einem **neuen, leeren** Projekt von Null funktioniert. Jeder Schritt hat ein
> **Pass-Kriterium** — nur wenn alle grün sind, „geht alles".
>
> **Legende:** 🖥️ = im **Claude-Code-Terminal** tippen (Slash-Command) · `$` = **Shell**-Befehl.
> Reihenfolge einhalten — spätere Schritte bauen auf früheren auf.

---

## Phase 0 · Frisches Testprojekt anlegen  `$`

```bash
mkdir -p /root/projekte/_ecc-smoketest && cd /root/projekte/_ecc-smoketest
git init
# Minimaler TS-Stack (triggert auch die JS/TS-Hooks: format-typecheck, console-warn):
npm init -y
npm pkg set type=module
printf '{\n  "compilerOptions": { "strict": true, "noEmit": true, "module": "esnext", "moduleResolution": "bundler" }\n}\n' > tsconfig.json
```

| ✓ | Pass-Kriterium |
|---|---|
| ☐ | `package.json` + `tsconfig.json` + `.git/` existieren, Ordner ist sonst leer |

> Eigenen Stack statt TS? Geht auch (Python/Go/…). Dann triggern nur die sprach-neutralen Hooks.

---

## Phase 1 · Onboarding  🖥️

Claude Code **in diesem Ordner** starten, dann:

```
🖥️  /ecc-onboard
```

Ablauf laut Contract: **Detect → Dry-Run → 1× dein OK → Install → Kontext**.

| ✓ | Pass-Kriterium |
|---|---|
| ☐ | Stack wird korrekt erkannt (TypeScript/Node) |
| ☐ | Es erscheint ein **Dry-Run** (Plan) **bevor** etwas geschrieben wird |
| ☐ | Es wartet auf **dein OK** — schreibt nicht ungefragt |
| ☐ | Nach OK: `.claude/rules/ecc/` + `.claude/skills/ecc/` angelegt |
| ☐ | `PROJECT_RULES.md`, `CLAUDE.md` und `state/` (4 Dateien) entstehen |
| ☐ | `.claude/settings.json` enthält die State-Sync-Hooks (SessionStart/Stop/PreCompact) |

**Verifikation** `$`:
```bash
ls -R .claude/rules/ecc | head; ls state/; cat .claude/settings.json | grep -i state-sync
```

---

## Phase 2 · Konfigurations-Audit  🖥️

```
🖥️  /harness-audit
```
(oder `$ node ~/.claude/plugins/cache/ecc/ecc/2.0.0/scripts/harness-audit.js`)

| ✓ | Pass-Kriterium |
|---|---|
| ☐ | Eine **Scorecard** mit Punktzahl erscheint (X/39) |
| ☐ | Score steigt nach dem Onboarding klar an (frisch ~10/39 → onboardet deutlich höher) |
| ☐ | Verbleibende Findings sind benannt + mit Fix-Hinweis |

---

## Phase 3 · State-Sync (Schicht 2)  `$`

```bash
node bestpractice-extras/scripts/state-sync/selftest.js   # falls Extras im Projekt liegen
# sonst aus dem BestPractice-Repo:  node .../bestpractice-extras/scripts/state-sync/selftest.js
ls WORKING-CONTEXT.md
```

| ✓ | Pass-Kriterium |
|---|---|
| ☐ | `selftest.js` meldet **7/7 Checks grün** |
| ☐ | `WORKING-CONTEXT.md` existiert und spiegelt `state/`-Inhalte (STATE:*-Blöcke) |
| ☐ | Nach einer Session landet ein Delta in `state/progress.md` / `state/tasks.md` |

---

## Phase 4 · Hooks feuern  🖥️ + `$`

Eine Datei mit absichtlichem `console.log` schreiben lassen, dann beobachten:

```
🖥️  Lege src/util.ts an mit einer Funktion add(a,b) und einem console.log darin.
```

| ✓ | Pass-Kriterium |
|---|---|
| ☐ | **PostToolUse**: `console-warn` warnt direkt nach dem Edit vor dem `console.log` |
| ☐ | **PostToolUse**: `quality-gate` läuft nach Write/Edit |
| ☐ | **Stop**: `format-typecheck` formatiert + typecheckt am Antwortende |
| ☐ | **Stop**: `check-console-log` meldet das zurückgelassene `console.log` |

---

## Phase 5 · Der echte 5-Phasen-Durchlauf  🖥️

Das Herzstück — ein Mini-Feature komplett durch die Pipeline. `/clear` zwischen den Phasen.

| Phase | 🖥️ Eingabe | Pass-Kriterium |
|---|---|---|
| 1 · RESEARCH | „Explore: wo gehört eine reine Utility-Funktion hin?" → `research.md` | Output landet in **Datei**, nicht nur im Chat |
| — | `/clear` | Kontext frisch |
| 2 · PLAN | `/plan Funktion slugify(text) mit Tests zuerst` | Plan erscheint und **wartet auf dein OK** |
| 3 · IMPLEMENT | `/feature-dev plan.md umsetzen — Tests zuerst` | **RED→GREEN**: Test zuerst rot, dann Implementierung grün |
| 4 · REVIEW | `/code-review` (+ `/typescript-review`) | Review nennt Severity-Level, keine offenen CRITICAL/HIGH |
| 5 · VERIFY | `/build-fix` nur falls rot, sonst Tests laufen | **Tests + Build grün** mit sichtbarer Ausgabe |

| ✓ | Gesamt-Pass |
|---|---|
| ☐ | Alle 5 Phasen durchlaufen, je ein Datei-Output, am Ende grüne Tests |
| ☐ | `/plan` hat **wirklich** auf OK gewartet (kein Code ohne Freigabe) |
| ☐ | TDD-Reihenfolge eingehalten (Test war zuerst rot) |

---

## Phase 6 · Memory & Session  🖥️

```
🖥️  /save-session
```

| ✓ | Pass-Kriterium |
|---|---|
| ☐ | Session-Datei unter `~/.claude/session-data/` angelegt |
| ☐ | Nächster Start im selben Projekt: claude-mem injiziert Kontext (ab 2. Session) |
| ☐ | `/mem-search "slugify"` findet die eben gemachte Arbeit |

---

## Phase 7 · (optional) mgrep  `$`

Nur wenn `MXBAI_API_KEY` gesetzt ist und du den Outbound-Upload bewusst willst:

```bash
bash bestpractice-extras/scripts/mgrep/index.sh   # initial syncen, dann Ctrl+C
mgrep search "slugify utility"
```

| ✓ | Pass-Kriterium |
|---|---|
| ☐ | Index-Sync läuft durch (`processed / uploaded`) |
| ☐ | `mgrep search` liefert den relevanten Treffer konzeptuell |

---

## Abschluss

| ✓ | Ergebnis |
|---|---|
| ☐ | **Alle Pflicht-Phasen (0–6) grün → „es geht alles".** |
| ☐ | Findings/Abweichungen notiert (für Fix oder Doku) |

**Aufräumen** (Testprojekt war Wegwerf):
```bash
rm -rf /root/projekte/_ecc-smoketest
```

> **Wenn ein Schritt rot ist:** nicht weiterklicken — Ursache notieren. Onboarding-Probleme →
> `/ecc-onboard` erneut (idempotent) bzw. `node ecc/scripts/ecc.js doctor`. Hook-Probleme →
> `~/.claude/settings.json` prüfen. Workflow-Probleme → `/ecc-guide`.

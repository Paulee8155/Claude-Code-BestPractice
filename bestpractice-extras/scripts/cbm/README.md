# Codebase Memory (CBM) — Betriebsdoku

Code-Intelligence-Graph für das Harness: indexiert Quellcode in einen Graphen
(Dateien, Klassen, Funktionen, Routen, Aufrufkanten) und beantwortet strukturelle
Fragen, für die man sonst blind Dateien durchsuchen müsste.

Upstream: [DeusData/codebase-memory-mcp](https://github.com/DeusData/codebase-memory-mcp)
**Gepinnt: v0.9.0**, Variante `standard` (ohne UI) — siehe `release.json`.

## Architekturentscheidung: Binary global, MCP projektlokal

```text
Binary          einmal VPS-weit installiert, versioniert, checksum-geprüft
   ↓
Wrapper         setzt die Sicherheitsgrenzen (die einzige Binary in einer .mcp.json)
   ↓
Projekt         aktiviert den MCP-Server einzeln via /cbm enable
   ↓
ECC-Workflow    RESEARCH → PLAN → IMPLEMENT → REVIEW → VERIFY
```

**Warum nicht global aktivieren?** Jeder aktive MCP-Server kostet Kontext-Budget
(1 Server + 8 Tools) in *jeder* Session — auch dort, wo es nichts zu indexieren gibt.
Das Harness lässt maximal 10 Server / 80 Tools zu. Also: Binary einmal, Aktivierung
bewusst pro Projekt.

## Warum nicht der Upstream-Auto-Installer

`codebase-memory-mcp install` erkennt alle installierten Agents und schreibt ungefragt
MCP-Einträge, Instruction-Dateien, Skills **und einen PreToolUse-Hook auf Grep/Glob**.
Das ist genau die Sorte unkontrollierter Fernwirkung, die dieses Harness ausschließt.
Ebenso ausgeschlossen: `curl … | bash`, unversionierte `latest`-Downloads, die
UI-Variante (Port 9749) und automatische Updates.

Stattdessen: `release.json` pinnt Version + SHA-256, `manage.sh` lädt genau dieses
Artefakt, prüft die Checksumme **fail-closed**, startet die Binary testweise und
schaltet erst dann atomar um.

## Installation

```bash
./install-vps.sh --with-cbm            # Binary + /cbm + Skill (opt-in)
./install-vps.sh --with-cbm --dry-run  # nur den Plan zeigen
./install-vps.sh --cbm-verify          # Installation prüfen (read-only)
./install-vps.sh --cbm-check-update    # auf neue Release prüfen (read-only)
```

Ohne `--with-cbm` verhält sich `install-vps.sh` exakt wie vorher.

Direkt: `bash bestpractice-extras/scripts/cbm/manage.sh <action>` mit
`status · dry-run · install · verify · check-update · rollback · uninstall · purge-cache`.

## Sicherheitsgrenzen (im Wrapper gesetzt, per Env überschreibbar)

| Variable | Wert | Warum |
|---|---|---|
| `CBM_ALLOWED_ROOT` | `/root/projekte` | `index_repository` ausserhalb wird abgelehnt (realpath-geprüft) |
| `CBM_CACHE_DIR` | `~/.cache/codebase-memory-mcp` (0700) | Graph-DBs + CBM-Config |
| `CBM_LOG_LEVEL` | `warn` | stdout bleibt für MCP-JSON-RPC frei |
| `CBM_MEM_BUDGET_MB` | `512` | **bewusst gesetzt.** Ohne Deckel bemisst CBM den In-Memory-Graph als Bruchteil des *Gesamt*-RAMs (7,9 GB) — davon sind auf diesem VPS ~5 GB durch ~13 Container belegt. Ein ungedeckelter Graph treibt das System ins Swappen. |
| `umask 077` | — | keine welt-lesbaren Artefakte |

Zusätzlich nach der Installation gesetzt: `auto_index=false`, `auto_watch=false` —
**es wird nur explizit indexiert**, es läuft kein Hintergrund-Watcher.

## Projekt aktivieren

```text
/cbm status    Binary, Wrapper, MCP-Eintrag, .cbmignore, Index, Grenzen, Warnungen
/cbm enable    .mcp.json additiv + .cbmignore + indexieren + Smoke-Test  (Dry-Run → OK)
/cbm reindex   Index neu aufbauen (nach größeren Änderungen nötig)
/cbm doctor    volle Diagnose inkl. Secret-Ausschluss und Budget
/cbm disable   entfernt NUR den eigenen .mcp.json-Eintrag; Index bleibt
```

Alternativ beim Onboarding: `/ecc-onboard --with-cbm`. Beide Wege rufen dieselbe
Logik (`project.js`) — es gibt keine zweite Implementierung.

**Nach `enable`/`disable` muss die Claude-Code-Session neu gestartet werden** —
MCP-Server werden nur beim Session-Start geladen.

## Ein Quellprojekt = ein Index

Nicht als getrennte Projekte indexieren:

- Deploy-Kopien unter `/var/www/*` **zusätzlich** zum Quell-Repo → nur das Quell-Repo.
- Git-Worktrees, die nur Prod-/Staging-Stände abbilden (Werkstatt: `test`/`prod`/`staging`)
  → nur den kanonischen Worktree.
- `/root/projekte` als ein einziges Mega-Projekt → wird von `checkPath()` aktiv abgelehnt.
- Build-, Cache- und Backup-Verzeichnisse.

Kanonische Quellpfade bei Mehrfach-Deployments:

| Projekt | Kanonischer Index | Nicht indexieren |
|---|---|---|
| WMS | `/root/projekte/WMS_Live` | `/var/www/lager-codex*`, `WMS_Test` |
| Werkstatt | `/root/projekte/Werkstattauftraege_codex` | Worktrees `-prod`, `-staging` |
| UVV | `/root/projekte/UVV_Pruefung` | — |

Cross-Repo-Analyse (`mode: cross-repo-intelligence`) erst nutzen, wenn die Einzelindizes
dublettenfrei stehen.

## Update

Es gibt **kein** automatisches Update.

```bash
bash .../manage.sh check-update            # read-only: Pin vs. Upstream
# → checksums.txt der neuen Release holen, release.json von Hand pinnen
bash .../manage.sh install                 # atomar, mit Rollback-Ziel
bash .../manage.sh verify
```

## Rollback und Deinstallation

```bash
/cbm disable                    # Projekt: nur der eigene MCP-Eintrag verschwindet
bash .../manage.sh rollback     # Binary: atomar zurück auf die vorherige Version
bash .../manage.sh uninstall    # Wrapper + Installation weg; Cache bleibt
CBM_CONFIRM=PURGE-CACHE bash .../manage.sh purge-cache   # destruktiv, ausdrücklich
```

`uninstall` fasst weder Projektquellcode noch andere MCP-Server, ECC, RTK, `state/`
oder den Graph-Cache an. Cache-Löschung ist eine gesonderte, bestätigte Einzelaktion.

## Tests

```bash
node bestpractice-extras/scripts/cbm/selftest.js          # 37 Unit-Tests, offline+gemockt (CI)
bash bestpractice-extras/scripts/cbm/integration-test.sh  # live gegen die echte Binary
```

Der Integrationstest legt eine Secret-Fixture an (`.env`, `private.key`, `state/` mit
Sentinels), indexiert sie und belegt, dass kein Sentinel im Graphen landet — der
Quellcode aber sehr wohl. Er läuft bewusst **nicht** in der CI.

## Bekannte Grenzen

- **Der MCP-Server exponiert nur 8 der 14 Tools** aus dem README. `list_projects`,
  `index_status`, `detect_changes`, `delete_project`, `manage_adr` und `ingest_traces`
  stehen nicht in `tools/list` — sie sind nur über die CLI erreichbar (an v0.9.0 gemessen).
- **`file_pattern` in `search_graph` ist ein Literal-Substring, kein Regex** — eine
  Regex wie `.*\.tsx$` liefert still `total=0`. `name_pattern` dagegen *ist* eine Regex.
  `search_code` will `pattern` (nicht `query`).
- **Statische Analyse hat Lücken:** dynamische Aufrufe, Reflection, Event-Bus, Callbacks,
  DI-Container, generierter Code. „Kein Aufrufer im Graphen" ≠ „toter Code".
- **Der Index ist ein Snapshot.** Ohne `auto_watch` veraltet er — nach größeren Änderungen
  `/cbm reindex`.
- **Attestation wird übersprungen:** die Releases tragen Sigstore-`.bundle`-Dateien, aber
  die hier installierte `gh`-Version (2.45) kennt `gh attestation` nicht. Sobald sie neu
  genug ist, prüft `manage.sh` automatisch mit. SHA-256 bleibt in jedem Fall Pflicht.

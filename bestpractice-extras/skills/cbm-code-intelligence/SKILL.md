---
name: cbm-code-intelligence
description: Nutze Codebase Memory (CBM) als strukturelles Code-Intelligence-Backend im ECC-Workflow — Architektur, Symbole, Aufrufketten und Blast Radius abfragen, statt blind Dateien zu durchsuchen. Lädt bei Aufgaben, die die Struktur einer indexierten Codebasis betreffen: Einstiegspunkte finden, Aufrufer/Aufgerufene verfolgen, Auswirkungen einer Änderung abschätzen, Hotspots und tote Pfade erkennen. Nur in Projekten mit aktiviertem codebase-memory-MCP.
---

# Codebase Memory als Code-Intelligence-Backend

CBM indexiert den **tatsächlichen Quellcode** in einen Graphen (Dateien, Klassen,
Funktionen, Routen, Aufrufkanten). Es ist ein Analysewerkzeug — **kein Gedächtnis,
kein Projektstand und kein Beweis für Korrektheit.**

> **Verbindlich ist die globale Regel** `~/.claude/rules/ecc-extras/cbm-workflow.md`.
> Dieser Skill liefert die ausführliche **Methodik** dazu (Tool-Semantik, Fallstricke,
> Grenzen). Bei Widersprüchen gilt die Regel, nicht der Skill.

## ECC bleibt führend

**ECC entscheidet, wann Research, Plan, Implementierung, Review und Verify stattfinden.**
CBM unterstützt diese Phasen ausschließlich mit strukturellem Codewissen — es entsteht
**kein paralleler Workflow**.

CBM **ersetzt nicht**: `/plan` · `/feature-dev` · TDD · `/code-review` · sprachspezifische
Reviewer · Tests · Build · LSP · Memory-MCP · `state/` · Codemaps.

## Wer weiß was (nicht verwechseln)

| Quelle | Beantwortet |
|---|---|
| **ECC** | den **Arbeitsprozess** — wann welche Phase, welcher Command, welches Gate |
| **Codebase Memory** | aktuelle **Code-Struktur und Abhängigkeiten** |
| **Memory-MCP** | frühere **Entscheidungen und Wissen** aus vergangenen Sessions |
| **`state/` + `WORKING-CONTEXT.md`** | aktueller **Projektzustand**, offene Aufgaben |
| **Codemaps** (`docs/CODEMAPS/`) | versionierte **Architektur-Dokumentation** |
| **LSP** | **Typen** und Echtzeit-Diagnosen |
| **mgrep** | semantische **Textsuche** |

Fragen der Art „warum haben wir das so gebaut?" beantwortet **Memory**, nicht CBM.
Fragen der Art „was ruft diese Funktion auf?" beantwortet **CBM**, nicht Memory.

Bei **kleinen, eindeutig lokalen Änderungen** ist keine Graph-Abfrage nötig — Pflicht-
Abfragen bei Trivialitäten sind Verschwendung.

## Aufruf

Der MCP-Server heißt `codebase-memory` und exponiert **8 Tools**:
`index_repository` · `search_graph` · `query_graph` · `trace_path` · `get_code_snippet` ·
`get_graph_schema` · `get_architecture` · `search_code`.

**Nur diese 8 sind in Claude Code aufrufbar.** Das Upstream-README nennt 14 Tools —
`list_projects`, `index_status`, `detect_changes`, `delete_project`, `manage_adr` und
`ingest_traces` tauchen aber nicht in `tools/list` auf (an v0.9.0 gemessen). An die
kommst du nur über die CLI:

```bash
echo '{"project":"<name>"}' | codebase-memory-mcp-harness cli detect_changes
echo '{}' | codebase-memory-mcp-harness cli list_projects
```

Den **exakten Projektnamen** immer aus `list_projects` (CLI) oder `/cbm status` nehmen —
er wird aus dem *Pfad* abgeleitet (`/root/projekte/UVV_Pruefung` → `root-projekte-UVV_Pruefung`),
ist also nicht der Ordnername. Nie raten.

## Suchsemantik — die stille Null-Treffer-Falle

Die Pattern-Parameter verhalten sich **unterschiedlich**. Eine falsche Annahme liefert
keine Fehlermeldung, sondern still `total=0` — was leicht als „gibt es nicht" fehlgedeutet wird.

| Parameter | Semantik | Beispiel |
|---|---|---|
| `search_graph.name_pattern` | **Regex** | `.*Handler.*` |
| `search_graph.file_pattern` | **Literal-Substring** (kein Regex!) | `.tsx` ✔ · `.*\.tsx$` ✘ (0 Treffer) |
| `search_code.pattern` | Suchbegriff (Parameter heißt `pattern`, **nicht** `query`) | `formatDe` |
| `search_code.file_pattern` | **Glob** | `*.ts` |
| `search_code.path_filter` | **Regex** auf den Pfad | `^src/` |

Bei `total=0` also erst die Semantik prüfen, bevor du auf „nicht vorhanden" schließt.

## Einsatz im ECC-Workflow

### RESEARCH — vor breiten Dateisuchen

1. `/cbm status` → Projektname + Indexstand prüfen (nutzt intern `list_projects`).
2. Bei veraltetem Index: `/cbm reindex`.
3. `get_architecture` (`aspects: ["all"]`) → Sprachen, Pakete, Routen, Hotspots.
4. `search_graph` → relevante Symbole strukturell finden (Label + `name_pattern`).
5. `trace_path` → Aufrufketten in beide Richtungen verfolgen.
6. **Erst danach** gezielt Dateien lesen. Der Graph ersetzt das Lesen nicht — er sagt
   dir, *welche* Dateien überhaupt relevant sind.

### PLAN

Der Plan soll aus dem Graphen konkret benennen: betroffene Module · Einstiegspunkte ·
Call-Chain · betroffene Routen/Services · mögliche Seiteneffekte · erforderliche Tests.

### IMPLEMENT

CBM ersetzt **keine** Dateiprüfung. Vor jeder Änderung die betroffenen Quelldateien
tatsächlich lesen — der Graph kann veraltet oder unvollständig sein.

### REVIEW

- Blast Radius bestimmen. `detect_changes` ist **kein MCP-Tool** — nur über die CLI:

  ```bash
  echo '{"project":"<name>"}' | codebase-memory-mcp-harness cli detect_changes
  ```

  Es setzt einen frischen Index voraus (`/cbm reindex` nach den Änderungen).
- Alternativ über MCP: geänderte Symbole per `search_graph` suchen und mit `trace_path`
  rückwärts (`direction: "callers"`) die Betroffenen ermitteln.
- Neue Abhängigkeiten und zentrale Hotspots prüfen (hohes `in_degree`).
- Graph-Befunde gegen Tests und echte Dateien gegenprüfen, nie ungeprüft übernehmen.

### VERIFY

Build und Tests sind die Quelle der Wahrheit. Ein Graph-Ergebnis belegt keine Korrektheit.

## Fallback — wenn der Graph nicht trägt

Ein leerer, widersprüchlicher oder offensichtlich unvollständiger Call-Graph ist ein
normaler Fall (dynamische Dispatches, Reflection, Callbacks, DI-Container, Templates,
frisch geänderte Dateien). Dann der Reihe nach:

1. **LSP** (Definitionen, Referenzen, Typen)
2. **exakte Suche** (Grep/Ripgrep)
3. **mgrep** bei konzeptueller Suche
4. **relevante Dateien direkt lesen**
5. **Unsicherheit ausdrücklich benennen** — nicht so tun, als sei der Graph vollständig.

## Grenzen statischer Analyse (kennen, nicht verschweigen)

Aufrufkanten, die erst zur Laufzeit entstehen, fehlen im Graphen: dynamische Aufrufe,
Reflection, Event-Bus und Callbacks, DI/Container-Verdrahtung, HTTP-Aufrufe zwischen
Services (nur heuristisch), generierter Code, Makros. „Kein Aufrufer im Graphen"
heißt **nicht** „toter Code" — es heißt „kein *statisch sichtbarer* Aufrufer".

## Eingeschränkte und verbotene Tools

- **`delete_project`** — nur nach ausdrücklicher Zustimmung des Nutzers. Nie beiläufig.
  Über MCP ist es nicht gelistet, also aus Claude Code heraus nicht erreichbar — über die
  CLI aber sehr wohl. Die Hürde ist also der Mensch, nicht das Protokoll.
- **`manage_adr`** — **nicht** als primäre Entscheidungsablage benutzen. Architektur-
  entscheidungen gehören in `state/decisions.md`, die Projektdokumentation und die
  versionierten ADR-Dateien des Projekts. Der CBM-Graph liegt im Cache und ist nicht
  versioniert — was nur dort steht, ist beim nächsten `purge-cache` weg.
- **`ingest_traces`** — nur nach bewusster Freigabe und mit dokumentierter Datenquelle
  (Traces können produktive Daten enthalten).
- **Keine Graph-Ergebnisse ungeprüft als dauerhafte Wahrheit** in Memory oder Codemaps
  schreiben. Erst gegen die echten Dateien verifizieren.

## Betrieb

`/cbm status` · `/cbm enable` · `/cbm reindex` · `/cbm doctor` · `/cbm disable`

Kein Auto-Indexing, kein Hintergrund-Watcher: Indexiert wird **nur explizit**. Nach
größeren Änderungen also bewusst `/cbm reindex` — sonst antwortet der Graph auf einem
veralteten Stand.

---
name: cbm-code-intelligence
description: Nutze Codebase Memory (CBM) als strukturelles Code-Intelligence-Backend im ECC-Workflow — Architektur, Symbole, Aufrufketten und Blast Radius abfragen, statt blind Dateien zu durchsuchen. Lädt bei Aufgaben, die die Struktur einer indexierten Codebasis betreffen: Einstiegspunkte finden, Aufrufer/Aufgerufene verfolgen, Auswirkungen einer Änderung abschätzen, Hotspots und tote Pfade erkennen. Nur in Projekten mit aktiviertem codebase-memory-MCP.
---

# Codebase Memory als Code-Intelligence-Backend

CBM indexiert den **tatsächlichen Quellcode** in einen Graphen (Dateien, Klassen,
Funktionen, Routen, Aufrufkanten). Es ist ein Analysewerkzeug — **kein Gedächtnis,
kein Projektstand und kein Beweis für Korrektheit.**

## Wer weiß was (nicht verwechseln)

| Quelle | Beantwortet |
|---|---|
| **Memory-MCP** | frühere Entscheidungen und Wissen aus vergangenen Sessions |
| **`state/` + `WORKING-CONTEXT.md`** | aktueller Projektstand, offene Aufgaben |
| **Codebase Memory** | tatsächliche Struktur des Quellcodes, *jetzt* |
| **Codemaps** (`docs/CODEMAPS/`) | versionierte, menschenlesbare Architektur-Snapshots |
| **LSP** | Echtzeit-Typen, Definitionen, Diagnosen |
| **mgrep** | unscharfe, semantische Text- und Dokumentensuche |

Fragen der Art „warum haben wir das so gebaut?" beantwortet **Memory**, nicht CBM.
Fragen der Art „was ruft diese Funktion auf?" beantwortet **CBM**, nicht Memory.

## Aufruf

Der MCP-Server heißt `codebase-memory` (14 Tools). Ohne aktive MCP-Session geht
dasselbe über die CLI:

```bash
echo '{"project":"<name>"}' | codebase-memory-mcp-harness cli get_architecture
```

Den **exakten Projektnamen** immer aus `list_projects` nehmen — er wird aus dem Pfad
abgeleitet und ist nicht der Ordnername. Nie raten.

## Einsatz im ECC-Workflow

### RESEARCH — vor breiten Dateisuchen

1. `list_projects` → Projektname + Indexstand prüfen (`/cbm status`).
2. Bei veraltetem Index: `/cbm reindex`.
3. `get_architecture` (`aspects: ["all"]`) → Sprachen, Pakete, Routen, Hotspots.
4. `search_graph` → relevante Symbole strukturell finden (Label + Name-Pattern).
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

- `detect_changes` → git-Diff auf betroffene Symbole + Blast Radius abbilden.
- Neue Abhängigkeiten und zentrale Hotspots prüfen.
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

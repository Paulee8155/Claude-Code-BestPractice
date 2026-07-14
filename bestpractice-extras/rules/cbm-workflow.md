# Codebase Intelligence mit Codebase Memory (Schicht 2)

**Verbindliche Regel.** Sie gilt **nur**, wenn im aktuellen Projekt der MCP
`codebase-memory` verfügbar ist (projektlokal aktiviert via `/cbm enable`). Ist er das
nicht, ist dieser Abschnitt gegenstandslos — dann gilt der ECC-Workflow unverändert.

Der Skill `cbm-code-intelligence` liefert die ausführliche Methodik (Tool-Semantik,
Fallstricke, Grenzen). **Bei Widersprüchen gilt diese Regel.**

---

## ECC bleibt führend

**ECC entscheidet, wann Research, Plan, Implementierung, Review und Verify stattfinden.**
Codebase Memory unterstützt diese Phasen ausschließlich mit **strukturellem Codewissen**.

Codebase Memory **ersetzt nicht**: `/plan` · `/feature-dev` · TDD · `/code-review` ·
sprachspezifische Reviewer · Tests · Build · LSP · Memory-MCP · `state/` · Codemaps.

Es entsteht **kein paralleler oder konkurrierender Workflow**. Der Graph ist ein
Nachschlagewerk innerhalb der 5 Phasen, keine eigene Pipeline.

---

## RESEARCH

Bei **nicht trivialen** Aufgaben — Bugs, Refactorings, Architekturfragen, Änderungen über
mehrere Dateien:

1. Prüfen, ob der Codegraph verfügbar und **aktuell genug** ist (`/cbm status`).
2. Architektur, relevante Symbole und Abhängigkeiten über Codebase Memory untersuchen.
3. Bei Bedarf Aufrufketten und mögliche Seiteneffekte verfolgen.
4. **Anschließend die tatsächlich betroffenen Quelldateien direkt lesen.**
5. Die Ergebnisse als Grundlage für `research.md` und den ECC-Plan verwenden.

Bei **kleinen, eindeutig lokalen Änderungen** ist **keine** Graph-Abfrage nötig. Eine
Tippfehlerkorrektur, ein Ein-Zeilen-Fix in einer bekannten Datei, ein Doku-Satz: einfach
machen. Pflicht-Abfragen bei Trivialitäten sind Verschwendung.

## PLAN

Der Plan soll — soweit für die Aufgabe relevant — enthalten:

- betroffene Module und Dateien
- Einstiegspunkte
- wichtige Aufrufketten
- abhängige Komponenten
- mögliche Seiteneffekte
- notwendige Tests

## IMPLEMENT

**Codebase Memory ersetzt niemals das Lesen der echten Quelldateien.** Vor einer Änderung
werden die relevanten Dateien direkt geprüft. Graph-Ergebnisse dürfen **nicht ungeprüft als
Wahrheit** behandelt werden.

## REVIEW

Nach größeren Änderungen, Refactorings oder Änderungen über mehrere Module:

- betroffene Abhängigkeiten erneut prüfen
- Blast Radius untersuchen
- neue oder unbeabsichtigte Kopplungen suchen
- Graph-Ergebnisse mit Quellcode, Build und Tests verifizieren

## VERIFY

**Tests, Typecheck, Lint und Build bleiben die Quelle der Wahrheit.** Codebase Memory ist
eine Navigations- und Analysehilfe, **kein Korrektheitsbeweis**.

---

## Aktualität des Graphen

`auto_index=false` und `auto_watch=false` sind bewusst gesetzt — der Index aktualisiert sich
**nicht** von selbst. `/cbm reindex` ist fällig:

- nach größeren Features
- nach umfangreichen Refactorings
- nach großen Pulls oder Merges
- bei offensichtlich veralteten Ergebnissen

Nach jeder einzelnen Datei zu reindexieren ist **nicht** nötig.

## Fallback

Liefert Codebase Memory keine, unvollständige oder widersprüchliche Ergebnisse — was bei
dynamischen Aufrufen, DI, Reflection und Callbacks **normal** ist:

1. LSP verwenden
2. Grep/Ripgrep verwenden
3. mgrep für konzeptuelle Suche verwenden
4. relevante Dateien direkt lesen
5. **Unsicherheit im Research- oder Review-Ergebnis dokumentieren** — nicht so tun, als sei
   der Graph vollständig.

„Kein Aufrufer im Graphen" heißt **nicht** „toter Code", sondern „kein *statisch sichtbarer*
Aufrufer".

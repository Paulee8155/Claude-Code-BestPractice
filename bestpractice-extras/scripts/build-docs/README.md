# build-docs — Office-Snapshots aus Markdown bauen

Schicht-2-Tool. Erzeugt die Begleit-Dokumente reproduzierbar aus **einer** Markdown-Quelle,
damit Word/PowerPoint nicht mehr von Hand driften.

```
docs/ECC-Harness-Guide.de.md        ← Single Source (von Hand pflegen)
        │  python3 build.py
        ▼
docs/ECC-Harness-Guide.de.docx      ← gebaut, nicht von Hand editieren
docs/ECC-Harness-Guide.de.pptx      ← gebaut, nicht von Hand editieren
```

## Nutzung

```bash
# aus dem Repo-Root
python3 bestpractice-extras/scripts/build-docs/build.py          # baut docx + pptx
python3 bestpractice-extras/scripts/build-docs/build.py --check  # nur parsen + Statistik
```

**Regel:** Inhalt ausschließlich in `docs/ECC-Harness-Guide.de.md` ändern, dann neu bauen.
Die `.docx`/`.pptx` sind generierte Artefakte.

## Voraussetzungen

`python-docx` und `python-pptx` (auf der VPS vorhanden):

```bash
pip3 install --upgrade python-docx python-pptx --break-system-packages
```

## Unterstütztes Markdown-Subset

Bewusst klein gehalten (eigener Parser, keine externe Markdown-Lib):

| Markdown | docx | pptx |
| --- | --- | --- |
| `# Titel` (1×, ganz oben) | Titelseite | Titelfolie (dunkel) |
| `> …` vor dem 1. Kapitel | Untertitel der Titelseite | Untertitel der Titelfolie |
| `## N · Kapitel` | Heading 1 | je eine Folie (Überlauf → „(Forts.)") |
| `### Unterabschnitt` | Heading 2 | fette Zeile auf der Folie |
| `\| a \| b \|` (+ `---`-Zeile) | Word-Tabelle (Light Grid Accent 1) | Bullets `Header` / `Zelle — Zelle` |
| `- item` | Aufzählung | Bullet |
| ` ``` ` Codeblock | Monospace + Schattierung | Monospace-Bullet |
| `> callout` (im Kapitel) | eingerückte Hinweis-Box | `▸`-Bullet |
| `**bold**` `*italic*` `` `code` `` | inline | inline (Marker werden in pptx entfernt) |

## docx-Besonderheit

Das Inhaltsverzeichnis ist ein echtes Word-`TOC`-Feld (sammelt Heading 1–2). Beim ersten
Öffnen in Word mit **F9** aktualisieren (oder „Felder aktualisieren").

## Verifikation nach dem Build

```bash
# Kapitelstruktur prüfen
markitdown docs/ECC-Harness-Guide.de.docx | grep -E "^#{1,2} "
# echte Heading-Styles (= TOC-Einträge) zählen
python3 -c "from docx import Document; d=Document('docs/ECC-Harness-Guide.de.docx'); print(sum(1 for p in d.paragraphs if p.style.name.startswith('Heading')))"
```

---
description: Tagesstart in einem Befehl — frischer Kontext aus state/ (State-Sync PRE), claude-mem-Hinweis, rtk-Budget, optionales Session-Resume, heutige Now/Next-Agenda und GENAU EIN empfohlener ECC-Folgebefehl. Additiver Schicht-2-Wrapper, ECC-Core unberührt.
---

# /start

Der **Ein-Befehl-Tagesstart**. Komponiert ausschließlich **vorhandene** Bausteine zu einem
flüssigen Einstieg: Kontext laden → Budget zeigen → Agenda → ein empfohlener Folgebefehl.
Erfüllt die 1-bis-2-Befehle-Vision (`/start` + 1× bestätigter ECC-Folgebefehl). Rein additiver
Wrapper nach dem `/mega-plan`-Muster — ECCs Dev-Agenten, Loop und Core bleiben unangetastet.

## Wann

- **Zu Beginn jeder Arbeitssession** in einem ECC-onboardeten Projekt.
- Nach `/clear` oder einem neuen Tag, um State, Budget und Agenda frisch zu spiegeln.
- NICHT für die Erst-Einrichtung — dafür `/ecc-onboard` (macht das Projekt ECC-ready).

## Verwendung

```text
/start                 # voller Tagesstart im aktuellen Projekt
/start --quick         # nur Kontext + Agenda (überspringt Resume-Briefing)
/start --no-suggest    # ohne Folgebefehl-Empfehlung (nur Lagebild)
```

## Feste Pfade (VPS srv1051228)

```bash
EXTRAS="/root/projekte/Claude Code BestPractice/bestpractice-extras"
STATE_SYNC="$EXTRAS/scripts/state-sync/state-sync.js"
```
Absoluter Pfad, damit `/start` aus **jedem** onboardeten Projekt läuft — nicht nur aus dem
BestPractice-Repo.

## Ablauf

### Schritt 0 — Guard (read-only)
Prüfen, ob im Projekt-Root ein `state/`-Verzeichnis existiert.
- **Fehlt es:** kurz hinweisen „Projekt noch nicht ECC-ready" und `/ecc-onboard` vorschlagen,
  dann **graceful** mit reduziertem Flow (Schritte 2–3 + 6) fortfahren statt abzubrechen.
- **Vorhanden:** voller Flow.

### Schritt 1 — State-Sync PRE (Kontext spiegeln)
```bash
node "$STATE_SYNC" pre --project "<PROJEKT-ROOT>"
```
Erzeugt/aktualisiert `WORKING-CONTEXT.md` **idempotent** aus `state/` (STATE-Zonen frisch
gespiegelt, SYNC-Inbox + Mensch-Inhalt bewahrt). Sicher mehrfach aufrufbar. Erwartete Ausgabe:
`[state-sync] PRE ok: WORKING-CONTEXT.md aus state/ generiert`.

### Schritt 2 — claude-mem (Cross-Session-Gedächtnis)
Darauf hinweisen, dass claude-mem ab der 2. Session je Projekt relevanten Kontext **automatisch**
injiziert. Gezieltes Nachschlagen anbieten über die Skill `claude-mem:mem-search`, z.B.:
„Woran haben wir zuletzt gearbeitet?" / „Gibt es offene Punkte aus der letzten Session?"
Nur anbieten, nicht erzwingen.

### Schritt 3 — rtk gain (Token-Budget)
```bash
rtk gain
```
Token-Budget und kumulierte Einsparungen zu Tagesbeginn sichtbar machen (zugleich
Lebenszeichen, dass das Custom-Tool reagiert). Kompakt zusammenfassen, nicht die Rohtabelle dumpen.

### Schritt 4 — Session-Resume (optional, entfällt bei `--quick`)
Falls `~/.claude/session-data/` eine **jüngste** `*-session.tmp` enthält, ein knappes
Resume-Briefing nach `/resume-session`-Muster anbieten:
- **Was lief** (letzter Stand),
- **Was NICHT noch einmal versuchen** (Sackgassen der letzten Session),
- **Exact Next Step**.
Bei mehreren Projekten nur die zum aktuellen Projekt passende Session heranziehen.

### Schritt 5 — Heutige Agenda
Aus `WORKING-CONTEXT.md` bzw. `state/tasks.md` die Sektionen **`### Now`** und **`### Next`**
extrahieren und kompakt als heutige Agenda auflisten (max. ~7 Punkte). Leere Sektionen still
überspringen.

### Schritt 6 — Folgebefehl empfehlen (KEIN Auto-Start; entfällt bei `--no-suggest`)
Aus Now/Next + Exact-Next-Step **genau einen** ECC-Einstieg heuristisch empfehlen — der Nutzer
bestätigt (entspricht „PLAN wartet auf OK"). Das ist der **2. Befehl** der Vision.

| Aufgaben-Signal | Empfehlung |
|---|---|
| vage/vielschichtig, echte Trade-offs | `/mega-plan <Ziel>` |
| klar umrissene, planbedürftige Aufgabe | `/plan` |
| konkretes Feature, Plan steht | `/feature-dev` |
| Bug / unerwartetes Verhalten | `/systematic-debugging` (superpowers) |
| nur kleine, klare Änderung | direkt umsetzen + `/code-review` |

Nichts automatisch starten — die Empfehlung als Vorschlag formulieren und auf das OK warten.

## Garantien

- **Rein additiv:** schreibt nur via `state-sync pre` am Projekt-Root (atomar, tmp+rename) und
  liest sonst nur. **Keine** Datei unter `ecc/` wird berührt.
- **Idempotent:** mehrfacher `/start`-Aufruf ist sicher (State-Sync PRE ist idempotent).
- **Graceful:** fehlt `state/`, läuft der reduzierte Flow statt zu scheitern.
- **Universell:** absoluter `EXTRAS`-Pfad → funktioniert aus jedem onboardeten Projekt.

## Verwandt

- `/ecc-onboard` — Projekt ECC-ready machen (Voraussetzung für den vollen Flow)
- `/resume-session` · `/save-session` — ECC-Session-Persistenz (Schritt 4 nutzt deren Muster)
- `/mega-plan` · `/plan` · `/feature-dev` — empfohlene Folgebefehle (Schritt 6)
- `bestpractice-extras/scripts/state-sync/` — State-Sync-Adapter (PRE/POST)

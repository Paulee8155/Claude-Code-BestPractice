# Codex Companion — Nutzungs-Guide

> **Die eine Regel:** Du arbeitest **immer in Claude Code**. Codex ist ein Werkzeug, das
> Claude für dich ruft — nie ein Ort, an dem du selbst arbeitest. Keine Codex CLI, keine
> `AGENTS.md`, kein Codex-Harness in Projekten.

---

## 1. Was Codex ist — und was nicht

Codex ist eine **zweite, unabhängige Meinung mit eigenem Modell (GPT-5.5)**. Sein Wert liegt
genau darin, dass er *nicht* Claude ist: Er hat Claudes Denkfehler nicht mitgemacht und kennt
den Kontext nicht, in den Claude sich verrannt hat.

Daraus folgt die ganze Nutzungsstrategie:

| Codex ist stark, wenn … | Codex ist Verschwendung, wenn … |
|---|---|
| Claude etwas schon einmal versucht hat und es nicht ging | die Aufgabe trivial ist (Claude ist schneller) |
| du wissen willst, ob eine Lösung *wirklich* trägt | es keine Akzeptanzkriterien gibt |
| ein Bug hartnäckig ist und die Ursache unklar | die Produktentscheidung noch offen ist |
| du vor Live-Gang ein Sicherheitsnetz brauchst | du nur schnell etwas umbenennen willst |

**Faustregel:** Delegiere an Codex erst, wenn der *erste* Versuch gescheitert ist — oder wenn
etwas produktiv geht.

---

## 2. Die fünf Befehle

| Befehl | Schreibt? | Wofür |
|---|---|---|
| `/codex:review --base <ref> --background` | nein | Standard-Review nach größeren Änderungen |
| `/codex:adversarial-review --base <ref> --background` | nein | Vor Live-Gang: Codex *greift* die Lösung *an* |
| `/codex:rescue --background <auftrag>` | **JA** | Hartnäckiger Bug, gescheiterter Versuch |
| `/codex:status` · `/codex:result` | nein | Hintergrundjob prüfen / Ergebnis abholen |
| `/codex:cancel` | nein | Job abbrechen |

`--background` ist auf diesem 2-Kern-VPS fast immer richtig: Du arbeitest in Claude weiter,
während Codex denkt.

---

## 3. Dein neuer Workflow

ECC bleibt unverändert das Rückgrat. Codex hängt sich an **genau zwei Stellen** ein:

```
RESEARCH → PLAN → IMPLEMENT → REVIEW → VERIFY
                      ↓          ↓
              (nur wenn      IMMER bei
               gescheitert)  größeren Änderungen
                      ↓          ↓
              /codex:rescue   /codex:review
```

**Alles andere bleibt wie es ist.** Codex ersetzt keinen ECC-Schritt, er verstärkt zwei.

---

## 4. Vier feste Routinen

### Routine A — „Ich hänge fest" (der häufigste Fall)

Auslöser: **Ein Versuch ist gescheitert.** Nicht früher.

```bash
bash bestpractice-extras/scripts/codex/preflight.sh   # muss GO sagen
```
```text
/codex:rescue --background Reproduziere zuerst den Fehler, dann behebe ihn.

Kontext:
- Lies PROJECT_RULES.md und state/context.md zuerst.
- Bleib im aktuellen Repository und Worktree.
- Kein Deploy, kein Service-Neustart, keine Produktivdatenbank.
- Reproduziere den Fehler ZUERST.
- Schreibe einen Regressionstest, der ohne den Fix rot ist.
- Kleinstmöglicher sicherer Fix. Keine API-Änderung ohne Not.
- Führe nur die relevanten Tests aus.
- Berichte: geänderte Dateien, Tests, verbleibende Risiken.
```
Danach **immer**:
```bash
git status --short && git diff --stat && git diff
```
Claude prüft den Diff und lässt die Tests laufen. **Nichts wird ungeprüft übernommen.**

> ⚠️ Während ein Rescue-Job läuft: **dieselben Dateien nicht in Claude bearbeiten.**

### Routine B — „Ich habe was Größeres gebaut"

Nach jedem Feature, vor dem Commit. Read-only, kostet dich nichts außer Wartezeit.

```bash
git branch --show-current                                  # Base NIE raten
git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null
```
```text
/codex:review --base <der-richtige-base> --background
```
Später: `/codex:status` → `/codex:result`.

Claude sortiert jeden Befund in vier Kategorien:
**bestätigter Fehler** · **sinnvolle Verbesserung** · **nicht zutreffend** · **deine Entscheidung**.

### Routine C — „Das geht live" (Pflicht bei WMS & Werkstatt)

Vor jedem manuellen Deployment auf einen produktiven Dienst:

```text
/codex:adversarial-review --base <base> --background Greife die Implementierung an:
Auth-Bypass, Datenverlust, SQLite-Locking/Korruption, Races, Rollback,
Migrationssicherheit, fehlende Transaktionsgrenzen, Staging-vs-Prod-Vermischung.
```

### Routine D — „Zweite Meinung zur Architektur"

Vor einer teuren Entscheidung, die schwer zurückzudrehen ist: `/codex:rescue --background`
mit der Frage statt einem Auftrag („Bewerte Ansatz X gegen Y für …, nenne Fehlerfälle").
Codex schreibt dann nichts — er antwortet.

---

## 5. Die harten Grenzen

- **Kein Deployment.** Ein grüner Fix ist kein Deploy. Alle Deployments hier sind manuell.
  Claude berichtet immer getrennt: Code geändert · Tests grün · **Deployment: nein** ·
  empfohlener manueller Schritt.
- **Nur im Quell-Repo.** `/var/www/lager-codex*` sind Deploy-Kopien, keine Arbeitskopien.
- **Werkstatt:** `test` / `prod` / `staging` sind Worktrees desselben Repos. Codex bleibt im
  aktuellen. Nie einen Branch auschecken, der anderswo schon ausgecheckt ist.
- **Keine Produktivdaten.** Tests nur gegen Testdaten oder Kopien — nie gegen die Live-SQLite.
  Dass nachts gesichert wird, ist **keine** Erlaubnis.
- **Der Systemarchitektur-Auto-Job (07:00) ist tabu.** Er läuft bewusst isoliert, ohne Plugins.
  Dort wird Codex nie geladen. Eine interaktive Session im Repo darf ihn nutzen.
- **Review-Gate bleibt aus** (`stopReviewGate: false` — Plugin-Default). Es würde nach jedem
  Turn automatisch Codex rufen: CPU, RAM und dein Kontingent. Nicht einschalten.

---

## 6. Kapazität — auf diesem VPS kein Detail

2 Kerne · 7,8 GB RAM · ~19 GB freier Speicher · 13 Container. Codex ist ein *zweiter* Agent,
der um dieselben Ressourcen kämpft.

**Vor jedem schreibenden Job:**
```bash
bash bestpractice-extras/scripts/codex/preflight.sh
```
`GO` → Rescue erlaubt · `READ-ONLY` → nur Review · `STOP` → gar nichts.

Maximal **ein** schreibender Codex-Job gleichzeitig. Nie parallel zu einem Docker-Build.

---

## 7. Spickzettel

```bash
# Hängt fest? → erst Preflight, dann:
/codex:rescue --background <präziser Auftrag + Akzeptanzkriterien>

# Was gebaut? → vor dem Commit:
/codex:review --base <base> --background

# Geht live? → vorher:
/codex:adversarial-review --base <base> --background

# Läuft noch?
/codex:status    →    /codex:result
```

**Merksatz:** *Claude plant, entscheidet und integriert. Codex prüft und rettet. Deployen tust du.*

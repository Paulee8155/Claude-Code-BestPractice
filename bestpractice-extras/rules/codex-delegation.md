# Codex-Delegation (Schicht 2)

Codex läuft auf diesem VPS **ausschließlich als Companion**: als Plugin `codex@openai-codex`,
aufgerufen aus einer Claude-Code-Session über `/codex:*`. Es gibt **keinen Codex-nativen
Betrieb** — keine Arbeit in der Codex CLI, keine `AGENTS.md`, kein projektlokaler
Codex-Harness. Claude Code + ECC ist der führende Agent und der einzige Orchestrator.

## Rollenteilung

**Claude behält immer:** Anforderungen · Planung · Architekturentscheidungen · Zerlegung der
Arbeit · Projektkontext · Integration der Ergebnisse · finale Tests · Deploy-Entscheidungen.

**Codex bekommt:** unabhängige Root-Cause-Analysen · hartnäckige Bugs, an denen ein erster
Versuch gescheitert ist · fehlgeschlagene Tests · klar abgegrenzte Implementierungen mit
Akzeptanzkriterien · eine zweite unabhängige Implementierungsvariante · unabhängige
Code-Reviews · adversariale Risiko-Reviews.

**Nie delegieren:** triviale Änderungen (Claude ist schneller) · unklare Produktentscheidungen ·
Aufgaben ohne Akzeptanzkriterien · Änderungen an produktiven Daten · Deployments und
Dienstneustarts · parallele Änderungen an denselben Dateien, die Claude gerade bearbeitet.

## Verbindliche Leitplanken

- **Kein Befund wird automatisch übernommen.** Claude kategorisiert jeden Codex-Befund als
  *bestätigter Fehler* · *sinnvolle Verbesserung* · *nicht zutreffend* · *menschliche
  Entscheidung erforderlich* — und begründet die Einordnung.
- **Reviews sind read-only.** Nur `/codex:rescue` schreibt.
- **Während eines schreibenden Rescue-Jobs bearbeitet Claude dieselben Dateien nicht.**
- **Base-Branch nie raten.** Vor jedem Review `git branch --show-current`,
  `git symbolic-ref refs/remotes/origin/HEAD` und `git worktree list` prüfen. Auf diesem VPS
  existieren `main`, `master`, `Test`, `test`, `prod`, `staging` nebeneinander.
- **Codex bleibt im aktuellen Repository und Worktree.** Kein Branch-Wechsel auf einen Branch,
  der in einem anderen Worktree ausgecheckt ist (Werkstatt: `test`/`prod`/`staging`).
- **Ein erfolgreicher Fix ist kein Deployment.** Alle Deployments auf diesem VPS sind manuell.
  Claude berichtet danach getrennt: Code geändert (ja/nein) · Tests grün (ja/nein) ·
  Deployment durchgeführt (**immer nein**) · empfohlener manueller Deploy-Schritt.
- **Nur im Quell-Repo arbeiten.** `/var/www/*` sind Deploy-Kopien, keine Arbeitskopien.
  Produktive SQLite-Dateien nie für Tests verwenden — Testdaten oder Kopie.
- **Review-Gate bleibt aus.** Kein automatischer Claude↔Codex-Loop (CPU/RAM/Kontingent).
  Aktivierung nur pro Projekt nach ausdrücklicher Entscheidung.

## Der Systemarchitektur-Auto-Job ist tabu

`sysarch-doc-update.timer` (täglich 07:00) läuft bewusst isoliert: keine globalen Plugins,
leere MCP-Konfiguration, Werkzeug-Whitelist, Schreibguard, Git-Gate, Secret-Scan.
Dort wird **nie** Codex geladen oder aufgerufen. Eine interaktive Session im
Systemarchitektur-Repo darf Codex nutzen — der autonome Lauf nicht.

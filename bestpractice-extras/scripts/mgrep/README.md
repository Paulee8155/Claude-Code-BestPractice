# mgrep — semantische Code-/Doku-Suche (Schicht-2-Tool)

`mgrep` (`@mixedbread/mgrep`) ersetzt grep/ripgrep durch semantische Suche
(~50 % Token-Ersparnis laut Shortform-/Longform-Guide). Es indexiert den
Quellbaum in der Mixedbread-Cloud und sucht dann konzeptuell statt nur per
Pattern.

## Einrichtung (einmalig)

1. **CLI installieren:** `npm install -g @mixedbread/mgrep`
2. **API-Key holen:** auf [platform.mixedbread.com](https://www.platform.mixedbread.com)
   → API Keys → neuen Key erzeugen (`mxb_…`).
3. **Key hinterlegen** im `env`-Block von `~/.claude/settings.json`:
   ```json
   { "env": { "MXBAI_API_KEY": "mxb_…" } }
   ```
   (User-scoped, nicht im Repo. Headless-Weg laut mgrep-Doku — umgeht den
   Browser-Login komplett.)

## Index aufbauen / aktualisieren

```bash
bash bestpractice-extras/scripts/mgrep/index.sh
```

- Liest den Key aus `settings.json`, setzt `MGREP_MAX_FILE_COUNT=3000`
  (das Repo hat ~2,5 k Dateien inkl. vendored `ecc/`-Core) und startet
  `mgrep watch`.
- Nach dem initialen Sync (`processed / uploaded`) mit **Ctrl+C** beenden.
  Der hochgeladene Store bleibt durchsuchbar — `watch` muss nicht laufen.

## ⚠️ Outbound-Hinweis

`mgrep watch` lädt Dateiinhalte in die **externe Mixedbread-Cloud**. Pro Repo
eine bewusste Entscheidung. Für dieses Harness-Repo (keine Secrets im Code,
`ecc/`-Core ist ohnehin public) unkritisch. `.gitignore` wird respektiert.
Der Claude-Code Auto-Mode blockt den Bulk-Upload bewusst — deshalb wird er
manuell über dieses Script angestoßen.

## Suchen

```bash
mgrep search "wie werden agent-modelle zugewiesen"     # semantisch
mgrep search "consumer scaffold onboarding"            # konzeptuell
```

Key wird automatisch aus `settings.json` gezogen, sobald die Session ihn als
Env-Var geladen hat (gilt ab der nächsten Claude-Session nach Eintrag).

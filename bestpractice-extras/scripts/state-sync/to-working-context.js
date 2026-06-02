'use strict';

/**
 * PRE-Sync: state/*.md  ->  <projekt-root>/WORKING-CONTEXT.md
 *
 * Wird beim SessionStart (und manuell) aufgerufen. Generiert das Loop-Futter
 * idempotent aus der Quelle der Wahrheit (`state/`), bewahrt dabei die
 * Agenten-Eingabezonen (SYNC:*-inbox) verlustfrei und legt einen Snapshot fuer
 * den spaeteren Delta-Roundtrip (POST) an.
 *
 * Schreibt NUR <projekt-root>/WORKING-CONTEXT.md + den Snapshot — nie state/*.md.
 */

const path = require('path');
const L = require('./lib');

const PROGRESS_INBOX_DEFAULT =
  '<!-- Agent/Loop: neue Erfolge hier eintragen (POST-Sync uebernimmt sie nach state/progress.md). -->';
const TASKS_INBOX_DEFAULT =
  '<!-- Agent/Loop: neu entdeckte ToDos hier eintragen (POST-Sync uebernimmt sie nach state/tasks.md). -->';

/** Rendert eine State-Datei in einen markierten Block (H2-Titel inklusive). */
function section(name, heading, raw) {
  const body = L.neutralizeMarkers(L.stripLeadingH1(raw).trim());
  const inner = body.length > 0 ? body : '_(noch leer — in `state/' + name + '.md` pflegen)_';
  return [
    L.stateMarker(name, 'START'),
    `## ${heading}`,
    '',
    inner,
    L.stateMarker(name, 'END'),
  ].join('\n');
}

/** Rendert eine Agenten-Eingabezone mit bewahrtem Inhalt. */
function inbox(name, heading, innerContent) {
  return [
    `## ${heading}`,
    '',
    L.syncMarker(name, 'START'),
    innerContent,
    L.syncMarker(name, 'END'),
  ].join('\n');
}

function buildWorkingContext(root, state, preserved) {
  const projectName = path.basename(root);
  return [
    '<!-- GENERIERT vom State-Sync-Adapter (Hybrid-Harness). NICHT von Hand editieren',
    '     ausserhalb der SYNC:*-Zonen. Quelle der Wahrheit: state/*.md.',
    '     Bei jedem SessionStart neu erzeugt; STATE:*-Bloecke werden ueberschrieben. -->',
    `# WORKING CONTEXT — ${projectName}`,
    '',
    '> Auto-generiert aus `state/`. STATE:*-Bloecke spiegeln die Quelle der Wahrheit',
    '> (read-only fuer den Loop). Neue Erfolge/ToDos gehoeren in die SYNC:*-Zonen unten —',
    '> der POST-Sync uebernimmt sie verlustfrei zurueck nach `state/`.',
    '',
    section('context', 'Purpose & Current Truth', state.context),
    '',
    section('decisions', 'Decisions', state.decisions),
    '',
    section('tasks', 'Active Queues', state.tasks),
    '',
    section('progress', 'Progress So Far', state.progress),
    '',
    '---',
    '<!-- SYNC-Append-Zonen: der Loop/Agent schreibt hier; POST parst sie zurueck. -->',
    '',
    inbox('progress-inbox', 'Latest Execution Notes', preserved.progress),
    '',
    inbox('tasks-inbox', 'New Tasks Discovered', preserved.tasks),
    '',
  ].join('\n');
}

function run(argv) {
  const root = L.resolveProjectRoot(argv);

  if (L.isForbiddenRoot(root)) {
    console.error(`[state-sync] PRE uebersprungen: '${root}' ist der ECC-Engine-Teilbaum.`);
    return { skipped: true };
  }
  if (!L.hasStateDir(root)) {
    // Fremdes/nicht-onboardetes Projekt -> still beenden.
    return { skipped: true };
  }

  const state = {};
  for (const name of L.STATE_FILES) {
    state[name] = L.readFileSafe(path.join(root, 'state', `${name}.md`));
  }

  // Bestehende Eingabezonen bewahren (noch nicht zurueckgesyncter Agenten-Input).
  const wcPath = path.join(root, L.WORKING_CONTEXT);
  const existing = L.readFileSafe(wcPath);
  const preserved = {
    progress:
      L.extractZone(existing, L.syncMarker('progress-inbox', 'START'), L.syncMarker('progress-inbox', 'END')) ||
      PROGRESS_INBOX_DEFAULT,
    tasks:
      L.extractZone(existing, L.syncMarker('tasks-inbox', 'START'), L.syncMarker('tasks-inbox', 'END')) ||
      TASKS_INBOX_DEFAULT,
  };

  const content = buildWorkingContext(root, state, preserved);
  L.writeFileAtomic(wcPath, content);

  // Snapshot fuer den POST-Delta-Vergleich.
  L.ensureDir(path.join(root, L.SYNC_DIR));
  L.writeFileAtomic(path.join(root, L.SNAPSHOT_FILE), content);

  console.error(`[state-sync] PRE ok: ${L.WORKING_CONTEXT} aus state/ generiert (${root}).`);
  return { skipped: false, wcPath };
}

module.exports = { run, buildWorkingContext };

if (require.main === module) {
  try {
    run(process.argv.slice(2));
  } catch (err) {
    // Hooks duerfen die Session nicht abbrechen: sichtbar loggen, Exit 0.
    console.error(`[state-sync] PRE FEHLER: ${err && err.message ? err.message : err}`);
  }
  process.exit(0);
}

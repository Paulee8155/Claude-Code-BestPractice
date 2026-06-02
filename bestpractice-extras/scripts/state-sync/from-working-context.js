'use strict';

/**
 * POST-Sync: <projekt-root>/WORKING-CONTEXT.md  ->  Delta nach state/*.md
 *
 * Wird beim Stop / PreCompact (und manuell) aufgerufen. Liest ausschliesslich
 * die Agenten-Eingabezonen (SYNC:progress-inbox / SYNC:tasks-inbox), bildet das
 * Delta gegen den letzten PRE-Snapshot und haengt nur die NEUEN Zeilen an
 * state/progress.md bzw. state/tasks.md an.
 *
 * Bewusst NICHT verarbeitet: die STATE:*-Bloecke. Sie sind read-only-Spiegel der
 * Quelle der Wahrheit; ihr Roundtrip wuerde Clobbering riskieren. Neue ToDos
 * gehoeren konventionsgemaess in die tasks-inbox-Zone.
 *
 * Schreibt NUR state/progress.md, state/tasks.md und den Snapshot — nie die
 * WORKING-CONTEXT.md selbst (vollstaendig nicht-destruktiv fuer den Loop).
 */

const path = require('path');
const L = require('./lib');

/** Haengt neue Zeilen unter einem getimestampten Marker an eine State-Datei an. */
function appendDelta(stateFilePath, newLines, stamp) {
  const existing = L.readFileSafe(stateFilePath);
  const base = existing.replace(/\s*$/, '');
  const block = [`<!-- via POST-sync ${stamp} -->`, ...newLines].join('\n');
  const next = `${base}\n\n${block}\n`;
  L.writeFileAtomic(stateFilePath, next);
}

function run(argv) {
  const root = L.resolveProjectRoot(argv);

  if (L.isForbiddenRoot(root)) {
    console.error(`[state-sync] POST uebersprungen: '${root}' ist der ECC-Engine-Teilbaum.`);
    return { skipped: true };
  }
  if (!L.hasStateDir(root)) {
    return { skipped: true };
  }

  const wcPath = path.join(root, L.WORKING_CONTEXT);
  const wc = L.readFileSafe(wcPath);
  if (!wc) {
    // Kein Loop-Futter -> nichts zurueckzuschreiben.
    return { skipped: true };
  }

  const snapshot = L.readFileSafe(path.join(root, L.SNAPSHOT_FILE));
  const stamp = L.isoStamp();

  const zone = (text, name) =>
    L.extractZone(text, L.syncMarker(name, 'START'), L.syncMarker(name, 'END')) || '';

  const progressDelta = L.diffNewLines(zone(wc, 'progress-inbox'), zone(snapshot, 'progress-inbox'));
  const tasksDelta = L.diffNewLines(zone(wc, 'tasks-inbox'), zone(snapshot, 'tasks-inbox'));

  if (progressDelta.length > 0) {
    appendDelta(path.join(root, 'state', 'progress.md'), progressDelta, stamp);
  }
  if (tasksDelta.length > 0) {
    appendDelta(path.join(root, 'state', 'tasks.md'), tasksDelta, stamp);
  }

  // Snapshot aktualisieren -> bereits gesyncter Input wird nicht erneut uebernommen.
  L.ensureDir(path.join(root, L.SYNC_DIR));
  L.writeFileAtomic(path.join(root, L.SNAPSHOT_FILE), wc);

  console.error(
    `[state-sync] POST ok: progress +${progressDelta.length}, tasks +${tasksDelta.length} (${root}).`
  );
  return { skipped: false, progress: progressDelta.length, tasks: tasksDelta.length };
}

module.exports = { run, appendDelta };

if (require.main === module) {
  try {
    run(process.argv.slice(2));
  } catch (err) {
    console.error(`[state-sync] POST FEHLER: ${err && err.message ? err.message : err}`);
  }
  process.exit(0);
}

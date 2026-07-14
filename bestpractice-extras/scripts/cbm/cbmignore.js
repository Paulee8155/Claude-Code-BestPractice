#!/usr/bin/env node
'use strict';

/**
 * cbmignore.js — pflegt den Managed Block in <projekt>/.cbmignore.
 *
 * Regeln:
 *   - Es wird ausschließlich der Bereich zwischen den Markern verwaltet.
 *     Alles davor und danach (Benutzerregeln) bleibt byte-identisch erhalten.
 *   - Idempotent: gleicher Inhalt → No-op. Veralteter Inhalt → nur der Block wird ersetzt.
 *   - Fail-closed bei unbalancierten Markern: Ein hängender START ohne END lässt sich
 *     nicht sicher abgrenzen — statt zu raten (und womöglich Benutzerregeln zu löschen)
 *     bricht das Skript ab und verlangt eine Handreparatur.
 *   - Entfernt wird der Block nur auf ausdrückliche Anforderung (remove).
 */

const fs = require('fs');
const path = require('path');

const START = '# BEGIN ECC-CBM MANAGED';
const END = '# END ECC-CBM MANAGED';
const TEMPLATE = path.resolve(__dirname, '..', '..', 'templates', 'cbmignore.template');

function ignorePath(root) { return path.join(root, '.cbmignore'); }

/** Der Soll-Block aus der Template-Datei (inkl. Marker, ohne Trailing-Newline). */
function managedBlock() {
  const tpl = fs.readFileSync(TEMPLATE, 'utf8').replace(/\r\n/g, '\n').trimEnd();
  if (!tpl.startsWith(START) || !tpl.endsWith(END)) {
    throw new Error(`${TEMPLATE}: Template muss mit "${START}" beginnen und mit "${END}" enden.`);
  }
  return tpl;
}

/** Findet den Managed Block. Wirft bei unbalancierten Markern. */
function locate(text) {
  const lines = text.split('\n');
  const starts = [];
  const ends = [];
  lines.forEach((l, i) => {
    if (l.trim() === START) starts.push(i);
    if (l.trim() === END) ends.push(i);
  });
  if (starts.length === 0 && ends.length === 0) return null;
  if (starts.length !== 1 || ends.length !== 1 || ends[0] < starts[0]) {
    throw new Error(
      '.cbmignore: Managed-Block-Marker sind beschädigt ' +
      `(${starts.length}× BEGIN, ${ends.length}× END). Abbruch — die Datei wird NICHT ` +
      'automatisch repariert, damit keine eigenen Regeln verloren gehen. ' +
      `Bitte die Marker "${START}" / "${END}" von Hand in Ordnung bringen.`
    );
  }
  return { from: starts[0], to: ends[0], lines };
}

/**
 * Legt den Managed Block an oder aktualisiert ihn.
 * @returns {{action: 'create'|'add'|'update'|'noop', file}}
 */
function apply(root, { apply: doWrite = false } = {}) {
  const file = ignorePath(root);
  const block = managedBlock();
  const existed = fs.existsSync(file);
  const cur = existed ? fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n') : '';
  const loc = locate(cur);   // wirft bei kaputten Markern

  let next;
  let action;
  if (!loc) {
    action = existed && cur.trim() !== '' ? 'add' : 'create';
    const head = cur.trim() === '' ? '' : (cur.endsWith('\n') ? cur : cur + '\n') + '\n';
    next = head + block + '\n';
  } else {
    const have = loc.lines.slice(loc.from, loc.to + 1).join('\n');
    if (have === block) return { action: 'noop', file };
    action = 'update';
    next = [...loc.lines.slice(0, loc.from), ...block.split('\n'), ...loc.lines.slice(loc.to + 1)].join('\n');
  }

  if (doWrite) {
    const tmp = path.join(path.dirname(file), `.cbmignore.tmp-${process.pid}`);
    fs.writeFileSync(tmp, next, { encoding: 'utf8', mode: 0o644 });
    fs.renameSync(tmp, file);
  }
  return { action, file };
}

/** Entfernt NUR den Managed Block (ausdrückliche Option). Benutzerregeln bleiben. */
function remove(root, { apply: doWrite = false } = {}) {
  const file = ignorePath(root);
  if (!fs.existsSync(file)) return { action: 'noop', file };
  const cur = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  const loc = locate(cur);
  if (!loc) return { action: 'noop', file };
  if (!doWrite) return { action: 'remove', file };

  const kept = [...loc.lines.slice(0, loc.from), ...loc.lines.slice(loc.to + 1)];
  while (kept.length && kept[kept.length - 1].trim() === '') kept.pop();
  const next = kept.length ? kept.join('\n') + '\n' : '';
  const tmp = path.join(path.dirname(file), `.cbmignore.tmp-${process.pid}`);
  fs.writeFileSync(tmp, next, { encoding: 'utf8', mode: 0o644 });
  fs.renameSync(tmp, file);
  return { action: 'remove', file };
}

/** Ist der vollständige, aktuelle Managed Block vorhanden? */
function isCurrent(root) {
  const file = ignorePath(root);
  if (!fs.existsSync(file)) return false;
  try {
    const cur = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
    const loc = locate(cur);
    if (!loc) return false;
    return loc.lines.slice(loc.from, loc.to + 1).join('\n') === managedBlock();
  } catch {
    return false;
  }
}

module.exports = { START, END, TEMPLATE, ignorePath, managedBlock, apply, remove, isCurrent };

if (require.main === module) {
  const [, , action, root] = process.argv;
  const target = path.resolve(root || process.cwd());
  try {
    if (action === 'apply') console.log(JSON.stringify(apply(target, { apply: true }), null, 2));
    else if (action === 'remove') console.log(JSON.stringify(remove(target, { apply: true }), null, 2));
    else if (action === 'status') console.log(JSON.stringify({ current: isCurrent(target) }, null, 2));
    else { console.error('Usage: cbmignore.js <apply|remove|status> [project-root]'); process.exit(2); }
  } catch (e) {
    console.error(`[cbm] ${e.message}`);
    process.exit(1);
  }
}

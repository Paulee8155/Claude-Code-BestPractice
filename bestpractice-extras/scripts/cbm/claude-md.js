#!/usr/bin/env node
'use strict';

/**
 * claude-md.js — trägt die kompakte, BEDINGTE CBM-Projektregel in eine
 * Projekt-`CLAUDE.md` ein. Idempotent, additiv, fail-closed.
 *
 * Die Regel ist bewusst bedingt formuliert („wenn codebase-memory verfügbar ist"):
 * Sie darf darum auch in Projekten stehen, in denen CBM (noch) nicht aktiviert ist —
 * sie kostet dort nichts und aktiviert nichts. Diese Datei legt NIE einen
 * .mcp.json-Eintrag an und indexiert nichts.
 *
 * Verhältnis der drei Ebenen (keine Doppelregeln):
 *   globale Regel (rules/cbm-workflow.md)  → verbindlich, die Wahrheit
 *   Skill (cbm-code-intelligence)          → ausführliche Methodik
 *   diese Projektregel                     → knappe Erinnerung + Verweis
 *
 * Garantien:
 *   - Nur der Bereich zwischen den Markern wird verwaltet. Alles andere in der
 *     CLAUDE.md (Stack, Design, Tests, State-Sync, PROJECT_RULES …) bleibt byte-identisch.
 *   - Idempotent: gleicher Inhalt → No-op. Veralteter Inhalt → nur der Block wird ersetzt.
 *   - Unbalancierte Marker → Abbruch statt Raten (keine Projektregeln vernichten).
 *   - Einfügeposition: direkt nach dem Pflicht-Workflow-Abschnitt, sonst am Dateiende.
 */

const fs = require('fs');
const path = require('path');

const START = '<!-- BEGIN ECC-CBM RULE -->';
const END = '<!-- END ECC-CBM RULE -->';

const BODY = [
  '## Codebase Memory',
  '',
  'Wenn `codebase-memory` in diesem Projekt verfügbar ist:',
  '',
  '- Bei nicht trivialen Aufgaben in RESEARCH zuerst Architektur, relevante Symbole und',
  '  Abhängigkeiten über den Codegraphen prüfen.',
  '- Danach die betroffenen Quelldateien **direkt lesen** — der Graph ersetzt das nicht.',
  '- Bei Bugs und Refactorings Aufrufketten und Seiteneffekte prüfen.',
  '- Nach größeren Änderungen `/cbm reindex` (kein Auto-Watch — der Index veraltet sonst).',
  '- ECC-Workflow, Tests, Build und Quellcode bleiben maßgeblich.',
  '',
  'Kleine, eindeutig lokale Änderungen brauchen **keine** Graph-Abfrage.',
  'Verbindliche Regel: `~/.claude/rules/ecc-extras/cbm-workflow.md` · Methodik: Skill `cbm-code-intelligence`.',
].join('\n');

/** Der Soll-Block inkl. Marker. */
function managedBlock() {
  return `${START}\n${BODY}\n${END}`;
}

function claudePath(root) { return path.join(root, 'CLAUDE.md'); }

/** Findet den Managed Block. Wirft bei unbalancierten Markern. */
function locate(lines) {
  const starts = [];
  const ends = [];
  lines.forEach((l, i) => {
    if (l.trim() === START) starts.push(i);
    if (l.trim() === END) ends.push(i);
  });
  if (starts.length === 0 && ends.length === 0) return null;
  if (starts.length !== 1 || ends.length !== 1 || ends[0] < starts[0]) {
    throw new Error(
      `CLAUDE.md: CBM-Marker sind beschädigt (${starts.length}× BEGIN, ${ends.length}× END). ` +
      'Abbruch — die Datei wird NICHT automatisch repariert, damit keine Projektregeln ' +
      `verloren gehen. Marker "${START}" / "${END}" bitte von Hand in Ordnung bringen.`
    );
  }
  return { from: starts[0], to: ends[0] };
}

/**
 * Einfügeposition für einen NEUEN Block: direkt vor der Überschrift, die auf den
 * Pflicht-Workflow-Abschnitt folgt. Gibt es die nicht, wird angehängt (-1).
 */
function insertIndex(lines) {
  const wf = lines.findIndex((l) => /^##\s+Pflicht-Workflow/i.test(l));
  if (wf === -1) return -1;
  for (let i = wf + 1; i < lines.length; i++) {
    if (/^##\s+/.test(lines[i])) return i;
  }
  return -1;
}

/**
 * Legt den Block an oder aktualisiert ihn.
 * @returns {{action: 'create'|'add'|'update'|'noop', file}}
 */
function apply(root, { apply: doWrite = false } = {}) {
  const file = claudePath(root);
  const block = managedBlock();
  const existed = fs.existsSync(file);
  const cur = existed ? fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n') : '';
  const lines = cur === '' ? [] : cur.split('\n');
  const loc = locate(lines);   // wirft bei kaputten Markern

  let next;
  let action;
  if (loc) {
    const have = lines.slice(loc.from, loc.to + 1).join('\n');
    if (have === block) return { action: 'noop', file };
    action = 'update';
    next = [...lines.slice(0, loc.from), ...block.split('\n'), ...lines.slice(loc.to + 1)].join('\n');
  } else if (!existed || cur.trim() === '') {
    action = 'create';
    next = `${block}\n`;
  } else {
    action = 'add';
    const at = insertIndex(lines);
    if (at === -1) {
      const head = cur.endsWith('\n') ? cur : `${cur}\n`;
      next = `${head}\n${block}\n`;
    } else {
      next = [...lines.slice(0, at), ...block.split('\n'), '', ...lines.slice(at)].join('\n');
    }
  }

  if (doWrite) {
    const tmp = path.join(path.dirname(file), `.CLAUDE.md.tmp-${process.pid}`);
    fs.writeFileSync(tmp, next, { encoding: 'utf8', mode: 0o644 });
    fs.renameSync(tmp, file);
  }
  return { action, file };
}

/** Ist der vollständige, aktuelle Block vorhanden? */
function isCurrent(root) {
  const file = claudePath(root);
  if (!fs.existsSync(file)) return false;
  try {
    const lines = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n').split('\n');
    const loc = locate(lines);
    if (!loc) return false;
    return lines.slice(loc.from, loc.to + 1).join('\n') === managedBlock();
  } catch {
    return false;
  }
}

module.exports = { START, END, managedBlock, claudePath, apply, isCurrent };

if (require.main === module) {
  const [, , action, root] = process.argv;
  const target = path.resolve(root || process.cwd());
  try {
    if (action === 'apply') console.log(JSON.stringify(apply(target, { apply: true }), null, 2));
    else if (action === 'status') console.log(JSON.stringify({ current: isCurrent(target) }, null, 2));
    else { console.error('Usage: claude-md.js <apply|status> [project-root]'); process.exit(2); }
  } catch (e) {
    console.error(`[cbm] ${e.message}`);
    process.exit(1);
  }
}

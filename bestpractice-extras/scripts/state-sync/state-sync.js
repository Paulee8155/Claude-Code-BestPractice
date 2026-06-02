#!/usr/bin/env node
'use strict';

/**
 * State-Sync-CLI — ein Einstiegspunkt fuer Hook und Hand.
 *
 *   node state-sync.js pre  [--project <root>]   # state/* -> WORKING-CONTEXT.md
 *   node state-sync.js post [--project <root>]   # WORKING-CONTEXT.md -> state/* (Delta)
 *
 * Ohne --project wird CLAUDE_PROJECT_DIR bzw. das aktuelle Arbeitsverzeichnis
 * verwendet. Beendet sich immer mit Exit 0 (Hooks duerfen die Session nie
 * abbrechen); Fehler werden sichtbar auf stderr gemeldet.
 */

const pre = require('./to-working-context');
const post = require('./from-working-context');

function usage() {
  console.error('Usage: state-sync.js <pre|post> [--project <root>]');
}

function main() {
  const argv = process.argv.slice(2);
  const mode = argv[0];

  if (mode === 'pre') {
    pre.run(argv.slice(1));
  } else if (mode === 'post') {
    post.run(argv.slice(1));
  } else {
    usage();
    return 1;
  }
  return 0;
}

let code = 0;
try {
  code = main();
} catch (err) {
  console.error(`[state-sync] FEHLER: ${err && err.message ? err.message : err}`);
}
// Bewusst Exit 0 (ausser falscher CLI-Aufruf), damit Hooks nie blockieren.
process.exit(code === 1 ? 1 : 0);

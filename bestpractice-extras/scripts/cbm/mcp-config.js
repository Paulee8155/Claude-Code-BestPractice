#!/usr/bin/env node
'use strict';

/**
 * mcp-config.js — kapselt JEDE Änderung an einer projektlokalen .mcp.json.
 *
 * Eine Wahrheit für /cbm enable, /cbm disable und /ecc-onboard --with-cbm.
 *
 * Garantien:
 *   - additiv: fremde MCP-Server bleiben unverändert, Reihenfolge bleibt stabil
 *     (unser Eintrag wird angehängt, nie einsortiert).
 *   - atomar: Schreiben über Temp-Datei + rename im selben Verzeichnis.
 *   - Backup: vor jeder Änderung .mcp.json.bak-<stamp>.
 *   - fail-closed: ungültiges JSON → Abbruch. Eine kaputte Datei wird NIE ersetzt.
 *   - idempotent: erneutes enable/disable ist ein No-op.
 *   - Es wird nie eine versionsabhängige, absolute Binary ins Projekt geschrieben —
 *     nur der PATH-Name des Wrappers. Keine Tokens, keine Env-Werte.
 */

const fs = require('fs');
const path = require('path');

const SERVER_KEY = 'codebase-memory';
const SERVER_COMMAND = 'codebase-memory-mcp-harness';

/** Der Soll-Eintrag. args bewusst leer: Grenzen setzt der Wrapper, nicht das Projekt. */
function serverEntry() {
  return { command: SERVER_COMMAND, args: [] };
}

function mcpPath(root) { return path.join(root, '.mcp.json'); }

function stamp() {
  return new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
}

/**
 * Liest die .mcp.json. Wirft bei ungültigem JSON (fail-closed).
 * @returns {{existed: boolean, json: object}}
 */
function readMcp(file) {
  if (!fs.existsSync(file)) return { existed: false, json: { mcpServers: {} } };
  const raw = fs.readFileSync(file, 'utf8');
  if (raw.trim() === '') return { existed: true, json: { mcpServers: {} } };
  let json;
  try {
    json = JSON.parse(raw);
  } catch (e) {
    throw new Error(
      `${file} ist kein gültiges JSON (${e.message}). Abbruch — die Datei wird ` +
      'NICHT automatisch ersetzt. Bitte von Hand reparieren und erneut versuchen.'
    );
  }
  if (json === null || typeof json !== 'object' || Array.isArray(json)) {
    throw new Error(`${file} enthält kein JSON-Objekt. Abbruch — Datei unverändert.`);
  }
  if (json.mcpServers !== undefined &&
      (json.mcpServers === null || typeof json.mcpServers !== 'object' || Array.isArray(json.mcpServers))) {
    throw new Error(`${file}: "mcpServers" ist kein Objekt. Abbruch — Datei unverändert.`);
  }
  if (!json.mcpServers) json.mcpServers = {};
  return { existed: true, json };
}

/** Atomar schreiben: Temp-Datei im selben Verzeichnis + rename. */
function writeAtomic(file, json) {
  const tmp = path.join(path.dirname(file), `.mcp.json.tmp-${process.pid}`);
  fs.writeFileSync(tmp, JSON.stringify(json, null, 2) + '\n', { encoding: 'utf8', mode: 0o600 });
  fs.renameSync(tmp, file);
}

function backup(file) {
  if (!fs.existsSync(file)) return null;
  const dest = `${file}.bak-${stamp()}`;
  fs.copyFileSync(file, dest);
  return dest;
}

function sameEntry(a, b) {
  return !!a && a.command === b.command && JSON.stringify(a.args || []) === JSON.stringify(b.args || []);
}

/**
 * Trägt den CBM-Server additiv ein.
 * @returns {{action: 'create'|'add'|'update'|'noop', file, backup, others: string[]}}
 */
function enable(root, { apply = false } = {}) {
  const file = mcpPath(root);
  const { existed, json } = readMcp(file);
  const others = Object.keys(json.mcpServers).filter((k) => k !== SERVER_KEY);
  const current = json.mcpServers[SERVER_KEY];

  let action;
  if (sameEntry(current, serverEntry())) action = 'noop';
  else if (current) action = 'update';
  else action = existed ? 'add' : 'create';

  if (action === 'noop' || !apply) return { action, file, backup: null, others };

  const bak = backup(file);
  json.mcpServers[SERVER_KEY] = serverEntry();   // angehängt → Reihenfolge der anderen bleibt
  writeAtomic(file, json);
  return { action, file, backup: bak, others };
}

/**
 * Entfernt AUSSCHLIESSLICH den eigenen Eintrag. Ein leer gewordenes
 * mcpServers-Objekt bleibt bestehen. Der Graph-Index wird nicht angefasst.
 * @returns {{action: 'remove'|'noop', file, backup, others: string[]}}
 */
function disable(root, { apply = false } = {}) {
  const file = mcpPath(root);
  if (!fs.existsSync(file)) return { action: 'noop', file, backup: null, others: [] };
  const { json } = readMcp(file);
  const others = Object.keys(json.mcpServers).filter((k) => k !== SERVER_KEY);
  if (!(SERVER_KEY in json.mcpServers)) return { action: 'noop', file, backup: null, others };
  if (!apply) return { action: 'remove', file, backup: null, others };

  const bak = backup(file);
  delete json.mcpServers[SERVER_KEY];
  writeAtomic(file, json);
  return { action: 'remove', file, backup: bak, others };
}

/** Ist CBM in diesem Projekt aktiviert? Tolerant: ungültiges JSON → false statt Exception. */
function isEnabled(root) {
  try {
    const { json } = readMcp(mcpPath(root));
    return sameEntry(json.mcpServers[SERVER_KEY], serverEntry());
  } catch {
    return false;
  }
}

module.exports = { SERVER_KEY, SERVER_COMMAND, serverEntry, mcpPath, readMcp, enable, disable, isEnabled };

if (require.main === module) {
  const [, , action, root] = process.argv;
  const target = path.resolve(root || process.cwd());
  try {
    if (action === 'enable') console.log(JSON.stringify(enable(target, { apply: true }), null, 2));
    else if (action === 'disable') console.log(JSON.stringify(disable(target, { apply: true }), null, 2));
    else if (action === 'status') console.log(JSON.stringify({ enabled: isEnabled(target) }, null, 2));
    else { console.error('Usage: mcp-config.js <enable|disable|status> [project-root]'); process.exit(2); }
  } catch (e) {
    console.error(`[cbm] ${e.message}`);
    process.exit(1);
  }
}

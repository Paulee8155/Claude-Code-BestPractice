#!/usr/bin/env node
'use strict';

/**
 * context-harvest CLI — deterministische Vorbefuellung des Projekt-Kontexts.
 *
 *   node harvest.js [--project <root>] [--dry-run]
 *
 * Liest Projekt-Signale (README, git log -20, TODO/FIXME, sensitive Imports) und
 * merged daraus HARVEST-Bloecke marker-basiert in state/context.md, state/tasks.md
 * und (falls vorhanden) PROJECT_RULES.md — verlustfrei, idempotent, Mensch-Inhalt bleibt.
 *
 * Beendet sich immer mit Exit 0 (ausser bei echtem CLI-Fehler); Fehler -> stderr.
 * Gedacht als Schritt-5-Vorstufe von /ecc-onboard (Auto-Kontext-Generierung).
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const lib = require('../state-sync/lib');
const H = require('./harvest-lib');

/** git read-only ausfuehren; bei Fehler '' (kein Repo / kein git). */
function git(root, args) {
  try {
    return execFileSync('git', ['-C', root, ...args], {
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 8 * 1024 * 1024,
    });
  } catch {
    return '';
  }
}

function readReadme(root) {
  for (const n of ['README.md', 'readme.md', 'README.MD', 'Readme.md']) {
    const c = lib.readFileSafe(path.join(root, n));
    if (c) return c;
  }
  return '';
}

function readManifestDesc(root) {
  try {
    const p = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    if (p && p.description) return String(p.description);
  } catch { /* kein package.json / kaputt */ }
  const py = lib.readFileSafe(path.join(root, 'pyproject.toml'));
  const m = py.match(/description\s*=\s*["']([^"']+)["']/);
  return m ? m[1] : '';
}

const SOURCE_GLOBS = ['*.js', '*.ts', '*.tsx', '*.jsx', '*.py', '*.go', '*.rs', '*.java', '*.rb', '*.php'];

const SENSITIVE = [
  { area: 'auth', re: 'jwt|bcrypt|argon2|passport|next-auth|oauth|jsonwebtoken' },
  { area: 'payments', re: 'stripe|paypal|braintree|lemonsqueezy' },
  { area: 'db-migrations', re: 'migration|alembic|flyway|knex|sequelize' },
  { area: 'crypto/secrets', re: 'createcipher|kms|secretmanager|keystore' },
];

function harvestTodos(root) {
  const out = [];
  const raw = git(root, ['grep', '-nE', 'TODO|FIXME', '--', ...SOURCE_GLOBS]);
  for (const line of raw.split('\n').filter(Boolean).slice(0, 50)) {
    const m = line.match(/^([^:]+):(\d+):(.*)$/);
    if (!m) continue;
    const kind = /FIXME/.test(m[3]) ? 'FIXME' : 'TODO';
    // Kommentar-Lead + redundantes Keyword entfernen -> nur die eigentliche Notiz.
    const text = m[3].trim().replace(/^[#/*\s-]+/, '').replace(/^(TODO|FIXME)[:\s-]*/i, '').trim();
    out.push({ file: m[1], line: m[2], text, kind });
  }
  return out;
}

function harvestSensitive(root) {
  const hits = [];
  for (const s of SENSITIVE) {
    const raw = git(root, ['grep', '-lEi', s.re, '--', ...SOURCE_GLOBS]);
    for (const f of raw.split('\n').filter(Boolean).slice(0, 8)) hits.push({ area: s.area, file: f });
  }
  return hits;
}

function main() {
  const argv = process.argv.slice(2);
  const dry = argv.includes('--dry-run');
  const root = lib.resolveProjectRoot(argv);

  if (lib.isForbiddenRoot(root)) {
    console.error('[harvest] uebersprungen: ECC-Engine-Teilbaum ist kein Ziel.');
    return 0;
  }
  if (!lib.hasStateDir(root)) {
    console.error('[harvest] uebersprungen: kein state/ — erst /ecc-onboard ausfuehren.');
    return 0;
  }

  const truth = H.buildCurrentTruth({
    manifestDesc: readManifestDesc(root),
    readmePara: H.firstParagraph(readReadme(root)),
    gitLog: git(root, ['log', '-20', '--oneline']),
  });
  const todos = harvestTodos(root);
  const sensitive = harvestSensitive(root);

  const targets = [
    { file: path.join(root, 'state', 'context.md'), heading: '### Current Truth', zone: 'current-truth', inner: truth, required: true },
    { file: path.join(root, 'state', 'tasks.md'), heading: '### Now', zone: 'now', inner: H.buildNow(todos), required: true },
  ];
  const prPath = path.join(root, 'PROJECT_RULES.md');
  if (fs.existsSync(prPath)) {
    targets.push({ file: prPath, heading: '## Sensitive Areas', zone: 'sensitive-areas', inner: H.summarizeSensitive(sensitive), required: false });
  }

  let written = 0;
  for (const t of targets) {
    if (!fs.existsSync(t.file)) {
      if (t.required) console.error(`[harvest] uebersprungen (fehlt): ${path.relative(root, t.file)}`);
      continue;
    }
    const before = lib.readFileSafe(t.file);
    const after = H.mergeZone(before, t.heading, t.zone, t.inner);
    if (after !== before) {
      if (!dry) lib.writeFileAtomic(t.file, after);
      written++;
      console.error(`[harvest] ${dry ? '(dry) ' : ''}${path.relative(root, t.file)} ← HARVEST:${t.zone}`);
    }
  }
  console.error(`[harvest] ${dry ? 'DRY ' : ''}ok: ${written} Datei(en) aktualisiert, ${todos.length} TODO/FIXME, ${sensitive.length} sensitive Treffer.`);
  return 0;
}

let code = 0;
try {
  code = main();
} catch (err) {
  console.error(`[harvest] FEHLER: ${err && err.message ? err.message : err}`);
}
process.exit(code === 1 ? 1 : 0);

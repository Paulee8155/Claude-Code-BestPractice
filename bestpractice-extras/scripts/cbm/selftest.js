#!/usr/bin/env node
'use strict';

/**
 * selftest.js — Unit-Tests für die CBM-Integration (Schicht 2).
 *
 *   node selftest.js      (Exit 0 = alle grün)
 *
 * Läuft vollständig offline in isolierten Temp-Verzeichnissen:
 *   - kein Download (die Installer-Tests mocken curl/sha256sum über einen PATH-Shim)
 *   - keine CBM-Binary nötig
 *   - keine Veränderung an ~/.claude, am Repo oder an echten Projekten
 *
 * Der echte Release- und MCP-Smoke-Test steckt in integration-test.sh und läuft
 * bewusst NICHT in der CI.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');
const { execFileSync } = require('child_process');

const CBM = __dirname;
const mcpConfig = require('./mcp-config');
const cbmignore = require('./cbmignore');
const { checkPath } = require('./project');

let passed = 0;
const failures = [];

function t(name, fn) {
  try {
    fn();
    passed++;
    process.stdout.write(`  PASS  ${name}\n`);
  } catch (e) {
    failures.push({ name, err: e });
    process.stdout.write(`  FAIL  ${name}\n        ${e.message.split('\n')[0]}\n`);
  }
}

function tmp(prefix) { return fs.mkdtempSync(path.join(os.tmpdir(), `cbm-${prefix}-`)); }
function readJSON(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function write(p, s) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s, 'utf8'); }

// =================================================================================
process.stdout.write('\n--- .mcp.json Config-Merge ---\n');
// =================================================================================

t('leere .mcp.json (Datei fehlt) → create, korrekter Eintrag', () => {
  const r = tmp('mcp1');
  const res = mcpConfig.enable(r, { apply: true });
  assert.strictEqual(res.action, 'create');
  const j = readJSON(path.join(r, '.mcp.json'));
  assert.deepStrictEqual(j.mcpServers['codebase-memory'], { command: 'codebase-memory-mcp-harness', args: [] });
});

t('bestehende fremde MCP-Server bleiben erhalten + Reihenfolge stabil', () => {
  const r = tmp('mcp2');
  write(path.join(r, '.mcp.json'), JSON.stringify({
    mcpServers: { alpha: { command: 'a' }, zeta: { command: 'z' } },
    otherTopLevelKey: { keep: true },
  }, null, 2));
  mcpConfig.enable(r, { apply: true });
  const j = readJSON(path.join(r, '.mcp.json'));
  assert.deepStrictEqual(Object.keys(j.mcpServers), ['alpha', 'zeta', 'codebase-memory'], 'unser Eintrag wird angehängt');
  assert.deepStrictEqual(j.mcpServers.alpha, { command: 'a' });
  assert.deepStrictEqual(j.otherTopLevelKey, { keep: true }, 'fremde Top-Level-Keys bleiben');
});

t('vorhandener CBM-Eintrag → No-op (idempotent)', () => {
  const r = tmp('mcp3');
  mcpConfig.enable(r, { apply: true });
  const before = fs.readFileSync(path.join(r, '.mcp.json'), 'utf8');
  const res = mcpConfig.enable(r, { apply: true });
  assert.strictEqual(res.action, 'noop');
  assert.strictEqual(fs.readFileSync(path.join(r, '.mcp.json'), 'utf8'), before, 'Datei bleibt byte-identisch');
  assert.strictEqual(fs.readdirSync(r).filter((f) => f.includes('.bak-')).length, 0, 'No-op legt kein Backup an');
});

t('ungültiges JSON → Abbruch, Datei wird NICHT ersetzt', () => {
  const r = tmp('mcp4');
  const f = path.join(r, '.mcp.json');
  const broken = '{ "mcpServers": { "a": ';
  write(f, broken);
  assert.throws(() => mcpConfig.enable(r, { apply: true }), /kein gültiges JSON/);
  assert.strictEqual(fs.readFileSync(f, 'utf8'), broken, 'kaputte Datei unverändert');
});

t('mcpServers ist kein Objekt → Abbruch statt Überschreiben', () => {
  const r = tmp('mcp4b');
  const f = path.join(r, '.mcp.json');
  write(f, '{"mcpServers": ["nope"]}');
  assert.throws(() => mcpConfig.enable(r, { apply: true }), /kein Objekt/);
});

t('disable entfernt NUR den CBM-Eintrag', () => {
  const r = tmp('mcp5');
  write(path.join(r, '.mcp.json'), JSON.stringify({ mcpServers: { alpha: { command: 'a' } } }, null, 2));
  mcpConfig.enable(r, { apply: true });
  const res = mcpConfig.disable(r, { apply: true });
  assert.strictEqual(res.action, 'remove');
  const j = readJSON(path.join(r, '.mcp.json'));
  assert.deepStrictEqual(Object.keys(j.mcpServers), ['alpha']);
});

t('disable auf leerem mcpServers → leeres Objekt bleibt bestehen', () => {
  const r = tmp('mcp6');
  mcpConfig.enable(r, { apply: true });
  mcpConfig.disable(r, { apply: true });
  const j = readJSON(path.join(r, '.mcp.json'));
  assert.deepStrictEqual(j.mcpServers, {}, 'leeres mcpServers bleibt (Datei wird nicht gelöscht)');
});

t('wiederholtes enable/disable ist stabil', () => {
  const r = tmp('mcp7');
  for (let i = 0; i < 3; i++) { mcpConfig.enable(r, { apply: true }); mcpConfig.disable(r, { apply: true }); }
  mcpConfig.enable(r, { apply: true });
  assert.strictEqual(mcpConfig.isEnabled(r), true);
  assert.strictEqual(mcpConfig.disable(r, { apply: true }).action, 'remove');
  assert.strictEqual(mcpConfig.disable(r, { apply: true }).action, 'noop', '2. disable = No-op');
});

t('Backup wird vor jeder echten Änderung angelegt', () => {
  const r = tmp('mcp8');
  write(path.join(r, '.mcp.json'), JSON.stringify({ mcpServers: { alpha: { command: 'a' } } }, null, 2));
  const res = mcpConfig.enable(r, { apply: true });
  assert.ok(res.backup && fs.existsSync(res.backup), 'Backup-Datei existiert');
  assert.deepStrictEqual(readJSON(res.backup).mcpServers, { alpha: { command: 'a' } }, 'Backup hält den Vorher-Stand');
});

t('dry-run (apply:false) schreibt nichts', () => {
  const r = tmp('mcp9');
  const res = mcpConfig.enable(r, { apply: false });
  assert.strictEqual(res.action, 'create');
  assert.strictEqual(fs.existsSync(path.join(r, '.mcp.json')), false, 'keine Datei angelegt');
});

t('atomares Schreiben hinterlässt keine Temp-Dateien', () => {
  const r = tmp('mcp10');
  mcpConfig.enable(r, { apply: true });
  assert.strictEqual(fs.readdirSync(r).filter((f) => f.startsWith('.mcp.json.tmp-')).length, 0);
});

t('kein absoluter Binary-Pfad, keine Env-Werte im Projekt', () => {
  const r = tmp('mcp11');
  mcpConfig.enable(r, { apply: true });
  const raw = fs.readFileSync(path.join(r, '.mcp.json'), 'utf8');
  assert.ok(!/\//.test(readJSON(path.join(r, '.mcp.json')).mcpServers['codebase-memory'].command), 'command ist ein PATH-Name');
  assert.ok(!/env|CBM_|token|key/i.test(raw), 'keine Env-Werte/Secrets in der Datei');
});

// =================================================================================
process.stdout.write('\n--- .cbmignore Managed Block ---\n');
// =================================================================================

t('neue Datei → Managed Block mit Secret-Mustern', () => {
  const r = tmp('ign1');
  const res = cbmignore.apply(r, { apply: true });
  assert.strictEqual(res.action, 'create');
  const txt = fs.readFileSync(path.join(r, '.cbmignore'), 'utf8');
  for (const pat of ['.env', '*.key', '*.pem', 'state/', 'docs/CODEMAPS/']) {
    assert.ok(txt.includes(pat), `Muster fehlt: ${pat}`);
  }
  assert.ok(cbmignore.isCurrent(r));
});

t('bestehende Benutzerregeln bleiben unangetastet', () => {
  const r = tmp('ign2');
  write(path.join(r, '.cbmignore'), '# meine Regel\nvendor/\n');
  cbmignore.apply(r, { apply: true });
  const txt = fs.readFileSync(path.join(r, '.cbmignore'), 'utf8');
  assert.ok(txt.startsWith('# meine Regel\nvendor/\n'), 'Benutzerregeln stehen unverändert oben');
  assert.ok(txt.includes(cbmignore.START));
});

t('bestehender aktueller Block → No-op (idempotent)', () => {
  const r = tmp('ign3');
  cbmignore.apply(r, { apply: true });
  const before = fs.readFileSync(path.join(r, '.cbmignore'), 'utf8');
  assert.strictEqual(cbmignore.apply(r, { apply: true }).action, 'noop');
  assert.strictEqual(fs.readFileSync(path.join(r, '.cbmignore'), 'utf8'), before);
});

t('veralteter Block wird ersetzt — nur zwischen den Markern', () => {
  const r = tmp('ign4');
  write(path.join(r, '.cbmignore'),
    `# oben\n${cbmignore.START}\nVERALTET\n${cbmignore.END}\n# unten\n`);
  const res = cbmignore.apply(r, { apply: true });
  assert.strictEqual(res.action, 'update');
  const txt = fs.readFileSync(path.join(r, '.cbmignore'), 'utf8');
  assert.ok(txt.startsWith('# oben\n'), 'Inhalt VOR dem Block bleibt');
  assert.ok(txt.trimEnd().endsWith('# unten'), 'Inhalt NACH dem Block bleibt');
  assert.ok(!txt.includes('VERALTET'), 'alter Blockinhalt ist weg');
  assert.ok(txt.includes('*.pem'), 'neuer Blockinhalt ist da');
});

t('beschädigte Marker → fail-closed, Datei unverändert', () => {
  const r = tmp('ign5');
  const f = path.join(r, '.cbmignore');
  const broken = `meine/regel\n${cbmignore.START}\n*.env\n`;   // START ohne END
  write(f, broken);
  assert.throws(() => cbmignore.apply(r, { apply: true }), /beschädigt/);
  assert.strictEqual(fs.readFileSync(f, 'utf8'), broken, 'nichts überschrieben');
  assert.strictEqual(cbmignore.isCurrent(r), false);
});

t('remove entfernt nur den Block, Benutzerregeln bleiben', () => {
  const r = tmp('ign6');
  write(path.join(r, '.cbmignore'), '# meine Regel\nvendor/\n');
  cbmignore.apply(r, { apply: true });
  cbmignore.remove(r, { apply: true });
  const txt = fs.readFileSync(path.join(r, '.cbmignore'), 'utf8');
  assert.strictEqual(txt, '# meine Regel\nvendor/\n');
});

t('Managed Block enthält keine Re-Include-Regeln', () => {
  const block = cbmignore.managedBlock();
  const rules = block.split('\n').filter((l) => l.trim() && !l.trim().startsWith('#'));
  assert.ok(rules.every((l) => !l.trim().startsWith('!')), 'kein !pattern — würde Sicherheitsfilter aushebeln');
});

// =================================================================================
process.stdout.write('\n--- CLAUDE.md: bedingte CBM-Projektregel ---\n');
// =================================================================================

const claudeMd = require('./claude-md');

const CLAUDE_FIXTURE = [
  '# CLAUDE.md — Arbeitsvertrag (Demo)',
  '',
  '## Pflicht-Workflow (ECC 5-Phasen, jede Aufgabe > 30 Min)',
  '1. RESEARCH → Explore/Codebase verstehen',
  '5. VERIFY → Tests/Build grün',
  '',
  '## Stack & Befehle',
  '- Build: `npm run build`',
  '',
  '## Design-Disziplin',
  '- Nur Oswald + Open Sans.',
  '',
].join('\n');

t('fehlende CLAUDE.md → wird mit dem Block angelegt', () => {
  const r = tmp('cmd1');
  assert.strictEqual(claudeMd.apply(r, { apply: true }).action, 'create');
  const txt = fs.readFileSync(path.join(r, 'CLAUDE.md'), 'utf8');
  assert.ok(txt.includes('## Codebase Memory'));
  assert.ok(/Wenn `codebase-memory` in diesem Projekt verfügbar ist/.test(txt), 'Regel ist BEDINGT formuliert');
  assert.ok(claudeMd.isCurrent(r));
});

t('bestehende CLAUDE.md: Block landet nach dem Pflicht-Workflow, alles andere bleibt', () => {
  const r = tmp('cmd2');
  write(path.join(r, 'CLAUDE.md'), CLAUDE_FIXTURE);
  assert.strictEqual(claudeMd.apply(r, { apply: true }).action, 'add');
  const txt = fs.readFileSync(path.join(r, 'CLAUDE.md'), 'utf8');
  const iWf = txt.indexOf('## Pflicht-Workflow');
  const iCbm = txt.indexOf('## Codebase Memory');
  const iStack = txt.indexOf('## Stack & Befehle');
  assert.ok(iWf < iCbm && iCbm < iStack, 'CBM steht zwischen Pflicht-Workflow und Stack');
  for (const keep of ['## Stack & Befehle', '- Build: `npm run build`', '## Design-Disziplin', '- Nur Oswald + Open Sans.']) {
    assert.ok(txt.includes(keep), `Projektinhalt verloren: ${keep}`);
  }
});

t('wiederholtes Onboarding → No-op, keine doppelten Abschnitte', () => {
  const r = tmp('cmd3');
  write(path.join(r, 'CLAUDE.md'), CLAUDE_FIXTURE);
  claudeMd.apply(r, { apply: true });
  const after1 = fs.readFileSync(path.join(r, 'CLAUDE.md'), 'utf8');
  assert.strictEqual(claudeMd.apply(r, { apply: true }).action, 'noop');
  assert.strictEqual(claudeMd.apply(r, { apply: true }).action, 'noop');
  const after3 = fs.readFileSync(path.join(r, 'CLAUDE.md'), 'utf8');
  assert.strictEqual(after3, after1, 'Datei bleibt byte-identisch');
  assert.strictEqual(after3.split('## Codebase Memory').length - 1, 1, 'genau EIN CBM-Abschnitt');
  assert.strictEqual(after3.split(claudeMd.START).length - 1, 1, 'genau EIN Marker-Paar');
});

t('veralteter Block wird ersetzt — nur zwischen den Markern', () => {
  const r = tmp('cmd4');
  write(path.join(r, 'CLAUDE.md'),
    `# Titel\n\n${claudeMd.START}\n## Codebase Memory\nVERALTET\n${claudeMd.END}\n\n## Stack\n- eigen\n`);
  assert.strictEqual(claudeMd.apply(r, { apply: true }).action, 'update');
  const txt = fs.readFileSync(path.join(r, 'CLAUDE.md'), 'utf8');
  assert.ok(!txt.includes('VERALTET'));
  assert.ok(txt.includes('# Titel') && txt.includes('## Stack') && txt.includes('- eigen'), 'Fremdinhalt bleibt');
  assert.ok(txt.includes('/cbm reindex'));
});

t('CLAUDE.md ohne Pflicht-Workflow → Block wird angehängt, nichts überschrieben', () => {
  const r = tmp('cmd5');
  write(path.join(r, 'CLAUDE.md'), '# Fremdes Projekt\n\n## Regeln\n- eigene Regel\n');
  assert.strictEqual(claudeMd.apply(r, { apply: true }).action, 'add');
  const txt = fs.readFileSync(path.join(r, 'CLAUDE.md'), 'utf8');
  assert.ok(txt.startsWith('# Fremdes Projekt\n\n## Regeln\n- eigene Regel\n'), 'Original bleibt vorn unverändert');
  assert.ok(txt.includes('## Codebase Memory'));
});

t('beschädigte Marker → fail-closed, Datei unverändert', () => {
  const r = tmp('cmd6');
  const f = path.join(r, 'CLAUDE.md');
  const broken = `# Titel\n${claudeMd.START}\n## Codebase Memory\n`;   // START ohne END
  write(f, broken);
  assert.throws(() => claudeMd.apply(r, { apply: true }), /beschädigt/);
  assert.strictEqual(fs.readFileSync(f, 'utf8'), broken);
});

t('dry-run (apply:false) schreibt nichts', () => {
  const r = tmp('cmd7');
  write(path.join(r, 'CLAUDE.md'), CLAUDE_FIXTURE);
  assert.strictEqual(claudeMd.apply(r, { apply: false }).action, 'add');
  assert.strictEqual(fs.readFileSync(path.join(r, 'CLAUDE.md'), 'utf8'), CLAUDE_FIXTURE, 'unverändert');
});

t('die Regel aktiviert nichts: kein .mcp.json, keine .cbmignore', () => {
  const r = tmp('cmd8');
  claudeMd.apply(r, { apply: true });
  assert.strictEqual(fs.existsSync(path.join(r, '.mcp.json')), false);
  assert.strictEqual(fs.existsSync(path.join(r, '.cbmignore')), false);
});

// =================================================================================
process.stdout.write('\n--- Pfadsicherheit (CBM_ALLOWED_ROOT) ---\n');
// =================================================================================

const allowed = fs.realpathSync(tmp('root'));
fs.mkdirSync(path.join(allowed, 'gutes-projekt'));
fs.mkdirSync(path.join(allowed, 'nested', 'tief'), { recursive: true });
const outside = fs.realpathSync(tmp('outside'));
fs.mkdirSync(path.join(outside, 'fremd'));

t('erlaubter Projektpfad → akzeptiert', () => {
  assert.strictEqual(checkPath(path.join(allowed, 'gutes-projekt'), allowed).ok, true);
});

t('verschachteltes Projekt innerhalb des Roots → akzeptiert', () => {
  assert.strictEqual(checkPath(path.join(allowed, 'nested', 'tief'), allowed).ok, true);
});

t('Pfad ausserhalb Allowed Root → abgelehnt', () => {
  const r = checkPath(path.join(outside, 'fremd'), allowed);
  assert.strictEqual(r.ok, false);
  assert.match(r.reason, /ausserhalb/);
});

t('../-Traversal → abgelehnt', () => {
  const r = checkPath(path.join(allowed, 'gutes-projekt', '..', '..'), allowed);
  assert.strictEqual(r.ok, false, 'darf nicht durch .. entkommen');
});

t('Symlink aus dem Allowed Root heraus → abgelehnt (realpath)', () => {
  const link = path.join(allowed, 'tarnung');
  fs.symlinkSync(path.join(outside, 'fremd'), link);
  const r = checkPath(link, allowed);
  assert.strictEqual(r.ok, false, 'Symlink darf die Grenze nicht umgehen');
  assert.match(r.reason, /ausserhalb/);
});

t('Projekt-Root == Allowed Root → abgelehnt (kein Mega-Index)', () => {
  const r = checkPath(allowed, allowed);
  assert.strictEqual(r.ok, false);
  assert.match(r.reason, /Mega-Index/);
});

t('nicht existentes Projekt → abgelehnt', () => {
  const r = checkPath(path.join(allowed, 'gibt-es-nicht'), allowed);
  assert.strictEqual(r.ok, false);
  assert.match(r.reason, /existiert nicht/);
});

// =================================================================================
process.stdout.write('\n--- Installer (manage.sh, gemockt — kein echter Download) ---\n');
// =================================================================================

/**
 * Baut eine Sandbox mit PATH-Shim: curl liefert ein lokal gebautes tar.gz mit einer
 * Fake-Binary. So testen wir Checksum-Gate, Atomarität und Rollback ohne Netz.
 */
function installerSandbox({ sha, binExit = 0, binVersion = '0.9.0' } = {}) {
  const box = tmp('inst');
  const home = path.join(box, 'home');
  const shim = path.join(box, 'shim');
  const payload = path.join(box, 'payload');
  fs.mkdirSync(path.join(home, '.claude'), { recursive: true });
  fs.mkdirSync(shim, { recursive: true });
  fs.mkdirSync(payload, { recursive: true });

  // settings.json mit RTK-Hook — muss bitgenau unverändert bleiben
  const settings = JSON.stringify({
    hooks: { PreToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: '/root/.local/bin/rtk hook claude' }] }] },
  }, null, 2) + '\n';
  fs.writeFileSync(path.join(home, '.claude', 'settings.json'), settings);

  // Fake-Binary + Tarball
  const fakeBin = path.join(payload, 'codebase-memory-mcp');
  fs.writeFileSync(fakeBin,
    `#!/usr/bin/env bash\nif [ "\${1:-}" = "--version" ]; then echo "codebase-memory-mcp ${binVersion}"; exit ${binExit}; fi\nexit 0\n`,
    { mode: 0o755 });
  const tgz = path.join(box, 'asset.tar.gz');
  execFileSync('tar', ['-czf', tgz, '-C', payload, 'codebase-memory-mcp']);
  const realSha = execFileSync('sha256sum', [tgz], { encoding: 'utf8' }).split(' ')[0];

  // curl-Shim: kopiert das lokale Tarball ans -o-Ziel
  fs.writeFileSync(path.join(shim, 'curl'),
    `#!/usr/bin/env bash\nout=""\nwhile [ $# -gt 0 ]; do case "$1" in -o) out="$2"; shift 2;; *) shift;; esac; done\n` +
    `[ -n "$out" ] && cp "${tgz}" "$out"\nexit 0\n`, { mode: 0o755 });
  // gh-Shim: kennt kein 'attestation' → Attestation wird sauber übersprungen
  fs.writeFileSync(path.join(shim, 'gh'), '#!/usr/bin/env bash\nexit 1\n', { mode: 0o755 });

  // release.json mit gewünschter (ggf. falscher) Checksumme
  const rel = JSON.parse(fs.readFileSync(path.join(CBM, 'release.json'), 'utf8'));
  rel.assets.amd64.sha256 = sha === 'correct' ? realSha : sha;
  rel.assets.arm64.sha256 = sha === 'correct' ? realSha : sha;
  const cbmCopy = path.join(box, 'cbm');
  fs.mkdirSync(cbmCopy);
  for (const f of ['manage.sh', 'wrapper.sh', 'verify.js', 'release.json']) fs.copyFileSync(path.join(CBM, f), path.join(cbmCopy, f));
  fs.writeFileSync(path.join(cbmCopy, 'release.json'), JSON.stringify(rel, null, 2));

  const env = {
    ...process.env,
    HOME: home,
    PATH: `${shim}:${process.env.PATH}`,
    CBM_LIB_DIR: path.join(home, '.local', 'lib', 'codebase-memory-mcp'),
    CBM_BIN_DIR: path.join(home, '.local', 'bin'),
    CBM_CACHE_DIR: path.join(home, '.cache', 'codebase-memory-mcp'),
  };
  const run = (action) => {
    try {
      return { code: 0, out: execFileSync('bash', [path.join(cbmCopy, 'manage.sh'), action], { env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }) };
    } catch (e) {
      return { code: e.status || 1, out: String(e.stdout || '') + String(e.stderr || '') };
    }
  };
  return { box, home, env, run, realSha, settings, cbmCopy };
}

t('dry-run schreibt nichts', () => {
  const s = installerSandbox({ sha: 'correct' });
  const r = s.run('dry-run');
  assert.strictEqual(r.code, 0);
  assert.strictEqual(fs.existsSync(s.env.CBM_LIB_DIR), false, 'kein lib-Verzeichnis');
  assert.strictEqual(fs.existsSync(path.join(s.env.CBM_BIN_DIR, 'codebase-memory-mcp-harness')), false, 'kein Wrapper');
});

t('falsche Checksum → Abbruch, nichts installiert', () => {
  const s = installerSandbox({ sha: 'f'.repeat(64) });
  const r = s.run('install');
  assert.notStrictEqual(r.code, 0, 'muss fehlschlagen');
  assert.match(r.out, /SHA-256 stimmt NICHT/);
  assert.strictEqual(fs.existsSync(path.join(s.env.CBM_LIB_DIR, 'current')), false, 'keine aktive Installation');
});

t('fehlende Checksum → Abbruch (fail-closed)', () => {
  const s = installerSandbox({ sha: '' });
  const r = s.run('install');
  assert.notStrictEqual(r.code, 0);
  assert.match(r.out, /keine SHA-256|fail-closed/);
});

t('unplausible Checksum (kein Hex/zu kurz) → Abbruch', () => {
  const s = installerSandbox({ sha: 'zzzz' });
  const r = s.run('install');
  assert.notStrictEqual(r.code, 0);
  assert.match(r.out, /Hex-String|64 Zeichen/);
});

t('Binary startet nicht (--version schlägt fehl) → Abbruch, current bleibt leer', () => {
  const s = installerSandbox({ sha: 'correct', binExit: 3 });
  const r = s.run('install');
  assert.notStrictEqual(r.code, 0);
  assert.match(r.out, /startet nicht/);
  assert.strictEqual(fs.existsSync(path.join(s.env.CBM_LIB_DIR, 'current')), false);
});

t('erfolgreiche atomare Installation + Wrapper + settings.json bitgenau unverändert', () => {
  const s = installerSandbox({ sha: 'correct' });
  const r = s.run('install');
  assert.strictEqual(r.code, 0, r.out);
  const cur = path.join(s.env.CBM_LIB_DIR, 'current');
  assert.strictEqual(fs.readlinkSync(cur), '0.9.0', 'current → gepinnte Version');
  assert.ok(fs.existsSync(path.join(cur, 'codebase-memory-mcp')));
  const wrapper = path.join(s.env.CBM_BIN_DIR, 'codebase-memory-mcp-harness');
  assert.ok(fs.existsSync(wrapper));
  const w = fs.readFileSync(wrapper, 'utf8');
  assert.ok(!w.includes('@@MANAGE@@'), 'Platzhalter ersetzt');
  assert.ok(w.includes('export CBM_ALLOWED_ROOT='), 'Sicherheitsgrenze gesetzt');
  assert.strictEqual(fs.readFileSync(path.join(s.home, '.claude', 'settings.json'), 'utf8'), s.settings,
    'settings.json bitgenau unverändert');
  assert.strictEqual((fs.statSync(path.join(s.env.CBM_CACHE_DIR)).mode & 0o777), 0o700, 'Cache 0700');
});

t('bestehende Version wird nicht unnötig neu installiert (No-op)', () => {
  const s = installerSandbox({ sha: 'correct' });
  assert.strictEqual(s.run('install').code, 0);
  const r2 = s.run('install');
  assert.strictEqual(r2.code, 0);
  assert.match(r2.out, /bereits installiert.*kein Re-Download/s);
});

t('Rollback schaltet atomar auf die vorherige Version zurück', () => {
  const s = installerSandbox({ sha: 'correct' });
  assert.strictEqual(s.run('install').code, 0);

  // Zweite Version simulieren: release.json auf 0.9.1 umpinnen, Fake-Binary meldet 0.9.1.
  const relPath = path.join(s.cbmCopy, 'release.json');
  const rel = JSON.parse(fs.readFileSync(relPath, 'utf8'));
  rel.version = 'v0.9.1';
  fs.writeFileSync(relPath, JSON.stringify(rel, null, 2));
  // Die Fake-Binary im Tarball meldet weiter 0.9.0 → Version-Check von verify wäre rot,
  // aber install selbst prüft nur, DASS --version läuft. Für den Rollback-Pfad reicht das.
  assert.strictEqual(s.run('install').code, 0);
  assert.strictEqual(fs.readlinkSync(path.join(s.env.CBM_LIB_DIR, 'current')), '0.9.1');
  assert.strictEqual(fs.readlinkSync(path.join(s.env.CBM_LIB_DIR, 'previous')), '0.9.0');

  const r = s.run('rollback');
  assert.strictEqual(r.code, 0, r.out);
  assert.strictEqual(fs.readlinkSync(path.join(s.env.CBM_LIB_DIR, 'current')), '0.9.0', 'zurück auf 0.9.0');
  assert.strictEqual(fs.readlinkSync(path.join(s.env.CBM_LIB_DIR, 'previous')), '0.9.1', 'previous zeigt jetzt auf 0.9.1');
});

t('purge-cache ohne Bestätigung → verweigert, Cache bleibt', () => {
  const s = installerSandbox({ sha: 'correct' });
  assert.strictEqual(s.run('install').code, 0);
  const r = s.run('purge-cache');   // nicht-interaktiv, ohne CBM_CONFIRM
  assert.notStrictEqual(r.code, 0);
  assert.match(r.out, /Nicht bestätigt/);
  assert.ok(fs.existsSync(s.env.CBM_CACHE_DIR), 'Cache unangetastet');
});

t('uninstall entfernt Binary + Wrapper, behält aber den Cache', () => {
  const s = installerSandbox({ sha: 'correct' });
  assert.strictEqual(s.run('install').code, 0);
  assert.strictEqual(s.run('uninstall').code, 0);
  assert.strictEqual(fs.existsSync(path.join(s.env.CBM_BIN_DIR, 'codebase-memory-mcp-harness')), false);
  assert.strictEqual(fs.existsSync(s.env.CBM_LIB_DIR), false);
  assert.ok(fs.existsSync(s.env.CBM_CACHE_DIR), 'Cache bleibt (löschen nur via purge-cache)');
});

t('release.json pinnt eine konkrete Version, nie "latest"', () => {
  const rel = JSON.parse(fs.readFileSync(path.join(CBM, 'release.json'), 'utf8'));
  assert.match(rel.version, /^v\d+\.\d+\.\d+$/, 'exakte Version');
  assert.strictEqual(rel.variant, 'standard', 'keine UI-Variante');
  for (const arch of ['amd64', 'arm64']) {
    assert.match(rel.assets[arch].sha256, /^[0-9a-f]{64}$/, `SHA-256 für ${arch}`);
    assert.ok(!/ui/.test(rel.assets[arch].filename), `kein UI-Asset für ${arch}`);
  }
  // Nur echte Code-Zeilen prüfen: Kommentare und Ausgabezeilen (echo/info) dürfen die
  // verbotenen Muster benennen — sie dokumentieren ja gerade, was NICHT getan wird.
  const code = fs.readFileSync(path.join(CBM, 'manage.sh'), 'utf8')
    .split('\n')
    .filter((l) => !/^\s*#/.test(l) && !/^\s*(echo|info|die)\b/.test(l))
    .join('\n');
  assert.ok(!/latest\/download/.test(code), 'keine latest/download-URL im Installer');
  assert.ok(!/curl[^\n]*\|\s*bash/.test(code), 'kein curl|bash');
  assert.ok(!/codebase-memory-mcp["']?\s+install/.test(code), 'ruft nie den Upstream-Auto-Installer auf');
  assert.ok(/releases\/download\/\$VERSION/.test(code), 'Download läuft über die gepinnte Version');
});

// =================================================================================
const total = passed + failures.length;
process.stdout.write(`\n${passed}/${total} Tests grün${failures.length ? ` — ${failures.length} FAIL` : ' — ALLE GRÜN'}\n\n`);
if (failures.length) {
  for (const f of failures) process.stderr.write(`FAIL: ${f.name}\n${f.err.stack}\n\n`);
  process.exit(1);
}

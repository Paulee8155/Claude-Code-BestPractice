#!/usr/bin/env node
'use strict';

/**
 * verify.js — maschinelle Abnahme der GLOBALEN CBM-Installation.
 *
 *   node verify.js            # Report, Exit 0 nur wenn alle Pflicht-Checks grün
 *
 * Wird von `manage.sh verify`, `/cbm doctor` und `onboard-verify.js` genutzt —
 * eine Wahrheit, keine Doppel-Implementierung.
 *
 * Prüft ausdrücklich auch die NEGATIV-Kriterien des Harness: kein Upstream-Hook,
 * keine UI, keine Spur in ~/.claude/settings.json, RTK unangetastet.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const HOME = process.env.HOME || '/root';
const CBM_DIR = __dirname;
const RELEASE = JSON.parse(fs.readFileSync(path.join(CBM_DIR, 'release.json'), 'utf8'));
const LIB_DIR = process.env.CBM_LIB_DIR || path.join(HOME, '.local', 'lib', 'codebase-memory-mcp');
const BIN_DIR = process.env.CBM_BIN_DIR || path.join(HOME, '.local', 'bin');
const WRAPPER = path.join(BIN_DIR, 'codebase-memory-mcp-harness');
const CURRENT = path.join(LIB_DIR, 'current');
const CACHE_DIR = process.env.CBM_CACHE_DIR || path.join(HOME, '.cache', 'codebase-memory-mcp');
const SETTINGS = path.join(HOME, '.claude', 'settings.json');

const PINNED = String(RELEASE.version).replace(/^v/, '');

function exists(p) { try { fs.accessSync(p); return true; } catch { return false; } }
function read(p) { try { return fs.readFileSync(p, 'utf8'); } catch { return ''; } }

/** Ruft den Wrapper auf. Gibt {ok, out} zurück, wirft nie. */
function wrapper(args, { input, timeout = 30000 } = {}) {
  try {
    const out = execFileSync(WRAPPER, args, {
      encoding: 'utf8', timeout,
      input: input === undefined ? undefined : input,
      stdio: [input === undefined ? 'ignore' : 'pipe', 'pipe', 'pipe'],
    });
    return { ok: true, out: String(out) };
  } catch (e) {
    return { ok: false, out: String((e.stdout || '') + (e.stderr || '') || e.message) };
  }
}

/**
 * Ruft ein CBM-Tool auf und parst die JSON-Antwort.
 *
 * Argumente gehen über stdin — das ist die vom Binary empfohlene Form. Positionales
 * Roh-JSON (`cli <tool> '{…}'`, so noch im Upstream-README) ist in v0.9.0 deprecated
 * und schreibt eine Warnung nach stderr; `--raw` existiert nicht mehr.
 */
function cli(tool, args = {}, timeout = 300000) {
  const res = wrapper(['cli', tool], { input: JSON.stringify(args), timeout });
  if (!res.ok) return { ok: false, data: null, raw: res.out };
  try {
    return { ok: true, data: JSON.parse(res.out), raw: res.out };
  } catch {
    return { ok: false, data: null, raw: res.out };
  }
}

/**
 * Führt alle globalen Checks aus und liefert [{label, ok, mandatory, detail}].
 * Keine Seiteneffekte ausser einem read-only CLI-Aufruf (list_projects).
 */
function verifyGlobal() {
  const r = [];
  const check = (label, ok, detail) => r.push({ label, ok: !!ok, mandatory: true, detail: detail || '' });
  const warn = (label, ok, detail) => r.push({ label, ok: !!ok, mandatory: false, detail: detail || '' });

  // 1) Binary vorhanden + ausführbar
  const binPath = path.join(CURRENT, 'codebase-memory-mcp');
  let binOk = false;
  try { fs.accessSync(binPath, fs.constants.X_OK); binOk = true; } catch { /* bleibt false */ }
  check('Binary vorhanden + ausführbar', binOk, binPath);

  // 2) Version entspricht release.json
  let installed = '';
  if (binOk) {
    try {
      const out = execFileSync(binPath, ['--version'], { encoding: 'utf8', timeout: 15000 });
      installed = (String(out).match(/\d+\.\d+\.\d+/) || [''])[0];
    } catch { /* installed bleibt leer */ }
  }
  check(`Version = Pin (${RELEASE.version})`, installed === PINNED, `installiert: ${installed || '—'}`);

  // 3) Wrapper vorhanden + auf PATH auflösbar
  check('Wrapper vorhanden + ausführbar', exists(WRAPPER) && (fs.statSync(WRAPPER).mode & 0o100) !== 0, WRAPPER);
  let onPath = false;
  try { onPath = !!execFileSync('bash', ['-lc', 'command -v codebase-memory-mcp-harness'], { encoding: 'utf8' }).trim(); } catch { /* false */ }
  check('codebase-memory-mcp-harness ist auf dem PATH', onPath);

  // 4) Wrapper zeigt auf die korrekte Version
  let link = '';
  try { link = fs.readlinkSync(CURRENT); } catch { /* leer */ }
  check('current-Symlink → gepinnte Version', link === PINNED, `current → ${link || '—'}`);

  // 5) Cache-Pfad sicher (0700)
  const cacheMode = exists(CACHE_DIR) ? (fs.statSync(CACHE_DIR).mode & 0o777) : null;
  check('Cache-Verzeichnis mit 0700', cacheMode === 0o700, `${CACHE_DIR} → ${cacheMode === null ? 'fehlt' : cacheMode.toString(8)}`);

  // 6) Sicherheitsgrenzen im Wrapper gesetzt
  const w = read(WRAPPER);
  check('CBM_ALLOWED_ROOT im Wrapper gesetzt', /export CBM_ALLOWED_ROOT=/.test(w));
  check('CBM_CACHE_DIR im Wrapper gesetzt', /export CBM_CACHE_DIR=/.test(w));
  check('umask 077 im Wrapper', /^umask 077$/m.test(w));

  // 7) Keine UI-Variante, kein Port
  check('Variante ist "standard" (keine UI)', RELEASE.variant === 'standard');
  check('Wrapper startet keine UI (kein --ui/--port)', !/--ui|--port|9749/.test(w));

  // 8) Keine Upstream-Hooks / keine CBM-Spur in ~/.claude/settings.json
  const sRaw = read(SETTINGS);
  let s = null;
  try { s = JSON.parse(sRaw); } catch { /* s bleibt null */ }
  check('~/.claude/settings.json ist gültiges JSON', !!s);
  const hooksJson = JSON.stringify((s && s.hooks) || {});
  check('kein Upstream-Grep/Glob-Hook installiert',
    !/codebase-memory|cbm-code-discovery-gate|cbm_code_discovery/i.test(hooksJson));
  check('kein CBM-Eintrag in ~/.claude/settings.json (MCP bleibt projektlokal)',
    !/codebase-memory/i.test(sRaw));
  const shim = path.join(HOME, '.claude', 'hooks', 'cbm-code-discovery-gate');
  check('kein cbm-code-discovery-gate-Shim in ~/.claude/hooks', !exists(shim));

  // 9) RTK unangetastet
  check('RTK-Hook (PreToolUse:Bash) weiterhin vorhanden',
    /rtk hook claude/.test(JSON.stringify((s && s.hooks && s.hooks.PreToolUse) || [])));

  // 10) Sichere Config: kein Auto-Index, kein Hintergrund-Watcher, keine persistierte UI
  const cfg = exists(WRAPPER) ? wrapper(['config', 'list']) : { ok: false, out: '' };
  const cfgTxt = cfg.out.replace(/\s+/g, ' ');
  check('auto_index = false', /auto_index\s*=\s*false/i.test(cfgTxt), cfg.ok ? '' : 'config list nicht lesbar');
  check('auto_watch = false', /auto_watch\s*=\s*false/i.test(cfgTxt), cfg.ok ? '' : 'config list nicht lesbar');
  // `--ui=true` / `--port=N` würden sich in die Config persistieren — dürfen dort nie auftauchen.
  check('keine persistierte UI in der CBM-Config', !/\bui\s*=\s*true|\bport\s*=/i.test(cfgTxt));

  // 11) CLI kann eine harmlose (read-only) Abfrage ausführen
  const lp = exists(WRAPPER) ? cli('list_projects', {}, 30000) : { ok: false, raw: '' };
  check('CLI-Abfrage funktioniert (list_projects)', lp.ok, lp.ok ? '' : String(lp.raw).split('\n')[0]);

  // 12) Rollback-Ziel (informativ)
  let prev = '';
  try { prev = fs.readlinkSync(path.join(LIB_DIR, 'previous')); } catch { /* leer */ }
  warn('Rollback-Ziel vorhanden (previous)', !!prev, prev ? `previous → ${prev}` : 'keins (erste Installation)');

  return r;
}

/** Liste der indexierten Projekte. */
function listProjects() {
  const res = cli('list_projects', {}, 30000);
  const arr = res.ok ? (Array.isArray(res.data) ? res.data : (res.data.projects || [])) : [];
  return { ok: res.ok, projects: Array.isArray(arr) ? arr : [], raw: res.raw };
}

function report(results) {
  let failed = 0;
  process.stdout.write('\n=== cbm verify (global) ===\n\n');
  for (const x of results) {
    const tag = x.ok ? 'PASS' : (x.mandatory ? 'FAIL' : 'WARN');
    if (!x.ok && x.mandatory) failed++;
    process.stdout.write(`  ${tag}  ${x.label}${x.detail ? `  — ${x.detail}` : ''}\n`);
  }
  const mand = results.filter((x) => x.mandatory).length;
  process.stdout.write(`\n${mand - failed}/${mand} Pflicht-Checks grün${failed ? ` — ${failed} FAIL` : ' — ALLE GRÜN'}\n\n`);
  return failed ? 1 : 0;
}

module.exports = { verifyGlobal, listProjects, cli, wrapper, report, WRAPPER, CACHE_DIR, LIB_DIR, PINNED, RELEASE };

if (require.main === module) {
  process.exit(report(verifyGlobal()));
}

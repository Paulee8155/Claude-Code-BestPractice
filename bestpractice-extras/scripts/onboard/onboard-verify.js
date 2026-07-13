#!/usr/bin/env node
'use strict';

/**
 * onboard-verify.js — maschinelle Abnahme-Suite für das slim ECC-Onboarding.
 *
 *   node onboard-verify.js --project <root>
 *
 * Belegt „fertig = Ziel erreicht": prüft den slim Projekt-Fußabdruck, den global
 * verankerten state-sync, die Abwesenheit von Altlasten und die Plugin-Erreichbarkeit.
 * Exit 0 nur, wenn alle PFLICHT-Assertions grün sind; WARN-Punkte beeinflussen den
 * Exit-Code nicht (z.B. unverfeinerte Template-Platzhalter, optionale .mcp.json).
 *
 * Die Engine-Round-Trip-Prüfung läuft in einer isolierten Temp-Sandbox gegen die
 * GLOBAL deployte Engine (~/.claude/state-sync/) — das Projekt wird nie verändert.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const HOME = process.env.HOME || '/root';
const GLOBAL_DIR = path.join(HOME, '.claude', 'state-sync');
const GLOBAL_ENGINE = path.join(GLOBAL_DIR, 'state-sync.js');
const GLOBAL_SETTINGS = path.join(HOME, '.claude', 'settings.json');

function parseArgs(argv) {
  const a = { project: process.cwd() };
  for (let i = 2; i < argv.length; i++) if (argv[i] === '--project') a.project = argv[++i] || a.project;
  return a;
}
function exists(p) { try { fs.accessSync(p); return true; } catch { return false; } }
function read(p) { try { return fs.readFileSync(p, 'utf8'); } catch { return ''; } }
function readJSON(p) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; } }

const results = [];
function check(label, ok, detail) { results.push({ label, ok: !!ok, mandatory: true, detail }); }
function warnc(label, ok, detail) { results.push({ label, ok: !!ok, mandatory: false, detail }); }

function meaningful(text) {
  return text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('<!--') && !l.startsWith('#'));
}

// --- 3+5: Engine-Round-Trip + Guard-No-op in isolierter Sandbox (global deployed) ---
function engineSandbox() {
  let lib, pre, post;
  try {
    lib = require(path.join(GLOBAL_DIR, 'lib'));
    pre = require(path.join(GLOBAL_DIR, 'to-working-context'));
    post = require(path.join(GLOBAL_DIR, 'from-working-context'));
  } catch (e) {
    check('Engine ladbar (global)', false, e.message);
    return;
  }
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'onboard-verify-'));
  try {
    // Round-Trip
    const proj = path.join(base, 'rt');
    fs.mkdirSync(path.join(proj, 'state'), { recursive: true });
    for (const n of lib.STATE_FILES) fs.writeFileSync(path.join(proj, 'state', `${n}.md`), `# ${n}\n`, 'utf8');
    fs.writeFileSync(path.join(proj, 'state', '.ecc-managed'), 'x\n', 'utf8');
    pre.run(['--project', proj]);
    const wcPath = path.join(proj, 'WORKING-CONTEXT.md');
    let wc = read(wcPath);
    const zonesOk = lib.STATE_FILES.every((n) => wc.includes(lib.stateMarker(n, 'START')));
    wc = lib.upsertZone(wc, lib.syncMarker('tasks-inbox', 'START'), lib.syncMarker('tasks-inbox', 'END'), '- [ ] VERIFY-PROBE');
    fs.writeFileSync(wcPath, wc, 'utf8');
    const r1 = post.run(['--project', proj]);
    const landed = read(path.join(proj, 'state', 'tasks.md')).includes('VERIFY-PROBE');
    const r2 = post.run(['--project', proj]);
    const idempotent = r2.tasks === 0;
    check('state-sync Round-Trip (pre→post)', zonesOk && r1.tasks === 1 && landed, `zones=${zonesOk} delta=${r1.tasks} landed=${landed}`);
    check('state-sync Idempotenz (2. post = no-op)', idempotent, `2.post tasks=${r2.tasks}`);

    // Guard-No-op: state/ ohne Sentinel und ohne 4 Dateien → kein WC
    const tf = path.join(base, 'tf');
    fs.mkdirSync(path.join(tf, 'state'), { recursive: true });
    fs.writeFileSync(path.join(tf, 'state', 'terraform.tfstate'), '{}', 'utf8');
    const rg = pre.run(['--project', tf]);
    check('Guard-No-op (fremdes state/)', rg.skipped === true && !exists(path.join(tf, 'WORKING-CONTEXT.md')), `skipped=${rg.skipped}`);
  } finally {
    fs.rmSync(base, { recursive: true, force: true });
  }
}

function findAudit() {
  const baseDir = path.join(HOME, '.claude', 'plugins', 'cache', 'ecc', 'ecc');
  if (!exists(baseDir)) return null;
  for (const v of fs.readdirSync(baseDir)) {
    const cand = path.join(baseDir, v, 'scripts', 'harness-audit.js');
    if (exists(cand)) return cand;
  }
  return null;
}

function main() {
  const root = path.resolve(parseArgs(process.argv).project);
  process.stdout.write(`\n=== onboard-verify — ${root} ===\n`);

  // 1) settings env
  const s = readJSON(path.join(root, '.claude', 'settings.json'));
  check('1 settings.json env (HOOK_PROFILE=standard, GATEGUARD=off)',
    s && s.env && s.env.ECC_HOOK_PROFILE === 'standard' && s.env.ECC_GATEGUARD === 'off');

  // 2) state/ + sentinel
  const stateOk = ['context', 'decisions', 'tasks', 'progress']
    .every((n) => exists(path.join(root, 'state', `${n}.md`)));
  check('2 state/ vollständig + Sentinel', stateOk && exists(path.join(root, 'state', '.ecc-managed')));

  // 3+5) Engine round-trip + guard (sandbox)
  engineSandbox();

  // 4) globaler Hook + Engine erreichbar
  const gs = readJSON(GLOBAL_SETTINGS);
  const hookOk = gs && gs.hooks &&
    ['SessionStart', 'Stop', 'PreCompact'].every((e) => JSON.stringify(gs.hooks[e] || []).includes('state-sync'));
  let engineRuns = false;
  try {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ov-eng-'));
    execFileSync('node', [GLOBAL_ENGINE, 'pre', '--project', tmp], { stdio: 'ignore' });
    engineRuns = true; fs.rmSync(tmp, { recursive: true, force: true });
  } catch { /* engineRuns stays false */ }
  check('4 globaler state-sync-Hook + Engine ausführbar', hookOk && exists(GLOBAL_ENGINE) && engineRuns);

  // 6) keine Altlasten (außerhalb .harness-backup/)
  // Root-AGENTS.md/.codex/.agents sind Codex-Projektwahrheit, keine Altlast — nur
  // die .claude/-Dumps des alten Installers zaehlen. Siehe onboard.js decruftTargets().
  const cruft = ['.claude/rules/ecc', '.claude/skills/ecc', '.claude/ecc', '.claude/plugin.json',
    '.claude/marketplace.json', '.claude/AGENTS.md', '.claude/PLUGIN_SCHEMA_NOTES.md', '.claude/.agents',
    '.superpowers'].filter((c) => exists(path.join(root, c)));
  check('6 keine vendored ECC-Altlasten', cruft.length === 0, cruft.length ? `gefunden: ${cruft.join(', ')}` : '');
  const ECC_MCP = ['memory', 'context7', 'exa', 'playwright', 'github', 'sequential-thinking'];
  const mcp = readJSON(path.join(root, '.mcp.json'));
  const mcpDup = mcp && Object.keys(mcp.mcpServers || {}).filter((s) => ECC_MCP.includes(s));
  warnc('6b keine ECC-Server in projekt-.mcp.json', !mcpDup || mcpDup.length === 0,
    mcpDup && mcpDup.length ? `dupliziert global: ${mcpDup.join(', ')}` : '');

  // 7) PROJECT_RULES + CLAUDE.md (Existenz pflicht; Platzhalter = Warnung)
  const prPath = path.join(root, 'PROJECT_RULES.md');
  const cmPath = path.join(root, 'CLAUDE.md');
  check('7 PROJECT_RULES.md + CLAUDE.md vorhanden', exists(prPath) && exists(cmPath));
  const prText = read(prPath);
  warnc('7b PROJECT_RULES ohne [Platzhalter]/TODO', !/\[[A-Za-zÄÖÜ]/.test(prText) && !/\bTODO\b/.test(prText),
    'verfeinern: echte Werte statt Template-Platzhalter');

  // 8) Plugin erreichbar
  const audit = findAudit();
  check('8 Plugin ecc@ecc erreichbar', !!audit && !!gs && gs.enabledPlugins && gs.enabledPlugins['ecc@ecc'] === true,
    audit ? '' : 'harness-audit.js nicht gefunden');

  // 9) rtk unangetastet
  check('9 rtk-Hook (global) vorhanden',
    gs && gs.hooks && JSON.stringify(gs.hooks.PreToolUse || []).includes('rtk'));

  // 11) Secret-Hygiene
  const gi = read(path.join(root, '.gitignore')).split(/\r?\n/).map((l) => l.trim());
  const envIgnored = gi.some((l) => l === '.env' || l === '.env.*' || l === '*.env');
  const syncIgnored = gi.includes('state/.sync/');
  check('11 Secret-Hygiene (.env + state/.sync/ ignoriert)', envIgnored && syncIgnored);

  // 10) harness-audit (Report-only, nicht-fatal)
  if (audit) {
    try {
      const out = execFileSync('node', [audit], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 60000 });
      const m = out.match(/(\d+)\s*\/\s*(\d+)/);
      warnc('10 harness-audit Score', true, m ? `${m[0]}` : 'gelaufen');
    } catch (e) {
      warnc('10 harness-audit Score', true, `nicht ausgewertet (${e.status || 'err'})`);
    }
  }

  // --- Report ---
  process.stdout.write('\n');
  let failed = 0;
  for (const r of results) {
    const tag = r.ok ? 'PASS' : (r.mandatory ? 'FAIL' : 'WARN');
    if (!r.ok && r.mandatory) failed++;
    process.stdout.write(`  ${tag}  ${r.label}${r.detail ? `  — ${r.detail}` : ''}\n`);
  }
  const mand = results.filter((r) => r.mandatory).length;
  process.stdout.write(`\n${mand - failed}/${mand} Pflicht-Checks grün${failed ? ` — ${failed} FAIL` : ' — ALLE GRÜN'}\n\n`);
  process.exit(failed ? 1 : 0);
}

main();

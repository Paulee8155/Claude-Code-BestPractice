#!/usr/bin/env node
'use strict';

/**
 * onboard.js — zuverlässiges, schlankes ECC-Onboarding für beliebige Projekte.
 *
 * Plugin-only-Modell: ECC-Core ist global (`ecc@ecc`); ins Projekt kommt NUR der
 * minimale projektlokale Kern. Dieses Script ist deterministisch und idempotent.
 *
 *   node onboard.js --project <root>            # DRY-RUN (Default): zeigt den Plan, schreibt nichts
 *   node onboard.js --project <root> --apply    # führt den Plan aus + Postflight-Verify
 *
 * Ablauf (apply):
 *   Preflight  → De-Cruft (move → .harness-backup/<stamp>/) → Slim-Scaffold
 *   (settings.json env-merge + state-sync-Hook-Strip, state/, Sentinel, .gitignore)
 *   → consumer-scaffold → harvest → initialer PRE-Sync → onboard-verify.
 *
 * Sicher: De-Cruft VERSCHIEBT (nie Hard-Delete); Scaffold ist additiv (überschreibt
 * keine User-Inhalte). Exit-Code = Verify-Code (apply) bzw. 0 (dry-run).
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ONBOARD_DIR = __dirname;                                   // .../scripts/onboard
const EXTRAS = path.resolve(ONBOARD_DIR, '..', '..');            // bestpractice-extras
const TEMPLATES = path.join(EXTRAS, 'templates');
const CONSUMER_SCAFFOLD = path.join(ONBOARD_DIR, 'consumer-scaffold.js');
const HARVEST = path.join(EXTRAS, 'scripts', 'context-harvest', 'harvest.js');
const STATE_SYNC = path.join(EXTRAS, 'scripts', 'state-sync', 'state-sync.js');
const VERIFY = path.join(ONBOARD_DIR, 'onboard-verify.js');
const GLOBAL_ENGINE = path.join(process.env.HOME || '/root', '.claude', 'state-sync', 'state-sync.js');
const GLOBAL_SETTINGS = path.join(process.env.HOME || '/root', '.claude', 'settings.json');

const STATE_FILES = ['context', 'decisions', 'tasks', 'progress'];

function log(m) { process.stdout.write(`${m}\n`); }
function warn(m) { process.stderr.write(`[onboard] ${m}\n`); }

function parseArgs(argv) {
  const args = { project: process.cwd(), apply: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--project') args.project = argv[++i] || args.project;
    else if (a === '--apply') args.apply = true;
    else if (a === '--dry-run') args.apply = false;
  }
  return args;
}

function exists(p) { try { fs.accessSync(p); return true; } catch { return false; } }
function isDir(p) { try { return fs.statSync(p).isDirectory(); } catch { return false; } }

function stamp() {
  // Normaler Node-Prozess (kein Workflow-Sandbox) → Date ist erlaubt.
  return new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
}

/** Verschiebt einen Pfad nach <backupDir>/<rel> und legt Zielordner an. */
function moveToBackup(root, rel, backupDir, apply) {
  const src = path.join(root, rel);
  const dest = path.join(backupDir, rel);
  if (apply) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.renameSync(src, dest);
  }
}

/** Server, die das globale Plugin ecc@ecc bereits bereitstellt. */
const ECC_MCP_SERVERS = ['memory', 'context7', 'exa', 'playwright', 'github', 'sequential-thinking'];

/** Wahr, wenn die .mcp.json mind. einen ECC-Plugin-Server dupliziert. */
function mcpDuplicatesEcc(mcpPath) {
  if (!exists(mcpPath)) return false;
  try {
    const j = JSON.parse(fs.readFileSync(mcpPath, 'utf8'));
    const servers = Object.keys((j && j.mcpServers) || {});
    return servers.some((s) => ECC_MCP_SERVERS.includes(s));
  } catch { return false; }
}

/** Ermittelt die De-Cruft-Ziele (existierende Altlasten) im Projekt. */
function decruftTargets(root) {
  const targets = [];
  const add = (rel) => { if (exists(path.join(root, rel))) targets.push(rel); };

  // Vendoring-Signatur eines alten Installers (vendored ECC-Dump).
  const vendored =
    exists(path.join(root, '.claude', 'plugin.json')) ||
    exists(path.join(root, '.claude', 'rules', 'ecc')) ||
    exists(path.join(root, '.claude', 'AGENTS.md'));

  // Plugin-Metadaten + Codex/Superpowers-Altlasten (immer, falls vorhanden).
  ['.claude/plugin.json', '.claude/marketplace.json', '.claude/PLUGIN_SCHEMA_NOTES.md',
   '.claude/AGENTS.md', '.claude/.agents', 'AGENTS.md', '.codex', '.superpowers'].forEach(add);

  // settings.json-Backups des alten Installers.
  const claudeDir = path.join(root, '.claude');
  if (isDir(claudeDir)) {
    for (const n of fs.readdirSync(claudeDir)) {
      if (/^settings\.json\.bak/.test(n)) targets.push(path.join('.claude', n));
    }
  }

  // Wholesale nur bei bestätigter Vendoring-Signatur (schützt echte Custom-Setups
  // wie Research_Agent, die kein alter Installer angelegt hat).
  if (vendored) {
    ['.claude/rules', '.claude/skills', '.claude/agents',
     '.claude/commands', '.claude/mcp-configs', '.claude/scripts'].forEach(add);
  }

  // Projekt-.mcp.json nur, wenn sie ECC-Plugin-Server dupliziert (Doppelstart vermeiden).
  if (mcpDuplicatesEcc(path.join(root, '.mcp.json'))) targets.push('.mcp.json');

  return { targets, vendored };
}

/** settings.json: env-Block setzen + state-sync-Hooks strippen (additiv sonst). */
function planSettings(root, apply) {
  const p = path.join(root, '.claude', 'settings.json');
  let s = {};
  let existed = false;
  if (exists(p)) { existed = true; try { s = JSON.parse(fs.readFileSync(p, 'utf8')); } catch { s = {}; } }

  s.env = s.env || {};
  s.env.ECC_HOOK_PROFILE = 'standard';
  s.env.ECC_GATEGUARD = 'off';

  // Redundante projektlokale state-sync-Hooks entfernen (laufen jetzt global).
  let stripped = 0;
  if (s.hooks) {
    for (const evt of ['SessionStart', 'Stop', 'PreCompact']) {
      if (!Array.isArray(s.hooks[evt])) continue;
      const before = s.hooks[evt].length;
      s.hooks[evt] = s.hooks[evt].filter((grp) => {
        const hs = (grp && grp.hooks) || [];
        return !hs.some((h) => h && typeof h.command === 'string' && h.command.includes('state-sync'));
      });
      stripped += before - s.hooks[evt].length;
      if (s.hooks[evt].length === 0) delete s.hooks[evt];
    }
    if (Object.keys(s.hooks).length === 0) delete s.hooks;
  }

  if (apply) {
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, JSON.stringify(s, null, 2) + '\n', 'utf8');
  }
  return { action: existed ? 'merge' : 'create', path: '.claude/settings.json', stripped };
}

/** state/-Dateien aus Templates (nur falls fehlend) + Sentinel anlegen. */
function planState(root, apply) {
  const acts = [];
  const stateDir = path.join(root, 'state');
  if (apply) fs.mkdirSync(stateDir, { recursive: true });
  for (const n of STATE_FILES) {
    const dest = path.join(stateDir, `${n}.md`);
    if (exists(dest)) { acts.push({ action: 'skip', path: `state/${n}.md` }); continue; }
    const tpl = path.join(TEMPLATES, 'state', `${n}.md`);
    if (apply) fs.writeFileSync(dest, exists(tpl) ? fs.readFileSync(tpl, 'utf8') : `# ${n}\n`, 'utf8');
    acts.push({ action: 'create', path: `state/${n}.md` });
  }
  const sentinel = path.join(stateDir, '.ecc-managed');
  if (exists(sentinel)) {
    acts.push({ action: 'skip', path: 'state/.ecc-managed' });
  } else {
    if (apply) fs.writeFileSync(sentinel, 'ECC-managed state/ — state-sync-Guard-Sentinel. Nicht löschen.\n', 'utf8');
    acts.push({ action: 'create', path: 'state/.ecc-managed' });
  }
  return acts;
}

/** PROJECT_RULES.md (aus Template) + CLAUDE.md-Starter anlegen, nur falls fehlend. */
function planDocs(root, apply) {
  const acts = [];
  const pr = path.join(root, 'PROJECT_RULES.md');
  if (exists(pr)) {
    acts.push({ action: 'skip', path: 'PROJECT_RULES.md' });
  } else {
    const tpl = path.join(TEMPLATES, 'PROJECT_RULES.template.md');
    if (apply) fs.writeFileSync(pr, exists(tpl) ? fs.readFileSync(tpl, 'utf8') : '# PROJECT_RULES\n', 'utf8');
    acts.push({ action: 'create', path: 'PROJECT_RULES.md (Template → mit echten Werten verfeinern)' });
  }
  const cm = path.join(root, 'CLAUDE.md');
  if (exists(cm)) {
    acts.push({ action: 'skip', path: 'CLAUDE.md' });
  } else {
    if (apply) fs.writeFileSync(cm, claudeStarter(path.basename(root)), 'utf8');
    acts.push({ action: 'create', path: 'CLAUDE.md (Starter → Befehle ergänzen)' });
  }
  return acts;
}

function claudeStarter(name) {
  return [
    `# CLAUDE.md — Arbeitsvertrag (${name})`,
    '',
    '> ECC-Core ist global (`ecc@ecc`). Projektdetails: `PROJECT_RULES.md`.',
    '',
    '## Pflicht-Workflow (ECC 5-Phasen, jede Aufgabe > 30 Min)',
    '1. RESEARCH → Explore/Codebase verstehen',
    '2. PLAN → `/plan` (wartet auf OK)',
    '3. IMPLEMENT → `/feature-dev` + TDD (Tests zuerst)',
    '4. REVIEW → `/code-review` (+ sprachspezifisch)',
    '5. VERIFY → Tests/Build grün',
    '',
    '## Befehle (ergänzen, sobald Stack klar)',
    '- Build: `TODO`',
    '- Test: `TODO`',
    '- Lint: `TODO`',
    '',
    '## Kontext',
    '- Quelle der Wahrheit: `state/` (Mensch) ⇄ `WORKING-CONTEXT.md` (Loop, generiert).',
    '- State-Sync läuft global (SessionStart/Stop/PreCompact).',
    '',
  ].join('\n');
}

/** .gitignore: .harness-backup/ + state/.sync/ sicherstellen (Secret-Block macht consumer-scaffold). */
function planGitignore(root, apply) {
  const gi = path.join(root, '.gitignore');
  let cur = exists(gi) ? fs.readFileSync(gi, 'utf8') : '';
  const lines = cur.split(/\r?\n/).map((l) => l.trim());
  const need = [];
  for (const want of ['.harness-backup/', 'state/.sync/']) {
    if (!lines.includes(want)) need.push(want);
  }
  if (need.length === 0) return { action: 'skip', path: '.gitignore (backup/sync)' };
  if (apply) {
    const block = '\n# --- ECC slim onboarding ---\n' + need.join('\n') + '\n';
    fs.writeFileSync(gi, cur + (cur.endsWith('\n') || cur === '' ? '' : '\n') + block, 'utf8');
  }
  return { action: exists(gi) ? 'merge' : 'create', path: '.gitignore (backup/sync)' };
}

function run(script, argv) {
  try {
    const out = execFileSync('node', [script, ...argv], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    if (out.trim()) log(out.trim());
    return 0;
  } catch (e) {
    if (e.stdout) log(String(e.stdout).trim());
    if (e.stderr) warn(String(e.stderr).trim());
    return e.status || 1;
  }
}

function preflight(root) {
  const checks = [];
  checks.push({ ok: true, msg: `node ${process.version}` });
  checks.push({ ok: exists(GLOBAL_ENGINE), msg: `globale state-sync-Engine: ${GLOBAL_ENGINE}` });
  let hookOk = false;
  try {
    const gs = JSON.parse(fs.readFileSync(GLOBAL_SETTINGS, 'utf8'));
    const ss = (gs.hooks && gs.hooks.SessionStart) || [];
    hookOk = JSON.stringify(ss).includes('state-sync');
  } catch { /* ignore */ }
  checks.push({ ok: hookOk, msg: 'globaler state-sync-Hook in ~/.claude/settings.json' });
  return checks;
}

function main() {
  const args = parseArgs(process.argv);
  const root = path.resolve(args.project);
  const mode = args.apply ? 'APPLY' : 'DRY-RUN';

  if (!exists(root)) { warn(`Projekt-Root fehlt: ${root}`); process.exit(2); }
  if (path.basename(root) === 'ecc') { warn('Abbruch: ECC-Engine-Teilbaum ist kein Onboarding-Ziel.'); process.exit(2); }

  log(`\n=== ECC slim onboarding (${mode}) — ${root} ===\n`);

  log('Preflight:');
  for (const c of preflight(root)) log(`  ${c.ok ? 'OK ' : 'WARN'}  ${c.msg}`);

  const { targets, vendored } = decruftTargets(root);
  log(`\nDe-Cruft (Vendoring-Signatur: ${vendored ? 'ja' : 'nein'}):`);
  if (targets.length === 0) log('  (keine Altlasten gefunden)');
  else targets.forEach((t) => log(`  backup   ${t}  → .harness-backup/<stamp>/`));

  if (!args.apply) {
    // Dry-Run: Scaffold-Plan ohne Schreiben berechnen.
    log('\nSlim-Scaffold (geplant):');
    const set = planSettings(root, false);
    log(`  ${set.action.padEnd(7)} ${set.path}${set.stripped ? `  (− ${set.stripped} state-sync-Hook-Gruppe(n))` : ''}`);
    planState(root, false).forEach((a) => log(`  ${a.action.padEnd(7)} ${a.path}`));
    planDocs(root, false).forEach((a) => log(`  ${a.action.padEnd(7)} ${a.path}`));
    const gi = planGitignore(root, false);
    log(`  ${gi.action.padEnd(7)} ${gi.path}`);
    log('  create  .claude/memory.md, SECURITY.md, .gitignore-Secrets  (consumer-scaffold)');
    log('  fill    state/context.md, state/tasks.md  (harvest, falls git/README)');
    log('  pre     WORKING-CONTEXT.md  (initialer state-sync PRE)');
    log('\nDRY-RUN — nichts geschrieben. Mit --apply ausführen.\n');
    process.exit(0);
  }

  // --- APPLY ---
  const backupDir = path.join(root, '.harness-backup', stamp());
  if (targets.length) {
    log(`\nDe-Cruft → ${path.relative(root, backupDir)}/`);
    for (const t of targets) { moveToBackup(root, t, backupDir, true); log(`  moved  ${t}`); }
  }

  log('\nSlim-Scaffold:');
  const set = planSettings(root, true);
  log(`  ${set.action} .claude/settings.json${set.stripped ? `  (− ${set.stripped} state-sync-Hook-Gruppe(n))` : ''}`);
  planState(root, true).forEach((a) => log(`  ${a.action} ${a.path}`));
  planDocs(root, true).forEach((a) => log(`  ${a.action} ${a.path}`));
  const gi = planGitignore(root, true);
  log(`  ${gi.action} ${gi.path}`);

  log('\nConsumer-Scaffold:');
  run(CONSUMER_SCAFFOLD, ['--project', root]);
  log('\nContext-Harvest:');
  run(HARVEST, ['--project', root]);
  log('\nInitialer PRE-Sync:');
  run(STATE_SYNC, ['pre', '--project', root]);

  log('\nPostflight-Verify:');
  const code = run(VERIFY, ['--project', root]);
  log(`\n=== Onboarding ${code === 0 ? 'GRÜN' : 'mit offenen Punkten (Verify-Exit ' + code + ')'} ===\n`);
  process.exit(code);
}

main();

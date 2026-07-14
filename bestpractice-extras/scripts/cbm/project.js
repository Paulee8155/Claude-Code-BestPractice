#!/usr/bin/env node
'use strict';

/**
 * project.js — die EINE Projektlogik hinter /cbm und /ecc-onboard --with-cbm.
 *
 *   node project.js status   [--project <root>]
 *   node project.js enable   [--project <root>] [--yes]
 *   node project.js reindex  [--project <root>] [--yes]
 *   node project.js doctor   [--project <root>]
 *   node project.js disable  [--project <root>] [--yes] [--remove-ignore]
 *
 * Ohne --yes ist jede schreibende Aktion ein DRY-RUN: sie zeigt den Plan und
 * verändert nichts. Der Slash-Command holt dazwischen die Bestätigung ein.
 *
 * Der Graph-Index wird NIE automatisch gelöscht — delete_project ruft dieses
 * Skript grundsätzlich nicht auf.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const mcpConfig = require('./mcp-config');
const cbmignore = require('./cbmignore');
const { cli, verifyGlobal, listProjects, WRAPPER, CACHE_DIR } = require('./verify');

// Muss dem Wrapper-Default entsprechen (wrapper.sh).
const ALLOWED_ROOT = process.env.CBM_ALLOWED_ROOT || '/root/projekte';

function log(m) { process.stdout.write(`${m}\n`); }
function fail(m) { process.stderr.write(`[cbm] FEHLER: ${m}\n`); process.exit(1); }

function parseArgs(argv) {
  const a = { action: argv[2] || 'status', project: null, yes: false, removeIgnore: false };
  for (let i = 3; i < argv.length; i++) {
    if (argv[i] === '--project') a.project = argv[++i];
    else if (argv[i] === '--yes') a.yes = true;
    else if (argv[i] === '--remove-ignore') a.removeIgnore = true;
  }
  return a;
}

/** Projekt-Root: explizit > git-Toplevel > cwd. */
function resolveRoot(explicit) {
  if (explicit) return path.resolve(explicit);
  try {
    const top = execFileSync('git', ['rev-parse', '--show-toplevel'], {
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (top) return path.resolve(top);
  } catch { /* kein git-Repo → cwd */ }
  return process.cwd();
}

/**
 * Pfadsicherheit — fail-closed. Beide Seiten werden über realpath aufgelöst,
 * damit `..`-Traversal und Symlinks aus dem erlaubten Bereich heraus auffliegen.
 * Der Allowed Root selbst ist KEIN gültiges Projekt (kein /root/projekte-Mega-Index).
 * @returns {{ok: boolean, reason: string, root: string, allowedRoot: string}}
 */
function checkPath(rawRoot, rawAllowed = ALLOWED_ROOT) {
  let root;
  let allowed;
  try { allowed = fs.realpathSync(rawAllowed); } catch {
    return { ok: false, reason: `Allowed Root existiert nicht: ${rawAllowed}`, root: rawRoot, allowedRoot: rawAllowed };
  }
  try { root = fs.realpathSync(path.resolve(rawRoot)); } catch {
    return { ok: false, reason: `Projekt-Root existiert nicht: ${rawRoot}`, root: rawRoot, allowedRoot: allowed };
  }
  if (root === allowed) {
    return {
      ok: false,
      root, allowedRoot: allowed,
      reason: `Projekt-Root ist der Allowed Root selbst (${allowed}). Das wäre ein Mega-Index ` +
              'über alle Projekte — abgelehnt. Ein logisches Quellprojekt = ein Index.',
    };
  }
  if (!root.startsWith(allowed + path.sep)) {
    return {
      ok: false,
      root, allowedRoot: allowed,
      reason: `Projekt liegt ausserhalb von CBM_ALLOWED_ROOT.\n  Projekt (aufgelöst): ${root}\n  Allowed Root:        ${allowed}`,
    };
  }
  return { ok: true, reason: '', root, allowedRoot: allowed };
}

/** Ruft ein CBM-Tool auf. Wirft, wenn Exit != 0 ODER die Antwort status:"error" trägt. */
function tool(name, args, timeout) {
  const res = cli(name, args, timeout);
  if (!res.ok) throw new Error(`${name} fehlgeschlagen: ${String(res.raw).split('\n').slice(-3).join(' ').slice(0, 400)}`);
  if (res.data && res.data.status === 'error') {
    throw new Error(`${name} meldet status=error: ${res.data.message || res.data.error || JSON.stringify(res.data).slice(0, 300)}`);
  }
  return res.data;
}

/** Der von CBM vergebene Projektname — ermittelt über root_path, nie geraten. */
function indexedProject(root) {
  const lp = listProjects();
  if (!lp.ok) return null;
  const real = (() => { try { return fs.realpathSync(root); } catch { return root; } })();
  return lp.projects.find((p) => {
    if (!p.root_path) return false;
    try { return fs.realpathSync(p.root_path) === real; } catch { return p.root_path === real; }
  }) || null;
}

function globalReady() {
  const g = verifyGlobal();
  return { ok: g.filter((c) => c.mandatory && !c.ok).length === 0, results: g };
}

function requireGlobal() {
  if (!fs.existsSync(WRAPPER)) {
    fail('Die globale CBM-Binary fehlt.\n' +
         "  Installieren:  ./install-vps.sh --with-cbm\n" +
         '  (oder: bash bestpractice-extras/scripts/cbm/manage.sh install)');
  }
}

// --- Aktionen -------------------------------------------------------------------

function actionStatus(root) {
  const pc = checkPath(root);
  log(`\n=== /cbm status — ${root} ===\n`);

  requireGlobal();
  const g = globalReady();
  const ver = g.results.find((c) => c.label.startsWith('Version = Pin'));
  log('Global:');
  log(`  Binary-Version:    ${ver ? ver.detail.replace('installiert: ', '') : '—'}  ${g.ok ? '(Installation grün)' : '(Installation ROT → /cbm doctor)'}`);
  log(`  Wrapper:           ${WRAPPER}`);
  log(`  Cache:             ${CACHE_DIR}`);
  log(`  Allowed Root:      ${ALLOWED_ROOT}`);
  const autoIdx = g.results.find((c) => c.label === 'auto_index = false');
  const autoWatch = g.results.find((c) => c.label === 'auto_watch = false');
  log(`  Auto-Index:        ${autoIdx && autoIdx.ok ? 'aus (gewollt)' : 'AN — unerwartet!'}`);
  log(`  Auto-Watch:        ${autoWatch && autoWatch.ok ? 'aus (gewollt)' : 'AN — unerwartet!'}`);

  log('\nProjekt:');
  log(`  Innerhalb Allowed Root: ${pc.ok ? 'ja' : `NEIN — ${pc.reason.split('\n')[0]}`}`);
  const enabled = mcpConfig.isEnabled(root);
  log(`  .mcp.json-Eintrag:      ${enabled ? `ja (${mcpConfig.SERVER_KEY} → ${mcpConfig.SERVER_COMMAND})` : 'nein'}`);
  log(`  .cbmignore:             ${cbmignore.isCurrent(root) ? 'Managed Block aktuell' : 'fehlt/veraltet'}`);

  const p = pc.ok ? indexedProject(root) : null;
  if (p) {
    log(`  Index:                  ${p.name}`);
    log(`                          ${p.nodes} Knoten, ${p.edges} Kanten`);
  } else {
    log('  Index:                  nicht indexiert');
  }

  const warnings = [];
  if (!g.ok) warnings.push('globale Installation hat FAILs → /cbm doctor');
  if (enabled && !p) warnings.push('MCP aktiv, aber Projekt ist nicht indexiert → /cbm reindex');
  if (enabled && !cbmignore.isCurrent(root)) warnings.push('.cbmignore-Block fehlt/veraltet → /cbm enable erneut ausführen');
  if (p && !enabled) warnings.push('Projekt ist indexiert, aber der MCP ist hier nicht aktiviert (nur CLI-Zugriff)');
  log(`\nWarnungen: ${warnings.length ? '' : 'keine'}`);
  warnings.forEach((w) => log(`  - ${w}`));
  log('');
  return 0;
}

function actionEnable(root, yes) {
  requireGlobal();
  const pc = checkPath(root);
  if (!pc.ok) fail(`Aktivierung abgelehnt.\n  ${pc.reason}`);

  const g = globalReady();
  if (!g.ok) fail('Die globale CBM-Installation ist nicht grün. Erst reparieren:\n  bash bestpractice-extras/scripts/cbm/manage.sh verify');

  const planMcp = mcpConfig.enable(root, { apply: false });
  const planIgn = cbmignore.apply(root, { apply: false });
  const already = indexedProject(root);

  log(`\n=== /cbm enable — ${pc.root} ===\n`);
  log('Plan:');
  log(`  .mcp.json    ${planMcp.action}   (unberührt: ${planMcp.others.length ? planMcp.others.join(', ') : 'keine anderen Server'})`);
  log(`  .cbmignore   ${planIgn.action}   (Managed Block; eigene Regeln bleiben unangetastet)`);
  log(`  Index        ${already ? `vorhanden (${already.name}) → wird aufgefrischt` : 'wird neu aufgebaut'}`);
  log('  Danach       Index-Status + Architektur-Smoke-Test');
  log('\n  Nicht angefasst: ~/.claude/settings.json, RTK, ECC-Plugin, andere MCP-Server.');

  if (!yes) {
    log('\nDRY-RUN — nichts verändert. Ausführen mit: --yes\n');
    return 0;
  }
  if (planMcp.action === 'noop' && planIgn.action === 'noop' && already) {
    log('\nBereits aktiviert und indexiert — No-op.\n');
    return 0;
  }

  log('\nAusführung:');
  const m = mcpConfig.enable(root, { apply: true });
  log(`  .mcp.json    ${m.action}${m.backup ? `  (Backup: ${path.basename(m.backup)})` : ''}`);
  const i = cbmignore.apply(root, { apply: true });
  log(`  .cbmignore   ${i.action}`);

  log('  Indexiere … (das kann bei großen Repos dauern)');
  const res = tool('index_repository', { repo_path: pc.root });
  const name = res.project;
  log(`  indexed      ${name} — ${res.nodes} Knoten, ${res.edges} Kanten, status=${res.status}`);
  if (res.status !== 'indexed') log(`  WARN         status=${res.status} (erwartet: indexed)`);

  const st = tool('index_status', { project: name });
  log(`  index_status ${st.status}`);

  const arch = tool('get_architecture', { project: name, aspects: ['all'] });
  const ok = arch && typeof arch.total_nodes === 'number' && arch.total_nodes > 0;
  log(`  Smoke-Test   get_architecture → ${ok ? `OK (${arch.total_nodes} Knoten, ${arch.total_edges} Kanten)` : 'LEER — verdächtig'}`);
  if (!ok) fail('Architektur-Smoke-Test lieferte kein verwertbares Ergebnis.');

  log('\nAktiviert. WICHTIG: Claude-Code-Session in diesem Projekt NEU STARTEN —');
  log('MCP-Server werden nur beim Session-Start geladen. Danach mit /mcp prüfen.\n');
  return 0;
}

function actionReindex(root, yes) {
  requireGlobal();
  const pc = checkPath(root);
  if (!pc.ok) fail(`Reindex abgelehnt.\n  ${pc.reason}`);

  const before = indexedProject(root);
  log(`\n=== /cbm reindex — ${pc.root} ===\n`);
  log('Vorher:');
  log(before
    ? `  ${before.name} — ${before.nodes} Knoten, ${before.edges} Kanten`
    : '  nicht indexiert (wird neu aufgebaut)');

  if (!yes) {
    log('\nDRY-RUN — nichts verändert. Ausführen mit: --yes\n');
    return 0;
  }

  log('\nIndexiere …');
  const res = tool('index_repository', { repo_path: pc.root });
  log(`  ${res.project} — ${res.nodes} Knoten, ${res.edges} Kanten, status=${res.status}`);
  if (res.status !== 'indexed') fail(`Indexierung meldet status=${res.status} (erwartet: indexed).`);

  const st = tool('index_status', { project: res.project });
  log(`  index_status: ${st.status}\n`);
  return st.status === 'ready' ? 0 : 1;
}

function actionDoctor(root) {
  requireGlobal();
  log(`\n=== /cbm doctor — ${root} ===\n`);

  const results = verifyGlobal();
  const add = (label, ok, mandatory, detail) => results.push({ label, ok: !!ok, mandatory, detail: detail || '' });

  // Projektspezifische Checks
  const pc = checkPath(root);
  add('Projekt innerhalb CBM_ALLOWED_ROOT', pc.ok, true, pc.ok ? pc.root : pc.reason.split('\n').join(' '));

  const enabled = mcpConfig.isEnabled(root);
  add('MCP-Eintrag in projekt-.mcp.json', enabled, false, enabled ? '' : 'nicht aktiviert (/cbm enable)');

  if (enabled) {
    add('.cbmignore Managed Block aktuell', cbmignore.isCurrent(root), true);
  }

  // Konflikte mit anderen MCP-Servern
  let others = [];
  try {
    const { json } = mcpConfig.readMcp(mcpConfig.mcpPath(root));
    others = Object.keys(json.mcpServers).filter((k) => k !== mcpConfig.SERVER_KEY);
  } catch (e) {
    add('.mcp.json lesbar', false, true, e.message);
  }
  const ECC_MCP = ['memory', 'context7', 'exa', 'playwright', 'github', 'sequential-thinking'];
  const dup = others.filter((o) => ECC_MCP.includes(o));
  add('keine Duplikate globaler ECC-MCP-Server', dup.length === 0, false,
    dup.length ? `dupliziert: ${dup.join(', ')}` : `andere Server: ${others.length ? others.join(', ') : 'keine'}`);

  const p = pc.ok ? indexedProject(root) : null;
  add('Projekt ist indexiert', !!p, enabled, p ? `${p.name} (${p.nodes} Knoten)` : 'nicht indexiert (/cbm reindex)');

  if (p) {
    try {
      const schema = tool('get_graph_schema', { project: p.name });
      add('get_graph_schema liefert Labels', Array.isArray(schema.node_labels) && schema.node_labels.length > 0, true,
        `${(schema.node_labels || []).length} Labels`);
    } catch (e) { add('get_graph_schema', false, true, e.message.slice(0, 120)); }

    try {
      const arch = tool('get_architecture', { project: p.name, aspects: ['all'] });
      add('get_architecture liefert Ergebnis', arch.total_nodes > 0, true, `${arch.total_nodes} Knoten / ${arch.total_edges} Kanten`);
    } catch (e) { add('get_architecture', false, true, e.message.slice(0, 120)); }

    // Secret-Ausschluss: keine sensiblen Dateien im Graphen
    try {
      const hits = tool('search_graph', { project: p.name, label: 'File', file_pattern: '.*(\\.env|\\.key|\\.pem)$', limit: 5 });
      const found = (hits.results || hits.nodes || []).length;
      add('keine .env/.key/.pem-Dateien im Graphen', found === 0, true, found ? `${found} Treffer — .cbmignore prüfen!` : '');
    } catch (e) { add('Secret-Ausschluss prüfbar', false, false, e.message.slice(0, 120)); }
  }

  const code = report(results);
  log('MCP-/Tool-Budget (Harness-Grenze: max. 10 MCP-Server, max. 80 Tools):');
  log("  CBM steuert 1 MCP-Server und 8 Tools bei (real gemessen via tools/list) — aber nur");
  log("  in Projekten mit .mcp.json-Eintrag.");
  log(`  Hier: CBM ist ${enabled ? 'AKTIV → +1 Server / +8 Tools' : 'nicht aktiv → +0'}.`);
  log('  Reale Gesamtzahl NUR in einer frischen Session mit /mcp und /context ablesbar.\n');
  return code;
}

function actionDisable(root, yes, removeIgnore) {
  const planMcp = mcpConfig.disable(root, { apply: false });
  log(`\n=== /cbm disable — ${root} ===\n`);
  log('Plan:');
  log(`  .mcp.json    ${planMcp.action === 'remove' ? `entferne NUR "${mcpConfig.SERVER_KEY}"` : 'nichts zu tun (kein CBM-Eintrag)'}`);
  log(`               (bleibt unberührt: ${planMcp.others.length ? planMcp.others.join(', ') : 'keine anderen Server'})`);
  log(`  .cbmignore   ${removeIgnore ? 'Managed Block entfernen (--remove-ignore)' : 'BLEIBT (Managed Block wird nicht angefasst)'}`);
  log('  Index        BLEIBT erhalten — er wird nicht gelöscht.');

  if (!yes) {
    log('\nDRY-RUN — nichts verändert. Ausführen mit: --yes\n');
    return 0;
  }

  const m = mcpConfig.disable(root, { apply: true });
  log(`\n  .mcp.json    ${m.action}${m.backup ? `  (Backup: ${path.basename(m.backup)})` : ''}`);
  if (removeIgnore) {
    const i = cbmignore.remove(root, { apply: true });
    log(`  .cbmignore   ${i.action}`);
  }

  const p = indexedProject(root);
  log('\nDeaktiviert. Session neu starten, damit der Server verschwindet.');
  if (p) {
    log('\nDer Graph-Index bleibt bestehen — das ist Absicht (Wiederaktivierung ohne Neuaufbau).');
    log('Wenn du ihn wirklich löschen willst, ist das eine bewusste Einzelentscheidung:');
    log(`  echo '{"project":"${p.name}"}' | codebase-memory-mcp-harness cli delete_project`);
    log('Der komplette Cache aller Projekte: manage.sh purge-cache');
  }
  log('');
  return 0;
}

function report(results) {
  let failed = 0;
  process.stdout.write('\n');
  for (const x of results) {
    const tag = x.ok ? 'PASS' : (x.mandatory ? 'FAIL' : 'WARN');
    if (!x.ok && x.mandatory) failed++;
    process.stdout.write(`  ${tag}  ${x.label}${x.detail ? `  — ${x.detail}` : ''}\n`);
  }
  const mand = results.filter((x) => x.mandatory).length;
  process.stdout.write(`\n${mand - failed}/${mand} Pflicht-Checks grün${failed ? ` — ${failed} FAIL` : ' — ALLE GRÜN'}\n\n`);
  return failed ? 1 : 0;
}

module.exports = { checkPath, resolveRoot, indexedProject, ALLOWED_ROOT };

if (require.main === module) {
  const a = parseArgs(process.argv);
  const root = resolveRoot(a.project);
  try {
    switch (a.action) {
      case 'status':  process.exit(actionStatus(root)); break;
      case 'enable':  process.exit(actionEnable(root, a.yes)); break;
      case 'reindex': process.exit(actionReindex(root, a.yes)); break;
      case 'doctor':  process.exit(actionDoctor(root)); break;
      case 'disable': process.exit(actionDisable(root, a.yes, a.removeIgnore)); break;
      default:
        process.stderr.write('Usage: project.js <status|enable|reindex|doctor|disable> [--project <root>] [--yes]\n');
        process.exit(2);
    }
  } catch (e) {
    fail(e.message);
  }
}

#!/usr/bin/env node
/**
 * consumer-scaffold.js — Schicht-2-Ergänzung zum ECC-Onboarding.
 *
 * Legt im Zielprojekt die Consumer-Konformitäts-Artefakte an, die der ECC-Installer
 * (managed Surfaces) NICHT erzeugt, und wendet die Schicht-2-Modell-Overrides an.
 * Alles idempotent und additiv — bestehende User-Dateien werden NIE überschrieben.
 * ECC-Core (`ecc/`) bleibt unberührt.
 *
 * Anlegen (nur falls fehlend):
 *   - .claude/memory.md   → consumer-memory-notes (durable notes)
 *   - SECURITY.md         → consumer-security-policy
 *   - .mcp.json           → consumer-project-config (kopiert aus ecc/.mcp.json)
 *   - .gitignore          → consumer-secret-hygiene (hängt Secret-Block an, falls `.env` fehlt)
 *
 * Modell-Override (Schicht-2, nach managed Apply):
 *   - .claude/agents/security-reviewer.md: model: sonnet → opus
 *     (ECC-Matrix: Security-kritisch → Opus; der managed Core-Default ist sonnet)
 *
 * Aufruf:
 *   node consumer-scaffold.js --project <ZIELPROJEKT-ROOT> [--ecc-repo <pfad>] [--dry-run]
 *
 * Exit 0 auch bei Teilfehlern (Onboarding nie blockieren); Probleme nach stderr.
 */

'use strict';

const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const args = { project: process.cwd(), eccRepo: null, dryRun: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--project') args.project = argv[++i] || args.project;
    else if (a === '--ecc-repo') args.eccRepo = argv[++i] || args.eccRepo;
    else if (a === '--dry-run') args.dryRun = true;
  }
  return args;
}

// Standard-ECC-Repo relativ zu diesem Script: scripts/onboard/ -> bestpractice-extras/ -> Repo-Root -> ecc/
function defaultEccRepo() {
  return path.resolve(__dirname, '..', '..', '..', 'ecc');
}

function log(msg) { process.stdout.write(`[consumer-scaffold] ${msg}\n`); }
function warn(msg) { process.stderr.write(`[consumer-scaffold] ${msg}\n`); }

const SECRET_BLOCK = [
  '',
  '# --- Secret hygiene (ECC consumer-scaffold) ---',
  '.env',
  '.env.*',
  '!.env.example',
  '*.pem',
  '*.key',
  'secrets.json',
  '',
].join('\n');

function memoryStub(projectName) {
  return [
    `# ${projectName} — Project Memory`,
    '',
    'Durable, checked-in notes for this project. Survives across sessions and feeds',
    'agent context. Keep entries short, factual, and append-only.',
    '',
    '## Conventions',
    '<!-- Stable project conventions agents must respect. -->',
    '',
    '## Gotchas',
    '<!-- Non-obvious traps, workarounds, and constraints. -->',
    '',
    '## Glossary',
    '<!-- Domain terms and their meaning in this codebase. -->',
    '',
  ].join('\n');
}

function securityStub(projectName) {
  return [
    `# Security Policy — ${projectName}`,
    '',
    '## Reporting a Vulnerability',
    '',
    'Report suspected vulnerabilities privately to the maintainers. Do not open a',
    'public issue for security problems. Include reproduction steps and impact.',
    '',
    '## Handling Secrets',
    '',
    '- Never commit secrets (API keys, passwords, tokens). Use env vars or a secret manager.',
    '- `.env*` files are gitignored — keep real secrets out of version control.',
    '- Rotate any credential that may have been exposed.',
    '',
    '## Dependency Hygiene',
    '',
    '- Keep dependencies current; review advisories before upgrading across majors.',
    '- Prefer enabling automated dependency scanning (e.g. Dependabot) once a remote exists.',
    '',
  ].join('\n');
}

function ensureFile(absPath, content, dryRun, results, label) {
  if (fs.existsSync(absPath)) {
    results.skipped.push(label);
    return;
  }
  if (dryRun) { results.wouldCreate.push(label); return; }
  fs.mkdirSync(path.dirname(absPath), { recursive: true });
  fs.writeFileSync(absPath, content, 'utf8');
  results.created.push(label);
}

function ensureGitignoreSecrets(projectRoot, dryRun, results) {
  const gi = path.join(projectRoot, '.gitignore');
  let current = '';
  if (fs.existsSync(gi)) current = fs.readFileSync(gi, 'utf8');
  // Exakte Zeilengleichheit auf bare `.env` ODER ein Wildcard, der es abdeckt (`.env.*`, `*.env`).
  // `.env.production` allein zählt NICHT als Schutz für bare `.env` (vgl. Audit `gitignore.includes('.env')`).
  const lines = current.split(/\r?\n/).map((l) => l.trim());
  const hasEnv = lines.some((l) => l === '.env' || l === '.env.*' || l === '*.env');
  if (hasEnv) { results.skipped.push('.gitignore (secret patterns)'); return; }
  if (dryRun) { results.wouldCreate.push('.gitignore (secret patterns)'); return; }
  fs.writeFileSync(gi, current + (current.endsWith('\n') || current === '' ? '' : '\n') + SECRET_BLOCK, 'utf8');
  results.created.push('.gitignore (secret patterns)');
}

function ensureMcpJson(projectRoot, eccRepo, dryRun, results) {
  const dest = path.join(projectRoot, '.mcp.json');
  if (fs.existsSync(dest)) { results.skipped.push('.mcp.json'); return; }
  const src = path.join(eccRepo, '.mcp.json');
  if (!fs.existsSync(src)) { warn(`.mcp.json-Quelle fehlt: ${src}`); return; }
  if (dryRun) { results.wouldCreate.push('.mcp.json'); return; }
  fs.copyFileSync(src, dest);
  results.created.push('.mcp.json');
}

// Patcht das managed project-level security-reviewer.md auf Opus (idempotent).
// Muss NACH dem managed install-apply laufen, da der Re-Sync sonst auf sonnet zurücksetzt.
function patchSecurityReviewerModel(projectRoot, dryRun, results) {
  const f = path.join(projectRoot, '.claude', 'agents', 'security-reviewer.md');
  if (!fs.existsSync(f)) { results.skipped.push('security-reviewer model (Datei fehlt)'); return; }
  const text = fs.readFileSync(f, 'utf8');
  // Nur den YAML-Frontmatter-Block (zwischen den führenden `---`-Delimitern) patchen,
  // damit kein `model:` im Markdown-Body (z.B. Code-Beispiel) getroffen wird.
  const fm = text.match(/^---\n([\s\S]*?)\n---/);
  if (!fm) { warn('security-reviewer.md: kein YAML-Frontmatter gefunden'); return; }
  // Modellwert auf bekannte Tiers verengen (kein gieriges `.+`).
  const MODEL_LINE = /^(model:[ \t]*)(claude-[a-z0-9-]+|sonnet|haiku|opus)[ \t]*$/m;
  const m = fm[1].match(MODEL_LINE);
  if (!m) { warn('security-reviewer.md: kein model-Feld im Frontmatter'); return; }
  if (/opus/i.test(m[2])) { results.skipped.push('security-reviewer model (bereits opus)'); return; }
  if (dryRun) { results.wouldCreate.push('security-reviewer model → opus'); return; }
  const patchedFm = fm[1].replace(MODEL_LINE, '$1opus');
  fs.writeFileSync(f, text.replace(fm[0], `---\n${patchedFm}\n---`), 'utf8');
  results.created.push('security-reviewer model → opus');
}

function main() {
  const args = parseArgs(process.argv);
  const projectRoot = path.resolve(args.project);
  const eccRepo = args.eccRepo ? path.resolve(args.eccRepo) : defaultEccRepo();

  if (!fs.existsSync(projectRoot)) { warn(`Projekt-Root fehlt: ${projectRoot}`); process.exit(0); }
  const projectName = path.basename(projectRoot);
  const results = { created: [], skipped: [], wouldCreate: [] };

  ensureFile(path.join(projectRoot, '.claude', 'memory.md'), memoryStub(projectName), args.dryRun, results, '.claude/memory.md');
  ensureFile(path.join(projectRoot, 'SECURITY.md'), securityStub(projectName), args.dryRun, results, 'SECURITY.md');
  ensureMcpJson(projectRoot, eccRepo, args.dryRun, results);
  ensureGitignoreSecrets(projectRoot, args.dryRun, results);
  patchSecurityReviewerModel(projectRoot, args.dryRun, results);

  if (results.created.length) log(`angelegt: ${results.created.join(', ')}`);
  if (results.wouldCreate.length) log(`WÜRDE anlegen: ${results.wouldCreate.join(', ')}`);
  if (results.skipped.length) log(`übersprungen (bereits vorhanden): ${results.skipped.join(', ')}`);
  if (!results.created.length && !results.wouldCreate.length) log('nichts zu tun — Projekt bereits vollständig.');
  process.exit(0);
}

main();

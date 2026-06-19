#!/usr/bin/env node
'use strict';

/**
 * Selbsttest fuer den State-Sync-Roundtrip (Akzeptanzkriterium Schritt 1:
 * "Sync-Roundtrip verlustfrei verifiziert") inkl. Edge-Cases aus dem Code-Review.
 *
 * Erstellt isolierte Temp-Projekte unter os.tmpdir(), faehrt PRE/POST durch und
 * prueft mit harten Assertions:
 *   - PRE generiert WORKING-CONTEXT.md mit allen STATE:*- und SYNC:*-Zonen.
 *   - Mensch-Inhalt (Sentinels) ueberlebt jeden Roundtrip.
 *   - POST schreibt nur das Agenten-Delta zurueck (progress + tasks).
 *   - Idempotenz: ein zweiter POST ohne neuen Input dupliziert nichts.
 *   - PRE bewahrt noch nicht gesyncten inbox-Inhalt.
 *   - Guards: ECC-Engine-Root und fehlendes state/ werden uebersprungen.
 *   - Edge: stray Marker im Quell-Inhalt wird neutralisiert (kein Clobbering).
 *   - Edge: CRLF-Zeilenenden werden normalisiert.
 *   - Edge: Duplikat-Zeile in einem Lauf wird bewusst dedupliziert.
 *
 * Aufruf:  node selftest.js     (Exit 0 = alle Tests gruen, sonst Exit 1)
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

const pre = require('./to-working-context');
const post = require('./from-working-context');
const L = require('./lib');

function count(haystack, needle) {
  return haystack.split(needle).length - 1;
}

function mkProject(name) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `state-sync-${name}-`));
  fs.mkdirSync(path.join(root, 'state'), { recursive: true });
  return root;
}

function writeState(root, files) {
  for (const [name, body] of Object.entries(files)) {
    fs.writeFileSync(path.join(root, 'state', `${name}.md`), body, 'utf8');
  }
}

function rmrf(root) {
  fs.rmSync(root, { recursive: true, force: true });
}

let passed = 0;
function ok(label) {
  passed += 1;
  console.log(`  PASS  ${label}`);
}

function testRoundtrip() {
  const root = mkProject('roundtrip');
  try {
    writeState(root, {
      context: '# context\n\n## Purpose\nHUMAN-CTX-SENTINEL Zweck des Projekts.\n\n## Current Truth\nStand jetzt.\n',
      decisions: '# decisions\n\n- [2026-06-02] HUMAN-DEC-SENTINEL: SQLite statt Postgres.\n',
      tasks: '# tasks\n\n## Now\n- [ ] HUMAN-TASK-SENTINEL erste Aufgabe\n\n## Next\n- [ ] zweite\n',
      progress: '# progress\n\n- HUMAN-PROG-SENTINEL: Setup erledigt.\n',
    });

    // --- PRE ---
    const r1 = pre.run(['--project', root]);
    assert.strictEqual(r1.skipped, false, 'PRE darf nicht skippen');
    const wcPath = path.join(root, 'WORKING-CONTEXT.md');
    let wc = fs.readFileSync(wcPath, 'utf8');

    for (const n of ['context', 'decisions', 'tasks', 'progress']) {
      assert.ok(wc.includes(L.stateMarker(n, 'START')), `STATE:${n}:START fehlt`);
      assert.ok(wc.includes(L.stateMarker(n, 'END')), `STATE:${n}:END fehlt`);
    }
    assert.ok(wc.includes(L.syncMarker('progress-inbox', 'START')), 'progress-inbox fehlt');
    assert.ok(wc.includes(L.syncMarker('tasks-inbox', 'START')), 'tasks-inbox fehlt');
    for (const s of ['HUMAN-CTX-SENTINEL', 'HUMAN-DEC-SENTINEL', 'HUMAN-TASK-SENTINEL', 'HUMAN-PROG-SENTINEL']) {
      assert.ok(wc.includes(s), `Sentinel ${s} fehlt im generierten WORKING-CONTEXT`);
    }
    assert.ok(fs.existsSync(path.join(root, 'state', '.sync', 'last-working-context.md')), 'Snapshot fehlt');
    ok('PRE generiert alle Zonen + bewahrt Mensch-Inhalt');

    // --- POST ohne Agenten-Input -> No-op ---
    const progBefore = fs.readFileSync(path.join(root, 'state', 'progress.md'), 'utf8');
    const tasksBefore = fs.readFileSync(path.join(root, 'state', 'tasks.md'), 'utf8');
    const rNoop = post.run(['--project', root]);
    assert.strictEqual(rNoop.progress, 0, 'POST ohne Input darf progress nicht aendern');
    assert.strictEqual(rNoop.tasks, 0, 'POST ohne Input darf tasks nicht aendern');
    assert.strictEqual(fs.readFileSync(path.join(root, 'state', 'progress.md'), 'utf8'), progBefore, 'progress.md unveraendert');
    assert.strictEqual(fs.readFileSync(path.join(root, 'state', 'tasks.md'), 'utf8'), tasksBefore, 'tasks.md unveraendert');
    ok('POST ohne Agenten-Input ist No-op');

    // --- Agent simuliert: schreibt in die inbox-Zonen ---
    wc = L.upsertZone(
      wc,
      L.syncMarker('progress-inbox', 'START'),
      L.syncMarker('progress-inbox', 'END'),
      '- Feature A implementiert\n- Bug B gefixt'
    );
    wc = L.upsertZone(
      wc,
      L.syncMarker('tasks-inbox', 'START'),
      L.syncMarker('tasks-inbox', 'END'),
      '- [ ] Edge-Case C testen'
    );
    fs.writeFileSync(wcPath, wc, 'utf8');

    const r2 = post.run(['--project', root]);
    assert.strictEqual(r2.progress, 2, 'POST muss 2 progress-Zeilen syncen');
    assert.strictEqual(r2.tasks, 1, 'POST muss 1 task-Zeile syncen');

    const prog = fs.readFileSync(path.join(root, 'state', 'progress.md'), 'utf8');
    const tasks = fs.readFileSync(path.join(root, 'state', 'tasks.md'), 'utf8');
    assert.ok(prog.includes('Feature A implementiert'), 'Feature A nicht in progress.md');
    assert.ok(prog.includes('Bug B gefixt'), 'Bug B nicht in progress.md');
    assert.ok(tasks.includes('Edge-Case C testen'), 'Edge-Case C nicht in tasks.md');
    // Mensch-Inhalt erhalten
    assert.ok(prog.includes('HUMAN-PROG-SENTINEL'), 'progress-Sentinel verloren');
    assert.ok(tasks.includes('HUMAN-TASK-SENTINEL'), 'tasks-Sentinel verloren');
    ok('POST synct Agenten-Delta verlustfrei zurueck');

    // --- Idempotenz: zweiter POST ohne neuen Input dupliziert nichts ---
    post.run(['--project', root]);
    const prog2 = fs.readFileSync(path.join(root, 'state', 'progress.md'), 'utf8');
    assert.strictEqual(count(prog2, 'Feature A implementiert'), 1, 'Feature A dupliziert');
    assert.strictEqual(count(prog2, 'Bug B gefixt'), 1, 'Bug B dupliziert');
    ok('Zweiter POST ist idempotent (kein Duplikat)');

    // --- PRE erneut: bewahrt noch sichtbaren inbox-Inhalt, spiegelt neue state-Inhalte ---
    pre.run(['--project', root]);
    const wc2 = fs.readFileSync(wcPath, 'utf8');
    assert.ok(wc2.includes('Feature A implementiert'), 'PRE darf inbox-Inhalt nicht verwerfen');
    assert.ok(wc2.includes('Edge-Case C testen'), 'PRE darf tasks-inbox nicht verwerfen');
    // synchronisierte Erfolge stehen jetzt auch im STATE:progress-Block (aus state/progress.md)
    const progZone = L.extractZone(wc2, L.stateMarker('progress', 'START'), L.stateMarker('progress', 'END'));
    assert.ok(progZone && progZone.includes('Feature A implementiert'), 'STATE:progress spiegelt state/ nicht');
    ok('PRE bewahrt inbox + spiegelt aktualisiertes state/');
  } finally {
    rmrf(root);
  }
}

function testGuards() {
  // Guard 1: ECC-Engine-Root (basename 'ecc') wird uebersprungen.
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'state-sync-guard-'));
  try {
    const eccRoot = path.join(base, 'ecc');
    fs.mkdirSync(path.join(eccRoot, 'state'), { recursive: true });
    fs.writeFileSync(path.join(eccRoot, 'state', 'context.md'), '# context\n', 'utf8');
    const r = pre.run(['--project', eccRoot]);
    assert.strictEqual(r.skipped, true, 'ECC-Root muss uebersprungen werden');
    assert.ok(!fs.existsSync(path.join(eccRoot, 'WORKING-CONTEXT.md')), 'ECC-Root darf keine WORKING-CONTEXT.md bekommen');
    ok('Guard: ECC-Engine-Root uebersprungen');

    // Guard 2: Projekt ohne state/ wird uebersprungen.
    const plain = path.join(base, 'plain-project');
    fs.mkdirSync(plain, { recursive: true });
    const r2 = pre.run(['--project', plain]);
    assert.strictEqual(r2.skipped, true, 'Projekt ohne state/ muss uebersprungen werden');
    assert.ok(!fs.existsSync(path.join(plain, 'WORKING-CONTEXT.md')), 'Projekt ohne state/ darf nichts bekommen');
    ok('Guard: Projekt ohne state/ uebersprungen');

    // Guard 3: fremdes state/ (z.B. Terraform) ohne Sentinel und ohne die 4 STATE_FILES
    // wird uebersprungen -> kein false-positive, seit der Hook GLOBAL feuert.
    const tf = path.join(base, 'tf-project');
    fs.mkdirSync(path.join(tf, 'state'), { recursive: true });
    fs.writeFileSync(path.join(tf, 'state', 'terraform.tfstate'), '{}', 'utf8');
    const r3 = pre.run(['--project', tf]);
    assert.strictEqual(r3.skipped, true, 'fremdes state/ (Terraform) muss uebersprungen werden');
    assert.ok(!fs.existsSync(path.join(tf, 'WORKING-CONTEXT.md')), 'fremdes state/ darf keine WORKING-CONTEXT.md bekommen');
    ok('Guard: fremdes state/ (kein Sentinel, nicht 4 Dateien) uebersprungen');

    // Guard 4: Sentinel allein markiert ein leeres state/ ausdruecklich als ECC-verwaltet.
    const sent = path.join(base, 'sentinel-project');
    fs.mkdirSync(path.join(sent, 'state'), { recursive: true });
    fs.writeFileSync(path.join(sent, 'state', '.ecc-managed'), 'x\n', 'utf8');
    const r4 = pre.run(['--project', sent]);
    assert.strictEqual(r4.skipped, false, 'Sentinel muss state-sync aktivieren');
    assert.ok(fs.existsSync(path.join(sent, 'WORKING-CONTEXT.md')), 'Sentinel-Projekt muss WORKING-CONTEXT.md bekommen');
    ok('Guard: Sentinel state/.ecc-managed aktiviert state-sync');
  } finally {
    rmrf(base);
  }
}

function testEdgeCases() {
  const root = mkProject('edge');
  try {
    // Stray Marker im Nutzer-Inhalt + CRLF-Zeilenenden in einer State-Datei.
    writeState(root, {
      context:
        '# context\r\n\r\n## Purpose\r\nCRLF-SENTINEL Zeile mit Windows-Enden.\r\n\r\n' +
        'Doku-Beispiel (stray Marker):\r\n<!-- SYNC:progress-inbox:START -->\r\n',
      decisions: '# decisions\n',
      tasks: '# tasks\n\n## Now\n',
      progress: '# progress\n',
    });

    pre.run(['--project', root]);
    const wcPath = path.join(root, 'WORKING-CONTEXT.md');
    let wc = fs.readFileSync(wcPath, 'utf8');

    // CRLF normalisiert: kein \r im generierten File.
    assert.ok(!wc.includes('\r'), 'CRLF nicht normalisiert (\\r im Output)');
    assert.ok(wc.includes('CRLF-SENTINEL'), 'CRLF-Sentinel verloren');
    // Stray Marker wurde neutralisiert; es gibt genau EINEN echten progress-inbox-START.
    assert.ok(wc.includes('[SYNC:progress-inbox:START]'), 'stray Marker nicht neutralisiert');
    assert.strictEqual(count(wc, L.syncMarker('progress-inbox', 'START')), 1,
      'es darf genau EINEN echten progress-inbox-START-Marker geben');
    ok('Edge: CRLF normalisiert + stray Marker neutralisiert (kein Clobbering)');

    // Roundtrip funktioniert trotz stray Marker im Quell-Inhalt.
    wc = L.upsertZone(wc, L.syncMarker('progress-inbox', 'START'), L.syncMarker('progress-inbox', 'END'),
      '- Edge-Erfolg 1');
    fs.writeFileSync(wcPath, wc, 'utf8');
    const r = post.run(['--project', root]);
    assert.strictEqual(r.progress, 1, 'POST muss trotz stray Marker korrekt 1 Zeile syncen');
    assert.ok(fs.readFileSync(path.join(root, 'state', 'progress.md'), 'utf8').includes('Edge-Erfolg 1'),
      'Edge-Erfolg 1 nicht in progress.md');
    ok('Edge: Roundtrip korrekt trotz stray Marker im Quell-Inhalt');

    // Duplikat-Zeile in einem Lauf -> bewusst genau einmal gesynct.
    wc = L.upsertZone(wc, L.syncMarker('tasks-inbox', 'START'), L.syncMarker('tasks-inbox', 'END'),
      '- [ ] doppelt\n- [ ] doppelt');
    fs.writeFileSync(wcPath, wc, 'utf8');
    const r2 = post.run(['--project', root]);
    assert.strictEqual(r2.tasks, 1, 'Duplikat-Zeile muss genau einmal gesynct werden (bewusst)');
    ok('Edge: Duplikat-Zeile wird bewusst dedupliziert (1x)');
  } finally {
    rmrf(root);
  }
}

function main() {
  console.log('State-Sync Selbsttest');
  testRoundtrip();
  testGuards();
  testEdgeCases();
  console.log(`\nALLE TESTS GRUEN (${passed} Checks).`);
}

try {
  main();
  process.exit(0);
} catch (err) {
  console.error(`\nTEST FEHLGESCHLAGEN: ${err && err.message ? err.message : err}`);
  if (err && err.stack) console.error(err.stack);
  process.exit(1);
}

'use strict';

/**
 * Selbsttest fuer context-harvest (reine Logik + Marker-Merge).
 * Deckt die riskanten Teile ab: Idempotenz, Duplikat-Freiheit, Bewahrung von
 * Mensch-Inhalt — analog zum State-Sync-Selbsttest.
 *
 *   node selftest.js
 */

const assert = require('assert');
const H = require('./harvest-lib');

let pass = 0;
let fail = 0;
function check(name, fn) {
  try { fn(); console.log(`  PASS  ${name}`); pass++; }
  catch (e) { console.log(`  FAIL  ${name}: ${e.message}`); fail++; }
}

console.log('context-harvest Selbsttest');

check('firstParagraph überspringt H1 + Badges + Bilder', () => {
  const md = '# Title\n\n[![badge](x)](y)\n![img](z)\n\nEchter Absatz hier.\n\nZweiter.';
  assert.strictEqual(H.firstParagraph(md), 'Echter Absatz hier.');
});

check('buildCurrentTruth enthält Purpose + Commits', () => {
  const out = H.buildCurrentTruth({ manifestDesc: 'Mein Tool', readmePara: '', gitLog: 'abc fix x\ndef feat y' });
  assert.ok(out.includes('Mein Tool'), 'Purpose fehlt');
  assert.ok(out.includes('abc fix x'), 'Commit fehlt');
});

check('buildCurrentTruth ohne Signale liefert Platzhalter', () => {
  assert.ok(H.buildCurrentTruth({ manifestDesc: '', readmePara: '', gitLog: '' }).includes('bitte ergänzen'));
});

check('buildNow ohne TODOs liefert Platzhalter', () => {
  assert.ok(H.buildNow([]).includes('keine offenen'));
});

check('summarizeSensitive dedupliziert nach Area', () => {
  const out = H.summarizeSensitive([
    { area: 'auth', file: 'a.js' }, { area: 'auth', file: 'b.js' }, { area: 'payments', file: 'pay.js' },
  ]);
  assert.ok(out.includes('**auth**') && out.includes('**payments**'));
});

check('mergeZone fügt Block ZWISCHEN Heading und nächstem Abschnitt ein', () => {
  const src = '# tasks\n\n### Now\n\n### Next\n';
  const out = H.mergeZone(src, '### Now', 'now', '- item');
  assert.ok(out.includes('<!-- HARVEST:now:START -->'));
  assert.ok(out.indexOf('### Now') < out.indexOf('HARVEST:now:START'), 'Block vor Heading');
  assert.ok(out.indexOf('HARVEST:now:END') < out.indexOf('### Next'), 'Block läuft in Next');
});

check('mergeZone ist idempotent (gleicher Input → gleicher Output)', () => {
  const a = H.mergeZone('### Now\n', '### Now', 'now', '- item');
  const b = H.mergeZone(a, '### Now', 'now', '- item');
  assert.strictEqual(a, b);
});

check('mergeZone ersetzt Inhalt OHNE Duplikat', () => {
  const a = H.mergeZone('### Now\n', '### Now', 'now', '- alt');
  const b = H.mergeZone(a, '### Now', 'now', '- neu');
  assert.ok(b.includes('- neu') && !b.includes('- alt'));
  assert.strictEqual((b.match(/HARVEST:now:START/g) || []).length, 1, 'Duplikat-Marker');
});

check('mergeZone bewahrt Mensch-Inhalt außerhalb der Zone', () => {
  const src = '### Now\n\nMein wichtiger Text.\n\n### Next\nGeplant.\n';
  const out = H.mergeZone(src, '### Now', 'now', '- auto');
  assert.ok(out.includes('Mein wichtiger Text.') && out.includes('Geplant.'));
});

check('mergeZone hängt sauber an, wenn Heading fehlt', () => {
  const out = H.mergeZone('# x\nnur text', '### Now', 'now', '- a');
  assert.ok(out.includes('HARVEST:now:START'));
});

console.log(`\n${fail === 0 ? 'ALLE TESTS GRUEN' : 'FEHLER'} (${pass} pass, ${fail} fail).`);
process.exit(fail === 0 ? 0 : 1);

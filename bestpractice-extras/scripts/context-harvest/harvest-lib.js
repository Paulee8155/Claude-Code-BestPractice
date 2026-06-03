'use strict';

/**
 * context-harvest — reine Logik (testbar, kein IO).
 *
 * Leitet aus Projekt-Signalen (README, git log, TODO/FIXME, sensitive Imports)
 * vorbefuellte Markdown-Bloecke ab und merged sie MARKER-BASIERT in state/*.md,
 * ohne Mensch-Inhalt zu ueberschreiben. Wiederverwendet die Marker-Primitiven
 * des State-Sync-Adapters (DRY) — eigener HARVEST-Namespace, getrennt von STATE/SYNC.
 *
 * CommonJS, Node >= 18, keine externen Abhaengigkeiten.
 */

const lib = require('../state-sync/lib');

function truncate(s, n) {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  return t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t;
}

/** Erster bedeutungstragender README-Absatz (H1, Badges, Bilder, Trenner uebersprungen). */
function firstParagraph(readme) {
  if (!readme) return '';
  const lines = String(readme).replace(/\r\n/g, '\n').split('\n');
  const para = [];
  for (const raw of lines) {
    const l = raw.trim();
    if (!l) { if (para.length) break; else continue; }
    if (l.startsWith('#')) continue;
    if (/^!\[/.test(l) || /^\[!\[/.test(l)) continue;
    if (/^[-=*_]{3,}$/.test(l)) continue;
    para.push(l);
  }
  return truncate(para.join(' '), 280);
}

/** Erste n Commits aus `git log --oneline`-Text. */
function recentCommits(gitLog, n) {
  if (!gitLog) return [];
  return String(gitLog).replace(/\r\n/g, '\n').split('\n')
    .map((l) => l.trim()).filter(Boolean).slice(0, n);
}

/** Markdown-Block fuer state/context.md -> ### Current Truth. */
function buildCurrentTruth({ manifestDesc, readmePara, gitLog }) {
  const out = [];
  const purpose = truncate(manifestDesc || readmePara || '', 280);
  if (purpose) out.push(`- ${purpose}`);
  const commits = recentCommits(gitLog, 8);
  if (commits.length) {
    out.push('- Jüngste Commits (Ist-Stand):');
    for (const c of commits) out.push(`  - ${c}`);
  }
  if (!out.length) out.push('- _(keine automatisch ableitbaren Fakten — bitte ergänzen)_');
  return out.join('\n');
}

/** Markdown-Zeilen fuer state/tasks.md -> ### Now (aus TODO/FIXME). */
function buildNow(todoHits) {
  const out = [];
  for (const h of (todoHits || []).slice(0, 7)) {
    out.push(`- ${h.kind || 'TODO'}: ${truncate(h.text, 120)}  (\`${h.file}:${h.line}\`)`);
  }
  if (!out.length) out.push('- _(keine offenen TODO/FIXME gefunden)_');
  return out.join('\n');
}

/** Sensitive Areas aus Telltale-Treffern, dedupliziert nach Area. */
function summarizeSensitive(hits) {
  const byArea = new Map();
  for (const h of hits || []) {
    if (!byArea.has(h.area)) byArea.set(h.area, new Set());
    byArea.get(h.area).add(h.file);
  }
  const out = [];
  for (const [area, files] of byArea) {
    const list = [...files];
    const shown = list.slice(0, 3).join(', ');
    out.push(`- **${area}** — ${shown}${list.length > 3 ? ` (+${list.length - 3})` : ''}`);
  }
  return out.length ? out.join('\n') : '- _(keine sensiblen Bereiche erkannt)_';
}

/** HARVEST-Marker (eigener Namespace, ganze Zeile -> kein Clobbering). */
function harvestMarker(zone, edge) {
  return `<!-- HARVEST:${zone}:${edge} -->`;
}

/**
 * Fuegt einen HARVEST-Block ein/aktualisiert ihn:
 *  - Zone existiert -> upsert in-place (idempotent, kein Duplikat),
 *  - sonst direkt NACH der Heading-Zeile einfuegen,
 *  - Heading fehlt -> sauber am Ende anhaengen.
 * Mensch-Inhalt ausserhalb des Blocks bleibt unberuehrt.
 */
function mergeZone(content, headingText, zone, inner) {
  const start = harvestMarker(zone, 'START');
  const end = harvestMarker(zone, 'END');
  if (lib.findMarkerLine(content, start) !== -1) {
    return lib.upsertZone(content, start, end, inner);
  }
  const block = `${start}\n${inner}\n${end}`;
  const re = new RegExp('^' + lib.escapeRegExp(headingText) + '[ \\t]*$', 'm');
  const m = re.exec(content);
  if (!m) {
    const sep = content.endsWith('\n') || content === '' ? '' : '\n';
    return `${content}${sep}${block}\n`;
  }
  const nl = content.indexOf('\n', m.index);
  if (nl === -1) {
    const sep = content.endsWith('\n') ? '' : '\n';
    return `${content}${sep}${block}\n`;
  }
  const at = nl + 1;
  return content.slice(0, at) + block + '\n' + content.slice(at);
}

module.exports = {
  truncate, firstParagraph, recentCommits, buildCurrentTruth,
  buildNow, summarizeSensitive, harvestMarker, mergeZone,
};

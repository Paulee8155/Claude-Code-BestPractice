'use strict';

/**
 * State-Sync-Adapter — gemeinsame Bibliothek.
 *
 * Teil des Hybrid-Harness (BestPractice-Wrapper um den ECC-Core).
 * `state/` (4 modulare, vom Menschen gepflegte Dateien) ist die Quelle der Wahrheit.
 * `<projekt-root>/WORKING-CONTEXT.md` wird daraus generiert (Loop-Futter) und nach
 * jedem Lauf zurueckgeparst (Erfolge -> progress.md, neue ToDos -> tasks.md).
 *
 * Garantien dieser Bibliothek:
 *  - Marker-basierte Sektionen, NUR als ganze Zeile erkannt -> kein Clobbering,
 *    selbst wenn Nutzer-Inhalt einen Marker-String eingebettet enthaelt.
 *  - Atomares Schreiben (tmp + rename) -> kein halb geschriebener Zustand.
 *  - CRLF wird beim Lesen normalisiert -> keine \r-Akkumulation ueber Zyklen.
 *  - Reines Lesen ausserhalb der Marker; Mensch-Inhalt bleibt unberuehrt.
 *
 * CommonJS (wie die ECC-Hooks), Node >= 18, keine externen Abhaengigkeiten.
 */

const fs = require('fs');
const path = require('path');

/** Die vier modularen State-Dateien (Reihenfolge = Render-Reihenfolge). */
const STATE_FILES = ['context', 'decisions', 'tasks', 'progress'];

/** Dateiname des generierten Loop-Futters im Projekt-Root. */
const WORKING_CONTEXT = 'WORKING-CONTEXT.md';

/** Verzeichnis fuer Sync-Snapshots (gitignored). */
const SYNC_DIR = path.join('state', '.sync');
const SNAPSHOT_FILE = path.join(SYNC_DIR, 'last-working-context.md');

/** Marker fuer von `state/` gespiegelte Sektionen (PRE ueberschreibt diese). */
function stateMarker(name, edge) {
  return `<!-- STATE:${name}:${edge} -->`;
}

/** Marker fuer Agenten-Eingabezonen (POST liest diese zurueck). */
function syncMarker(name, edge) {
  return `<!-- SYNC:${name}:${edge} -->`;
}

/** Liest eine Datei; fehlt sie, kommt '' zurueck. CRLF wird zu LF normalisiert. */
function readFileSafe(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');
  } catch (err) {
    if (err && err.code === 'ENOENT') return '';
    throw err;
  }
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

/**
 * Schreibt atomar: erst in eine temporaere Datei im selben Verzeichnis,
 * dann rename (atomar auf demselben Dateisystem). Verhindert halb
 * geschriebene WORKING-CONTEXT.md, falls der Prozess mitten im Lauf stirbt.
 */
function writeFileAtomic(filePath, content) {
  ensureDir(path.dirname(filePath));
  const tmp = path.join(
    path.dirname(filePath),
    `.${path.basename(filePath)}.${process.pid}.tmp`
  );
  fs.writeFileSync(tmp, content, 'utf8');
  fs.renameSync(tmp, filePath);
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Findet einen Marker NUR, wenn er eine ganze Zeile bildet (umgebende
 * Whitespaces erlaubt). Eingebettete Marker-Strings im Fliesstext werden
 * ignoriert -> kein versehentliches Clobbering. Gibt den Zeilen-Startindex
 * zurueck oder -1.
 */
function findMarkerLine(content, marker, fromIndex = 0) {
  const re = new RegExp('^[ \\t]*' + escapeRegExp(marker) + '[ \\t]*$', 'm');
  const sub = content.slice(fromIndex);
  const m = re.exec(sub);
  return m ? fromIndex + m.index : -1;
}

/**
 * Extrahiert den Inhalt zwischen Start- und End-Marker (beide als ganze
 * Zeilen). Gibt den inneren String (ohne fuehrende/abschliessende Marker-Zeile)
 * zurueck, oder null, wenn die Zone fehlt/kaputt ist.
 */
function extractZone(content, startMark, endMark) {
  const s = findMarkerLine(content, startMark);
  if (s === -1) return null;
  const nlAfterStart = content.indexOf('\n', s);
  const innerStart = nlAfterStart === -1 ? content.length : nlAfterStart + 1;
  const e = findMarkerLine(content, endMark, innerStart);
  if (e === -1) return null;
  return content.slice(innerStart, e).replace(/\n$/, '');
}

/**
 * Ersetzt den Inhalt einer markierten Zone (Marker als ganze Zeilen).
 * Existiert die Zone nicht oder ist sie kaputt (Start ohne Ende), wird der
 * komplette Block sauber neu angehaengt — ein verwaister Start-Marker wird
 * dabei verworfen, damit keine doppelten Marker entstehen.
 * Mensch-Inhalt ausserhalb der Marker bleibt unangetastet.
 *
 * Hinweis: Im Produktionspfad NICHT verwendet (PRE baut die Datei komplett
 * neu, POST liest nur). Wird vom Selbsttest genutzt, um Agenten-Edits zu
 * simulieren — daher hier vollstaendig und robust gehalten.
 */
function upsertZone(content, startMark, endMark, innerContent) {
  const block = `${startMark}\n${innerContent}\n${endMark}`;
  const s = findMarkerLine(content, startMark);
  if (s === -1) {
    const sep = content.endsWith('\n') || content === '' ? '' : '\n';
    return `${content}${sep}${block}\n`;
  }
  const nlAfterStart = content.indexOf('\n', s);
  const innerStart = nlAfterStart === -1 ? content.length : nlAfterStart + 1;
  const e = findMarkerLine(content, endMark, innerStart);
  if (e === -1) {
    // Kaputte Zone: verwaisten Start verwerfen, Block sauber anhaengen.
    const before = content.slice(0, s).replace(/\s*$/, '');
    const sep = before ? '\n' : '';
    return `${before}${sep}${block}\n`;
  }
  const nlAfterEnd = content.indexOf('\n', e);
  const endLineEnd = nlAfterEnd === -1 ? content.length : nlAfterEnd;
  const before = content.slice(0, s);
  const after = content.slice(endLineEnd);
  return `${before}${block}${after}`;
}

/**
 * Neutralisiert Marker-aehnliche Strings in Quell-Inhalt, damit Nutzer-Text aus
 * state/*.md keine echten Marker in die generierte WORKING-CONTEXT.md injizieren
 * kann (sonst koennte ein eingebetteter Marker die Zonengrenzen verschieben).
 * `<!-- STATE:x:START -->` -> `[STATE:x:START]` (lesbar, nicht mehr matchbar).
 */
function neutralizeMarkers(text) {
  return text.replace(/<!--\s*((?:STATE|SYNC):[^>]*?)\s*-->/g, '[$1]');
}

/** Entfernt eine fuehrende H1-Ueberschrift (`# ...`) inkl. Leerzeilen. */
function stripLeadingH1(md) {
  return md.replace(/^\s*#\s+.*(?:\r?\n)+/, '');
}

/**
 * Bedeutungstragende Zeilen: getrimmt, nicht leer, keine HTML-Kommentar-Zeilen
 * (Default-Platzhalter beginnen mit `<!--` und werden so nie zurueckgesynct).
 * Basis fuer das Delta zwischen Agenten-Eingabe und letztem Snapshot.
 */
function meaningfulLines(text) {
  if (!text) return [];
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('<!--'));
}

/**
 * Neue Zeilen in `current`, die im `snapshot` nicht vorkommen
 * (Reihenfolge erhalten). Dedup ist BEWUSST wert-basiert gegen den Snapshot:
 * eine identische Zeile, die schon im Snapshot steht, wird nicht erneut
 * zurueckgeschrieben (das garantiert Idempotenz). Folge: schreibt der Agent in
 * EINEM Lauf zweimal exakt dieselbe Zeile, landet sie einmal in state/ — das
 * ist gewollt (Duplikat-Unterdbrueckung), nicht versehentlich.
 */
function diffNewLines(currentInner, snapshotInner) {
  const seen = new Set(meaningfulLines(snapshotInner));
  const out = [];
  for (const line of meaningfulLines(currentInner)) {
    if (!seen.has(line)) {
      out.push(line);
      seen.add(line);
    }
  }
  return out;
}

/** Sortierbarer Zeitstempel (UTC, Minutengenauigkeit) fuer Append-Bloecke. */
function isoStamp(date) {
  const d = date || new Date();
  return d.toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
}

/**
 * Loest den Ziel-Projekt-Root auf. Prioritaet:
 *   1. --project <pfad> (CLI)
 *   2. CLAUDE_PROJECT_DIR (von Claude-Code-Hooks gesetzt)
 *   3. process.cwd()
 */
function resolveProjectRoot(argv) {
  const args = argv || [];
  const idx = args.indexOf('--project');
  if (idx !== -1 && args[idx + 1]) return path.resolve(args[idx + 1]);
  if (process.env.CLAUDE_PROJECT_DIR && process.env.CLAUDE_PROJECT_DIR.trim()) {
    return path.resolve(process.env.CLAUDE_PROJECT_DIR.trim());
  }
  return process.cwd();
}

/** No-op-Guard: gibt es ein `state/`-Verzeichnis im Root? */
function hasStateDir(root) {
  try {
    return fs.statSync(path.join(root, 'state')).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Sicherheits-Guard (best-effort Heuristik, nicht narrensicher): niemals den
 * vendored ECC-Engine-Teilbaum mit Basename `ecc` als Ziel nehmen.
 * `ecc/WORKING-CONTEXT.md` waere ECCs Selbstbeschreibung — nie ueberschreiben.
 * Zusaetzlicher Schutz: der No-op-Guard greift ohnehin, da der ECC-Teilbaum
 * kein `state/`-Verzeichnis hat.
 */
function isForbiddenRoot(root) {
  return path.basename(path.resolve(root)) === 'ecc';
}

module.exports = {
  STATE_FILES,
  WORKING_CONTEXT,
  SYNC_DIR,
  SNAPSHOT_FILE,
  stateMarker,
  syncMarker,
  readFileSafe,
  ensureDir,
  writeFileAtomic,
  escapeRegExp,
  findMarkerLine,
  extractZone,
  upsertZone,
  neutralizeMarkers,
  stripLeadingH1,
  meaningfulLines,
  diffNewLines,
  isoStamp,
  resolveProjectRoot,
  hasStateDir,
  isForbiddenRoot,
};

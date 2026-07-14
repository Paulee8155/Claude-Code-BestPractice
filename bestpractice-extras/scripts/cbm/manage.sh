#!/usr/bin/env bash
# manage.sh — VPS-weite, reproduzierbare Verwaltung der codebase-memory-mcp-Binary.
#
# Die Binary wird EINMAL global installiert; der MCP-Server wird NIE global
# registriert. Aktiviert wird pro Projekt über /cbm enable (project.js).
#
# Bewusst NICHT benutzt:
#   - der Upstream-Auto-Installer (`codebase-memory-mcp install`) — er konfiguriert
#     ungefragt alle Agents inkl. PreToolUse-Hook auf Grep/Glob.
#   - `curl … | bash` — nie fremde Skripte per Pipe ausführen.
#   - unversionierte latest/download-URLs — nur der Pin aus release.json.
#   - die UI-Variante (`-ui-…`) — kein Port 9749, kein Webserver.
#
# Usage: manage.sh <action> [--yes]
#   status | dry-run | install | verify | check-update | rollback | uninstall | purge-cache
set -euo pipefail
umask 077

CBM_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RELEASE_JSON="$CBM_DIR/release.json"
WRAPPER_TPL="$CBM_DIR/wrapper.sh"
VERIFY_JS="$CBM_DIR/verify.js"

LIB_DIR="${CBM_LIB_DIR:-$HOME/.local/lib/codebase-memory-mcp}"
BIN_DIR="${CBM_BIN_DIR:-$HOME/.local/bin}"
WRAPPER="$BIN_DIR/codebase-memory-mcp-harness"
CURRENT="$LIB_DIR/current"
PREVIOUS="$LIB_DIR/previous"
CACHE_DIR="${CBM_CACHE_DIR:-$HOME/.cache/codebase-memory-mcp}"
GLOBAL_SETTINGS="$HOME/.claude/settings.json"

die()  { echo "[cbm] FEHLER: $*" >&2; exit 1; }
info() { echo "[cbm] $*"; }

# --- release.json lesen (Single Source of Truth) --------------------------------
[ -f "$RELEASE_JSON" ] || die "release.json fehlt: $RELEASE_JSON"
jget() { node -e "process.stdout.write(String(require('$RELEASE_JSON')$1 ?? ''))"; }

REPO="$(jget '.repo')"
VERSION="$(jget '.version')"          # z.B. v0.9.0
VARIANT="$(jget '.variant')"
PLATFORM="$(jget '.platform')"
VERSION_BARE="${VERSION#v}"           # z.B. 0.9.0
TARGET_DIR="$LIB_DIR/$VERSION_BARE"
TARGET_BIN="$TARGET_DIR/codebase-memory-mcp"

[ "$VARIANT" = "standard" ] || die "release.json variant='$VARIANT' — nur 'standard' (ohne UI) ist erlaubt."

# --- Plattform validieren (fail-closed) -----------------------------------------
detect_arch() {
  local os arch
  os="$(uname -s)"
  [ "$os" = "Linux" ] || die "Nicht unterstütztes Betriebssystem: $os (unterstützt: Linux). Kein Download."
  [ "$PLATFORM" = "linux" ] || die "release.json platform='$PLATFORM' passt nicht zu $os."
  case "$(uname -m)" in
    x86_64|amd64)  arch="amd64" ;;
    aarch64|arm64) arch="arm64" ;;
    *) die "Nicht unterstützte Architektur: $(uname -m) (unterstützt: x86_64, aarch64). Kein Download." ;;
  esac
  echo "$arch"
}

installed_version() {
  [ -x "$CURRENT/codebase-memory-mcp" ] || { echo ""; return; }
  "$CURRENT/codebase-memory-mcp" --version 2>/dev/null | head -1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1 || echo ""
}

settings_hash() { [ -f "$GLOBAL_SETTINGS" ] && sha256sum "$GLOBAL_SETTINGS" | cut -d' ' -f1 || echo "absent"; }

# --- Aktionen -------------------------------------------------------------------

plan() {
  local arch file sha
  arch="$(detect_arch)"
  file="$(jget ".assets.$arch.filename")"
  sha="$(jget ".assets.$arch.sha256")"
  [ -n "$file" ] && [ -n "$sha" ] || die "release.json hat kein Asset für arch=$arch."
  echo "  Repo:        $REPO"
  echo "  Version:     $VERSION  (Variante: $VARIANT — ohne UI)"
  echo "  Arch:        $arch"
  echo "  Asset:       $file"
  echo "  SHA-256:     $sha"
  echo "  Download:    https://github.com/$REPO/releases/download/$VERSION/$file"
  echo "  Binary  →    $TARGET_BIN"
  echo "  Symlink →    $CURRENT -> $VERSION_BARE"
  echo "  Wrapper →    $WRAPPER"
  echo "  Cache   →    $CACHE_DIR (0700)"
  echo "  Danach:      config set auto_index=false, auto_watch=false"
  echo "  NICHT:       kein 'codebase-memory-mcp install', kein UI, kein Hook, keine settings.json-Änderung"
}

action_dry_run() {
  info "DRY-RUN — es wird nichts heruntergeladen, geschrieben oder gestartet."
  plan
  local cur; cur="$(installed_version)"
  if [ -n "$cur" ]; then
    echo "  Ist-Zustand: $cur installiert$([ "$cur" = "$VERSION_BARE" ] && echo ' (= Pin, install wäre ein No-op)' || echo " (Pin: $VERSION_BARE → Update)")"
  else
    echo "  Ist-Zustand: keine Installation gefunden"
  fi
}

action_status() {
  local cur
  cur="$(installed_version)"
  echo "Pin (release.json):  $VERSION ($VARIANT)"
  echo "Installiert:         ${cur:-—}"
  echo "current →            $([ -L "$CURRENT" ] && readlink "$CURRENT" || echo '—')"
  echo "previous →           $([ -L "$PREVIOUS" ] && readlink "$PREVIOUS" || echo '—')"
  echo "Wrapper:             $([ -x "$WRAPPER" ] && echo "$WRAPPER" || echo '— (fehlt)')"
  echo "auf PATH:            $(command -v codebase-memory-mcp-harness || echo '— (nicht im PATH)')"
  echo "Cache:               $CACHE_DIR ($([ -d "$CACHE_DIR" ] && stat -c '%a' "$CACHE_DIR" || echo 'fehlt'))"
  echo "CBM_ALLOWED_ROOT:    ${CBM_ALLOWED_ROOT:-/root/projekte (Wrapper-Default)}"
  if [ -x "$WRAPPER" ]; then
    echo "CBM-Config:"
    "$WRAPPER" config list 2>/dev/null | sed 's/^/  /' || echo "  (config list nicht lesbar)"
  fi
}

action_install() {
  local arch file sha url tmp dl bin_extracted hash_before hash_after prev_target
  arch="$(detect_arch)"
  file="$(jget ".assets.$arch.filename")"
  sha="$(jget ".assets.$arch.sha256")"
  [ -n "$file" ] || die "release.json: kein Asset-Dateiname für arch=$arch."
  [ -n "$sha" ]  || die "release.json: keine SHA-256 für arch=$arch — Installation abgebrochen (fail-closed)."
  case "$sha" in
    *[!0-9a-fA-F]*|"") die "release.json: SHA-256 für $arch ist kein Hex-String — abgebrochen." ;;
  esac
  [ "${#sha}" -eq 64 ] || die "release.json: SHA-256 für $arch hat ${#sha} statt 64 Zeichen — abgebrochen."

  hash_before="$(settings_hash)"

  # Idempotenz: gepinnte Version bereits aktiv + lauffähig → nichts tun.
  if [ "$(installed_version)" = "$VERSION_BARE" ]; then
    info "Version $VERSION_BARE ist bereits installiert und aktiv — kein Re-Download."
    install_wrapper
    apply_safe_config
    info "OK (No-op-Install)."
    return 0
  fi

  url="https://github.com/$REPO/releases/download/$VERSION/$file"
  tmp="$(mktemp -d "${TMPDIR:-/tmp}/cbm-install-XXXXXX")"
  trap 'rm -rf "$tmp"' EXIT
  dl="$tmp/$file"

  info "Lade $VERSION ($arch) …"
  curl -fsSL --proto '=https' --tlsv1.2 -o "$dl" "$url" || die "Download fehlgeschlagen: $url"

  info "Prüfe SHA-256 (fail-closed) …"
  echo "$sha  $dl" | sha256sum -c - >/dev/null 2>&1 \
    || die "SHA-256 stimmt NICHT: erwartet $sha, ist $(sha256sum "$dl" | cut -d' ' -f1). Installation abgebrochen, nichts verändert."
  info "SHA-256 OK."

  # Sigstore-Attestation nur, wenn die gh-CLI sie überhaupt kennt (hier: gh 2.45 → nein).
  if gh attestation verify --help >/dev/null 2>&1; then
    info "Prüfe gh attestation …"
    gh attestation verify "$dl" --repo "$REPO" >/dev/null 2>&1 \
      && info "Attestation OK." \
      || die "gh attestation verify fehlgeschlagen — Installation abgebrochen."
  else
    info "Attestation: übersprungen (diese gh-Version kennt 'gh attestation' nicht). SHA-256 bleibt maßgeblich."
  fi

  tar -xzf "$dl" -C "$tmp" || die "Entpacken fehlgeschlagen."
  bin_extracted="$(find "$tmp" -type f -name 'codebase-memory-mcp' -perm -u+x 2>/dev/null | head -1)"
  [ -n "$bin_extracted" ] || bin_extracted="$(find "$tmp" -type f -name 'codebase-memory-mcp' | head -1)"
  [ -n "$bin_extracted" ] || die "Im Archiv wurde keine Datei 'codebase-memory-mcp' gefunden."
  chmod 700 "$bin_extracted"

  info "Smoke-Test der neuen Binary (--version) …"
  "$bin_extracted" --version >/dev/null 2>&1 || die "Neue Binary startet nicht (--version schlug fehl) — aktive Installation unverändert."
  info "Binary startet: $("$bin_extracted" --version 2>&1 | head -1)"

  # Atomar: erst die Zieldatei komplett hinlegen, dann den Symlink umschalten.
  mkdir -p "$TARGET_DIR"
  install -m 700 "$bin_extracted" "$TARGET_DIR/.codebase-memory-mcp.new"
  mv -f "$TARGET_DIR/.codebase-memory-mcp.new" "$TARGET_BIN"

  prev_target="$([ -L "$CURRENT" ] && readlink "$CURRENT" || echo '')"
  if [ -n "$prev_target" ] && [ "$prev_target" != "$VERSION_BARE" ]; then
    ln -sfn "$prev_target" "$LIB_DIR/.previous.new" && mv -Tf "$LIB_DIR/.previous.new" "$PREVIOUS"
    info "Rollback-Ziel gemerkt: previous → $prev_target"
  fi
  ln -sfn "$VERSION_BARE" "$LIB_DIR/.current.new" && mv -Tf "$LIB_DIR/.current.new" "$CURRENT"
  info "Aktiv: current → $VERSION_BARE"

  install_wrapper
  apply_safe_config

  hash_after="$(settings_hash)"
  [ "$hash_before" = "$hash_after" ] \
    || die "~/.claude/settings.json hat sich während der Installation verändert ($hash_before → $hash_after). Das darf nicht passieren — bitte prüfen."
  info "~/.claude/settings.json unverändert ($hash_after)."

  rm -rf "$tmp"; trap - EXIT
  info "Installation abgeschlossen. Jetzt: manage.sh verify"
}

install_wrapper() {
  [ -f "$WRAPPER_TPL" ] || die "Wrapper-Vorlage fehlt: $WRAPPER_TPL"
  mkdir -p "$BIN_DIR"
  if [ -f "$WRAPPER" ]; then
    cp -p "$WRAPPER" "$WRAPPER.bak-$(date +%Y%m%d-%H%M%S)"
  fi
  sed "s|@@MANAGE@@|$CBM_DIR/manage.sh|g" "$WRAPPER_TPL" > "$BIN_DIR/.harness.new"
  chmod 700 "$BIN_DIR/.harness.new"
  mv -f "$BIN_DIR/.harness.new" "$WRAPPER"
  info "Wrapper installiert: $WRAPPER"
  mkdir -p "$CACHE_DIR"; chmod 700 "$CACHE_DIR"
}

# Auto-Indexing und Hintergrund-Watcher gehören NICHT zum Default-Verhalten dieses
# Harness: Indexiert wird nur explizit (/cbm enable, /cbm reindex).
apply_safe_config() {
  [ -x "$WRAPPER" ] || return 0
  "$WRAPPER" config set auto_index false >/dev/null 2>&1 || info "WARN: 'config set auto_index false' schlug fehl — mit 'manage.sh verify' prüfen."
  "$WRAPPER" config set auto_watch false >/dev/null 2>&1 || info "WARN: 'config set auto_watch false' schlug fehl — mit 'manage.sh verify' prüfen."
  info "Sichere Config gesetzt: auto_index=false, auto_watch=false."
}

action_check_update() {
  local latest
  info "Frage Upstream-Release ab (read-only, es wird nichts verändert) …"
  latest="$(curl -fsSL "https://api.github.com/repos/$REPO/releases/latest" | node -e "
let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{try{const j=JSON.parse(s);process.stdout.write(j.prerelease?'':String(j.tag_name||''))}catch{process.stdout.write('')}})" )"
  [ -n "$latest" ] || die "Konnte die aktuelle Release nicht ermitteln (oder sie ist ein Pre-Release)."
  echo "  Gepinnt (release.json): $VERSION"
  echo "  Upstream (latest):      $latest"
  if [ "$latest" = "$VERSION" ]; then
    echo "  → aktuell. Nichts zu tun."
  else
    echo "  → UPDATE VERFÜGBAR: $VERSION → $latest"
    echo "    Vorgehen: checksums.txt des neuen Releases holen, release.json von Hand pinnen,"
    echo "    dann 'manage.sh install'. Es gibt bewusst KEIN automatisches Update."
  fi
}

action_rollback() {
  [ -L "$PREVIOUS" ] || die "Kein Rollback-Ziel vorhanden (previous fehlt)."
  local prev; prev="$(readlink "$PREVIOUS")"
  local prev_bin="$LIB_DIR/$prev/codebase-memory-mcp"
  [ -x "$prev_bin" ] || die "Rollback-Ziel $prev ist nicht (mehr) ausführbar: $prev_bin"
  "$prev_bin" --version >/dev/null 2>&1 || die "Rollback-Ziel $prev startet nicht — current bleibt unverändert."
  local cur; cur="$([ -L "$CURRENT" ] && readlink "$CURRENT" || echo '')"
  ln -sfn "$prev" "$LIB_DIR/.current.new" && mv -Tf "$LIB_DIR/.current.new" "$CURRENT"
  if [ -n "$cur" ]; then
    ln -sfn "$cur" "$LIB_DIR/.previous.new" && mv -Tf "$LIB_DIR/.previous.new" "$PREVIOUS"
  fi
  info "Rollback: current → $prev (vorher $cur). Projektkonfigurationen unverändert."
}

action_uninstall() {
  info "Entferne Wrapper und Installation. NICHT entfernt: Graph-Cache ($CACHE_DIR),"
  info "Projekt-.mcp.json-Einträge (dafür je Projekt: /cbm disable), ECC, RTK, state/."
  rm -f "$WRAPPER"
  rm -rf "$LIB_DIR"
  info "Deinstalliert. Cache blieb erhalten — löschen nur mit: manage.sh purge-cache"
}

action_purge_cache() {
  # Destruktiv und ausdrücklich: löscht ALLE Graph-Indizes und die CBM-Config.
  # Wird von keiner anderen Aktion automatisch aufgerufen.
  [ -d "$CACHE_DIR" ] || { info "Cache existiert nicht: $CACHE_DIR"; return 0; }
  echo "[cbm] ACHTUNG: löscht ALLE CBM-Graph-Indizes und die CBM-Config unter:"
  echo "[cbm]   $CACHE_DIR"
  if [ "${CBM_CONFIRM:-}" = "PURGE-CACHE" ]; then
    :
  elif [ -t 0 ]; then
    read -r -p "[cbm] Zum Bestätigen exakt 'PURGE-CACHE' eingeben: " answer
    [ "$answer" = "PURGE-CACHE" ] || die "Nicht bestätigt — nichts gelöscht."
  else
    die "Nicht bestätigt. Nicht-interaktiv: CBM_CONFIRM=PURGE-CACHE manage.sh purge-cache"
  fi
  rm -rf "$CACHE_DIR"
  info "Cache gelöscht: $CACHE_DIR"
}

ACTION="${1:-status}"
case "$ACTION" in
  status)       action_status ;;
  dry-run)      action_dry_run ;;
  install)      action_install ;;
  verify)       [ -f "$VERIFY_JS" ] || die "verify.js fehlt"; node "$VERIFY_JS" ;;
  check-update) action_check_update ;;
  rollback)     action_rollback ;;
  uninstall)    action_uninstall ;;
  purge-cache)  action_purge_cache ;;
  *) die "Unbekannte Aktion: $ACTION (status|dry-run|install|verify|check-update|rollback|uninstall|purge-cache)" ;;
esac

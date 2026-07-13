#!/usr/bin/env bash
# preflight.sh — Kapazitaets-Check vor einem Codex-Job auf dem 2-Kern-VPS.
# Exit 0 = GO (Rescue erlaubt) | 1 = READ-ONLY (nur Review) | 2 = STOP.
# Reine Diagnose: startet nichts, aendert nichts, gibt keine Secrets aus.
set -u

ram_avail=$(awk '/MemAvailable/ {printf "%.1f", $2/1024/1024}' /proc/meminfo)
swap_used=$(free -g | awk '/Swap:/ {print $3}')
disk_free=$(df -BG --output=avail / | tail -1 | tr -dc '0-9')
# Nur echte CLI-Laeufe zaehlen. Auszuschliessen sind:
#   - die VS-Code-ChatGPT-Extension (Binary heisst ebenfalls "codex", laeuft dauerhaft),
#   - dieses Script selbst (pgrep -f matcht sonst die eigene Kommandozeile).
# pgrep -c druckt bei 0 Treffern bereits "0" und liefert Exit 1 — daher wc -l statt -c.
codex_jobs=$(pgrep -af 'codex (exec|apply)' 2>/dev/null \
  | grep -v -e vscode-server -e preflight | wc -l)
docker_builds=$(pgrep -af 'docker.*build|buildx|buildkitd' 2>/dev/null \
  | grep -v -e vscode-server -e preflight | wc -l)

printf 'Codex-Preflight (srv1051228)\n'
printf '  RAM verfuegbar : %s GB\n' "$ram_avail"
printf '  Swap belegt    : %s GB\n' "$swap_used"
printf '  Disk frei (/)  : %s GB\n' "$disk_free"
printf '  Codex-Jobs     : %s\n' "$codex_jobs"
printf '  Docker-Builds  : %s\n' "$docker_builds"
printf '\n'

verdict=0
stop()      { printf 'STOP      %s\n' "$1"; verdict=2; }
readonly_() { [ "$verdict" -lt 1 ] && verdict=1; printf 'READ-ONLY %s\n' "$1"; }

awk -v v="$ram_avail" 'BEGIN{exit !(v < 1.5)}'  && stop "RAM < 1.5 GB verfuegbar"
[ "${swap_used:-0}" -gt 3 ]                     && stop "Swap > 3 GB belegt — System swappt"
[ "${disk_free:-0}" -lt 8 ]                     && stop "Disk < 8 GB frei"
[ "${codex_jobs:-0}" -ge 1 ]                    && stop "bereits ein Codex-Job aktiv (max. 1)"
[ "${docker_builds:-0}" -ge 1 ]                 && stop "docker build laeuft — nicht konkurrieren"
[ "${disk_free:-0}" -lt 15 ] && [ "$verdict" -lt 2 ] && readonly_ "Disk < 15 GB — kein Worktree/Build"

case "$verdict" in
  0) printf 'GO        schreibender Codex-Job (/codex:rescue) erlaubt.\n' ;;
  1) printf '\nFAZIT: nur read-only — /codex:review ja, /codex:rescue nein.\n' ;;
  2) printf '\nFAZIT: keinen Codex-Job starten. Erst Kapazitaet schaffen.\n' ;;
esac
exit "$verdict"

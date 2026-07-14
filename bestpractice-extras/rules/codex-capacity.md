# VPS-Kapazitätsregel für Codex-Jobs (Schicht 2)

Der VPS `srv1051228` hat **2 CPU-Kerne, 7,8 GB RAM und 96 GB Disk** — und trägt daneben
~13 Docker-Container (Traefik, n8n, Werkstatt ×3, Jarvis ×2, UVV, Rezept, GROW, Email-Agent,
Homm ×2). Ein zweiter Agent ist hier kein Gratis-Parallelismus, sondern echte Konkurrenz um
Kerne, RAM und Swap.

**Vor jedem schreibenden Codex-Job (`/codex:rescue`) verpflichtend:**

```bash
bash bestpractice-extras/scripts/codex/preflight.sh
```

Das Script prüft RAM, Swap, Disk sowie laufende Claude-/Codex-/Docker-Build-Prozesse und
liefert `GO`, `READ-ONLY` oder `STOP`.

## Grenzwerte

| Signal | Schwelle | Konsequenz |
|---|---|---|
| Verfügbarer RAM | < 1,5 GB | **STOP** — kein Codex-Job |
| Swap belegt | > 3,0 GB | **STOP** — System swappt bereits stark |
| Freier Speicher `/` | < 8 GB | **STOP** — kein Worktree, kein Build |
| Freier Speicher `/` | < 15 GB | **READ-ONLY** — Review ja, Rescue nein |
| Bereits laufender Codex-Job | ≥ 1 | **STOP** — max. 1 schreibender Job gleichzeitig |
| Laufender `docker build` | ≥ 1 | **STOP** — nicht mit Build konkurrieren |

## Regeln

- **Maximal ein schreibender Codex-Job gleichzeitig** auf dem gesamten VPS.
- Keine parallelen Build-intensiven Agenten, keine parallelen Docker-Builds ohne Auftrag.
- Keine großen Worktrees oder Projektkopien ohne vorherige Speicherprüfung.
- Bei RAM-, Swap- oder Speicherdruck: Codex nur **read-only** (`/codex:review`).
- Reviews laufen bevorzugt read-only im Hintergrund (`--background`).
- Temporäre Worktrees und Build-Artefakte nach verifizierter Nutzung kontrolliert entfernen —
  **nie ungefragt**.

Diese Prüfung ist eine **Schutzregel, kein Dienst**: kein neuer Port, kein Daemon, kein
Traefik-Router, kein systemd-Service für Codex.

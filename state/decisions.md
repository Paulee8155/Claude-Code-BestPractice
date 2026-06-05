# decisions

<!-- Architektur-/Design-Entscheidungen (ADR-leicht). Format: - [JJJJ-MM-TT] Entscheidung — Begruendung -->

- [2026-06-05] State-Sync **Variante A (projekt-lokal)** statt global — ECC-konform (Schicht 2 = pro Projekt additiv), keine globale settings.json-Verschmutzung, kein No-op-Laerm in Nicht-ECC-Projekten.
- [2026-06-05] Globale ECC-Memory-Hooks (SessionStart/Stop/PreCompact) bleiben unangetastet — sie schreiben session-data/, NICHT WORKING-CONTEXT.md (separates System).
- [2026-06-05] Office-Snapshots (docx/pptx) werden aus der Markdown-Single-Source nachgezogen, nicht parallel gepflegt.

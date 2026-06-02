---
description: Mega-Plan — dispatcht RPI-Berater (CTO/PM/UX/Intake) parallel als Subagents, synthetisiert ein Briefing und übergibt an ECCs /plan. Additiver Wrapper, ECC-Core unberührt.
---

# /mega-plan

Vorstufe zu `/plan` für größere oder unklare Vorhaben: holt **mehrere Experten-
Perspektiven parallel** ein (RPI-Berater), verdichtet sie zu einem Briefing und übergibt
dieses an ECCs `/plan`. Rein additiver Wrapper — ECCs Dev-Agenten und der Loop bleiben
unberührt.

## Wann

- Vages oder vielschichtiges Ziel ("Baue X", "Wir brauchen Y").
- Vor Architektur-/Feature-Entscheidungen mit echten Trade-offs.
- NICHT für triviale, klar umrissene Änderungen — da direkt `/plan` oder `/feature-dev`.

## Verwendung

```text
/mega-plan <Ziel in einem Satz>
/mega-plan --advisors cto,pm,ux   # Berater explizit wählen
```

## Berater-Namespace

Read-only Berater-Personas in `bestpractice-extras/agents/`:

| Advisor | Datei | Perspektive |
|---|---|---|
| Intake | `rpi-requirement-parser.md` | Anforderungen, Constraints, offene Fragen |
| CTO | `rpi-cto-advisor.md` | Technik-Strategie, Architektur-Fit, Risiko |
| Product | `rpi-product-manager.md` | Scope, Requirements, Akzeptanzkriterien |
| UX | `rpi-ux-designer.md` | Flows, States, Accessibility |

## Ablauf

### 1. Berater wählen
Aus dem Ziel die relevanten Advisor bestimmen (oder `--advisors` respektieren).
Default: **Intake + CTO immer**; **PM** bei Produkt/Feature-Bezug; **UX** bei UI-Arbeit.

### 2. Parallel dispatchen (eine Antwort, mehrere Agent-Calls)
Für jeden gewählten Advisor **einen `general-purpose`-Subagent** starten. Prompt-Aufbau:
- den **vollständigen Persona-Text** der jeweiligen Datei aus `bestpractice-extras/agents/`
  (per `Read` laden und einfügen),
- gefolgt vom Ziel + relevantem Repo-Kontext (kurz).
Die Berater sind read-only und liefern je einen Markdown-Brief zurück (kein Code).

> Wichtig: parallel = **alle** Agent-Calls in EINER Antwort, damit sie gleichzeitig laufen.

### 3. Briefing synthetisieren
Die Advisor-Briefs zu **einem** Briefing verdichten:
- **Ziel** (geschärft)
- **Empfohlene Richtung** (CTO) + Alternativen
- **Scope in/out + Akzeptanzkriterien** (PM)
- **UX-Kernpunkte** (falls UX dabei)
- **Top-Risiken & Mitigationen**
- **Zuerst de-risken**
- **Offene Entscheidungen für den Menschen** (gebündelt, dedupliziert)

Widersprüche zwischen Beratern **explizit benennen**, nicht glattbügeln.

### 4. An /plan übergeben
Das Briefing als Eingabe für ECCs `/plan` verwenden (führendes Harness). `/plan` wartet
wie gewohnt auf das OK des Users, bevor implementiert wird. Danach normaler ECC-Flow:
`/feature-dev` (TDD) → `/code-review` → Verify.

## Garantien

- Berater sind **read-only** (kein Datei-Schreiben in der Planungs-Vorstufe).
- ECC-Dev-Agenten und der Loop bleiben unangetastet; `/mega-plan` ist nur Vorstufe.
- Kein globaler Agent-Install nötig — Personas werden zur Laufzeit injiziert.

## Verwandt

- `/plan` — ECCs Planungs-Command (führend; wartet auf OK)
- `/feature-dev` — geführte Feature-Entwicklung (TDD)
- `bestpractice-extras/agents/` — Berater-Namespace (rpi-*)
- `bestpractice-extras/_archive/rpi-agents/` — vollständiger RPI-Agentensatz (promotebar)

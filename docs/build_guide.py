#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_guide.py — Erzeugt das fusionierte Harness-Begleitdokument als Word (.docx)
und PowerPoint (.pptx) aus einer gemeinsamen, deutschen Inhaltsquelle.

Quelle: ECC-Guides (the-shortform/longform/security, ECC-WORKFLOW-GUIDE.de.md) +
BestPractice RPI-Workflow. Spiegelt die VPS-weite, globale Installation wider.

Aufruf:  python3 docs/build_guide.py
Ausgabe: docs/ECC-Harness-Guide.de.docx  und  docs/ECC-Harness-Guide.de.pptx
"""

import os

from docx import Document
from docx.shared import Pt, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

from pptx import Presentation
from pptx.util import Inches as PInches, Pt as PPt, Emu
from pptx.dml.color import RGBColor as PRGB
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR

HERE = os.path.dirname(os.path.abspath(__file__))
DOCX_OUT = os.path.join(HERE, "ECC-Harness-Guide.de.docx")
PPTX_OUT = os.path.join(HERE, "ECC-Harness-Guide.de.pptx")

# ---------------------------------------------------------------- Farbpalette
INDIGO   = RGBColor(0x31, 0x2E, 0x81)   # primär (Überschriften)
INDIGO_D = RGBColor(0x1E, 0x1B, 0x4B)   # tief (Deckblatt)
CYAN     = RGBColor(0x06, 0xB6, 0xD4)   # Akzent
AMBER    = RGBColor(0xB4, 0x53, 0x09)   # Hinweis/Highlight (dunkler f. Kontrast)
EMERALD  = RGBColor(0x04, 0x78, 0x57)   # OK/Erfolg
INK      = RGBColor(0x1F, 0x29, 0x37)   # Text
MUTED    = RGBColor(0x6B, 0x72, 0x80)   # gedämpft
SURFACE  = "EEF2FF"                      # heller Indigo-Hintergrund (hex str)
CODEBG   = "1E1B2E"                       # Code-Box dunkel
TBLHEAD  = "312E81"                       # Tabellenkopf
TBLZEBRA = "F3F4F6"

# PPTX-Pendants
P_INDIGO   = PRGB(0x31, 0x2E, 0x81)
P_INDIGO_D = PRGB(0x1E, 0x1B, 0x4B)
P_CYAN     = PRGB(0x06, 0xB6, 0xD4)
P_AMBER    = PRGB(0xF5, 0x9E, 0x0B)
P_WHITE    = PRGB(0xFF, 0xFF, 0xFF)
P_INK      = PRGB(0x1F, 0x29, 0x37)
P_MUTED    = PRGB(0xC7, 0xD2, 0xFE)
P_SURFACE  = PRGB(0xEE, 0xF2, 0xFF)

X_SHORT = "https://x.com/affaanmustafa/status/2012378465664745795"
X_LONG  = "https://x.com/affaanmustafa/status/2014040193557471352"
X_SEC   = "https://x.com/affaanmustafa/status/2033263813387223421"
X_AUTH  = "https://x.com/affaanmustafa"


# ============================================================ Word-Hilfsfunktionen
def _shade(elm, fill_hex):
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), fill_hex)
    elm.append(shd)


def shade_paragraph(p, fill_hex):
    _shade(p._p.get_or_add_pPr(), fill_hex)


def shade_cell(cell, fill_hex):
    _shade(cell._tc.get_or_add_tcPr(), fill_hex)


def set_cell_text(cell, text, bold=False, color=INK, size=9.5, fill=None, white=False):
    cell.text = ""
    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.space_before = Pt(2)
    run = p.add_run(text)
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.name = "Calibri"
    run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF) if white else color
    if fill:
        shade_cell(cell, fill)


def add_heading(doc, text, level=1):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(16 if level == 1 else 10)
    p.paragraph_format.space_after = Pt(4)
    run = p.add_run(text)
    run.font.bold = True
    run.font.name = "Calibri"
    if level == 1:
        run.font.size = Pt(17)
        run.font.color.rgb = INDIGO
        # Akzent-Unterstrich
        pr = p._p.get_or_add_pPr()
        pbdr = OxmlElement("w:pBdr")
        bottom = OxmlElement("w:bottom")
        bottom.set(qn("w:val"), "single")
        bottom.set(qn("w:sz"), "18")
        bottom.set(qn("w:space"), "2")
        bottom.set(qn("w:color"), "06B6D4")
        pbdr.append(bottom)
        pr.append(pbdr)
    else:
        run.font.size = Pt(13)
        run.font.color.rgb = INDIGO_D
    return p


def add_para(doc, text, size=10.5, color=INK, bold=False, italic=False, space=4):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(space)
    run = p.add_run(text)
    run.font.size = Pt(size)
    run.font.name = "Calibri"
    run.font.color.rgb = color
    run.font.bold = bold
    run.font.italic = italic
    return p


def add_bullets(doc, items):
    for it in items:
        p = doc.add_paragraph(style="List Bullet")
        p.paragraph_format.space_after = Pt(2)
        # erlaubt (label, text)-Tupel mit fettem Label
        if isinstance(it, tuple):
            r = p.add_run(it[0] + " ")
            r.font.bold = True
            r.font.size = Pt(10.5)
            r.font.color.rgb = INDIGO_D
            r2 = p.add_run(it[1])
            r2.font.size = Pt(10.5)
            r2.font.color.rgb = INK
        else:
            r = p.add_run(it)
            r.font.size = Pt(10.5)
            r.font.color.rgb = INK


def add_callout(doc, label, text, color=AMBER, fill="FEF3C7"):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.left_indent = Pt(6)
    shade_paragraph(p, fill)
    r = p.add_run(label + "  ")
    r.font.bold = True
    r.font.size = Pt(10)
    r.font.color.rgb = color
    r2 = p.add_run(text)
    r2.font.size = Pt(10)
    r2.font.color.rgb = INK


def add_code(doc, code):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(8)
    p.paragraph_format.left_indent = Pt(4)
    shade_paragraph(p, CODEBG)
    for i, line in enumerate(code.rstrip("\n").split("\n")):
        if i > 0:
            p.add_run().add_break()
        run = p.add_run(line if line else " ")
        run.font.name = "Consolas"
        run.font.size = Pt(9)
        run.font.color.rgb = RGBColor(0x9C, 0xE3, 0xF0)


def add_table(doc, headers, rows, widths=None):
    t = doc.add_table(rows=1, cols=len(headers))
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    t.style = "Table Grid"
    for i, h in enumerate(headers):
        set_cell_text(t.rows[0].cells[i], h, bold=True, white=True, size=9.5, fill=TBLHEAD)
    for ri, row in enumerate(rows):
        cells = t.add_row().cells
        zebra = TBLZEBRA if ri % 2 == 0 else None
        for ci, val in enumerate(row):
            set_cell_text(cells[ci], val, size=9.5, fill=zebra)
    if widths:
        for row in t.rows:
            for ci, w in enumerate(widths):
                row.cells[ci].width = Inches(w)
    # auch Headerbreiten setzen
    return t


# ============================================================ Inhalt (gemeinsam)
MODEL_ROWS = [
    ["Exploration / Suche", "Haiku", "schnell, billig, reicht zum Finden"],
    ["Einfache Einzeldatei-Edits", "Haiku", "klar umrissen"],
    ["Multi-File-Implementierung", "Sonnet", "bester Coding-Kompromiss"],
    ["Komplexe Architektur", "Opus", "tiefes Reasoning"],
    ["PR-Review", "Sonnet", "versteht Kontext, fängt Nuancen"],
    ["Security-Analyse", "Opus", "darf nichts übersehen"],
    ["Doku schreiben", "Haiku", "einfache Struktur"],
    ["Komplexe Bugs", "Opus", "ganzes System im Kopf halten"],
]

BUILDING_BLOCKS = [
    ["Skills", "Durable Kern: wiederverwendbare Workflow-Bündel, laden on-demand", "~/.claude/skills/ecc/", "langlebig"],
    ["Commands", "Slash-Einstiegspunkte (/plan, /code-review …)", "~/.claude/commands/", "Komfort-Schicht"],
    ["Subagents", "Delegierbare Spezialisten mit eigenem Tool-Scope", "~/.claude/agents/", "pro Aufgabe"],
    ["Hooks", "Trigger-Automatik an Lifecycle-Events (INAKTIV per Default)", "~/.claude/hooks/", "event-gebunden"],
    ["Rules", "„Immer befolgen\"-Leitlinien je Sprache", "~/.claude/rules/ecc/", "dauerhaft"],
    ["MCP", "Prompt-getriebene Wrapper um externe Dienste", ".mcp.json / global", "pro Session"],
    ["Instincts", "Gelernte Muster aus deinen Sessions", "homunculus/instincts/", "wächst mit dir"],
]

CMD_CHEAT = [
    ["Neues Feature planen", "/plan  oder  /rpi:research → /rpi:plan", "Anforderungen, Risiken, Schritte — wartet auf dein OK"],
    ["Feature umsetzen", "/feature-dev  ·  /rpi:implement", "nutzt Skills/Agents, TDD zuerst"],
    ["Bestehendes Projekt adoptieren", "/adopt-project", "liest Codebase, füllt state/ & Regeln (BP-Extra)"],
    ["Code geschrieben", "/code-review  (+ /python-review, /go-review …)", "Qualität + Security der Änderungen"],
    ["Build/Tests rot", "/build-fix", "inkrementelle, minimale Fixes"],
    ["Coverage / Qualität", "/test-coverage  ·  /quality-gate", "Lücken finden, Pipeline prüfen"],
    ["Aufräumen", "/refactor-clean", "toter Code + lose Dateien raus"],
    ["Library-Doku live", "context7-MCP  ·  Skill documentation-lookup", "aktuelle API-Doku statt Halluzination"],
    ["Session sichern/laden", "/save-session  ·  /resume-session  ·  /sessions", "über den Tag hinaus arbeiten"],
    ["Checkpoint / Nebenfrage", "/checkpoint  ·  /aside", "Stand markieren / Kontext bewahren"],
    ["Gelerntes extrahieren", "/learn-eval → /evolve → /promote", "Self-Improvement-Loop"],
    ["Modell / Kosten", "/model-route  ·  /cost-report", "billigstes ausreichendes Modell"],
    ["Harness prüfen", "/harness-audit  ·  /ecc-guide", "Config-Scorecard / Onboarding"],
    ["Parallel / Loop", "/multi-plan  ·  /loop-start  ·  /loop-status", "mehrere Modelle / Automation"],
]

MCP_ROWS = [
    ["Aktuelle Library-/API-Doku", "context7", "React, Prisma, Next.js … statt veraltetem Wissen"],
    ["Web-Recherche / Discovery", "exa", "breite Suche, wenn GitHub+Docs nicht reichen"],
    ["GitHub (PRs, Issues, Code-Suche)", "github", "Code-Search FIRST vor Neuschreiben"],
    ["Browser / E2E / Screenshots", "playwright", "headless Automation, visuelle Tests"],
    ["PDF / Word / Excel lesen", "markitdown", "Dokumente → Markdown (global aktiv)"],
    ["Strukturierter Wissensgraph", "memory", "Laufzeit-Memory (mit claude-mem abstimmen)"],
    ["Schrittweises Reasoning", "sequential-thinking", "komplexe Mehrschritt-Probleme"],
    ["Bash-Token sparen (lokal)", "RTK-Hook", "60–90 % Ersparnis, läuft transparent global"],
    ["Recherche/Analyse (Sandbox)", "context-mode (ctx_*)", "dein bestehendes Tool, bleibt primär"],
]

SECURITY_ACTIVE = [
    ("RTK-Hook", "PreToolUse:Bash bleibt unangetastet — Token-Ersparnis global."),
    ("ECC namespace-sicher", "rules/ecc/, skills/ecc/ — keine Kollision mit Eigenem."),
    ("settings.json unberührt", "kein Auto-Edit der Startup-Config; nur additiv via ./install-vps.sh --harden."),
]
SECURITY_OPTIN = [
    ("ECC-Hooks INAKTIV", "Repo-kontrollierte Hooks nicht blind aktiv. Bewusst aktivieren nach Sichtung von hooks.json."),
    ("deny-Baseline opt-in", "./install-vps.sh --harden ergänzt rm -rf / force-push / Secret-Reads (mit Backup)."),
    ("AgentShield", "npx ecc-agentshield scan lädt externes Paket — selbst vetten, dann ausführen."),
]


# ============================================================ WORD-DOKUMENT
def build_docx():
    doc = Document()
    # Basisfont
    style = doc.styles["Normal"]
    style.font.name = "Calibri"
    style.font.size = Pt(10.5)
    style.font.color.rgb = INK

    sec = doc.sections[0]
    sec.left_margin = Inches(0.8)
    sec.right_margin = Inches(0.8)
    sec.top_margin = Inches(0.7)
    sec.bottom_margin = Inches(0.7)

    # ---- Deckblatt
    band = doc.add_paragraph()
    band.paragraph_format.space_before = Pt(40)
    shade_paragraph(band, "1E1B4B")
    r = band.add_run("  ENGINEERING HARNESS")
    r.font.size = Pt(11)
    r.font.bold = True
    r.font.color.rgb = CYAN
    band.add_run("\n").add_break
    t = doc.add_paragraph()
    t.paragraph_format.space_before = Pt(10)
    rt = t.add_run("ECC × BestPractice")
    rt.font.size = Pt(34)
    rt.font.bold = True
    rt.font.color.rgb = INDIGO
    sub = doc.add_paragraph()
    rs = sub.add_run("Das fusionierte, VPS-weite Claude-Code-Harness — Bedienungsanleitung")
    rs.font.size = Pt(15)
    rs.font.color.rgb = INK
    meta = doc.add_paragraph()
    rm = meta.add_run("Global aktiv in ~/.claude · ECC 2.0.0-rc.1 (core) + RPI-Workflow · RTK-sicher\n"
                      "Quelle/Re-Install: /root/projekte/Claude Code BestPractice  →  ./install-vps.sh")
    rm.font.size = Pt(10)
    rm.font.color.rgb = MUTED
    add_callout(doc, "Halte mich offen.",
                "Dieses Dokument ist dein Nachschlagewerk neben dem Code: wann welcher Command, "
                "welches Modell, welcher MCP. Basiert auf den Guides von @affaanmustafa (X-Links am Ende).",
                color=INDIGO_D, fill=SURFACE)

    # ---- Inhalt
    add_heading(doc, "Inhalt", 1)
    add_bullets(doc, [
        "1 · Was ist dieses Harness?", "2 · Setup & VPS-Architektur (global, RTK, Koexistenz)",
        "3 · Mentales Modell — die Bausteine", "4 · Täglicher Workflow: die 5-Phasen-Pipeline",
        "5 · RPI-Workflow (research → plan → implement)", "6 · Cheat-Sheet: Wann welcher Command",
        "7 · Wann welcher MCP", "8 · Token-Ökonomie & Modellstrategie",
        "9 · Memory & Sessions", "10 · Continuous Learning (Self-Improvement)",
        "11 · Parallelisierung", "12 · Security im Alltag + VPS-Hinweise",
        "13 · ECC-CLIs & Wartung", "14 · Quellen & TL;DR",
    ])

    # 1
    add_heading(doc, "1 · Was ist dieses Harness?", 1)
    add_para(doc, "Dieses Harness ist die Fusion zweier Systeme — mit klarem Fokus auf ECC:")
    add_bullets(doc, [
        ("ECC (Everything Claude Code)", "von Affaan Mustafa — die dominante Engine: 63 Agents, ~79 Skills, "
         "79 Commands, 21 Sprach-Rule-Packs, manifest-basierter Installer, Continuous Learning, Security-Scanning."),
        ("BestPractice-Extras", "die wenigen einzigartigen Stärken deines alten Harness, die ECC ergänzen: der "
         "RPI-Workflow, /adopt-project, das state/-Pattern und die Karpathy-Prinzipien."),
    ])
    add_para(doc, "Philosophie in einem Satz:", bold=True, space=2)
    add_callout(doc, "„Konfiguration ist Fine-Tuning, nicht Architektur.“",
                "Baue wiederverwendbare Muster, halte das Kontextfenster sauber, delegiere an das billigste "
                "ausreichende Modell, verifiziere mit Evidenz — und lass Komfort nie die Sicherheit überholen.",
                color=INDIGO_D, fill=SURFACE)
    add_para(doc, "Fünf Kernprinzipien (SOUL.md): Agent-First · Test-Driven · Security-First · "
                  "Immutability · Plan-Before-Execute.", italic=True, color=MUTED)

    # 2
    add_heading(doc, "2 · Setup & VPS-Architektur", 1)
    add_para(doc, "ECC ist jetzt GLOBAL nach ~/.claude installiert und damit in JEDEM Projekt auf der VPS aktiv "
                  "(WMS, Jarvis, n8n, Werkstatt …). Die Installation ist bewusst additiv und namespace-sicher:")
    add_bullets(doc, [
        ("Namespace-sicher:", "ECC liegt unter rules/ecc/ und skills/ecc/ — keine Kollision mit Eigenem."),
        ("RTK bleibt König:", "Der globale PreToolUse:Bash-Hook (RTK, 60–90 % Token-Ersparnis) wurde NICHT angefasst."),
        ("Startup-Config unberührt:", "settings.json / settings.local.json / CLAUDE.md sind byte-identisch geblieben."),
        ("Reproduzierbar:", "Quelle ist das Repo; Re-Install via ./install-vps.sh (idempotent, mit Backup)."),
    ])
    add_para(doc, "Koexistenz mit deinem bestehenden Setup:", bold=True, space=2)
    add_table(doc, ["Dein Tool", "ECC-Pendant", "Empfehlung"], [
        ["superpowers", "tdd-workflow, verification-loop …", "Beides nutzbar; bei Doppelung ECC bevorzugen"],
        ["claude-mem", "/save-session, continuous-learning-v2", "EINE primäre Memory-Quelle je Projekt führen"],
        ["RTK", "Token-Ökonomie (§8)", "Ergänzen sich: RTK auf Bash-, ECC auf Workflow-Ebene"],
        ["context-mode", "—", "Bleibt dein Recherche-/Analyse-Tool"],
    ], widths=[1.4, 2.4, 3.0])
    add_callout(doc, "Namens-Überlappung:", "Manche Commands (z. B. /code-review, /feature-dev) kommen sowohl von "
                "einem Plugin als auch von ECC. Tippe / und prüfe die Quelle, oder nutze eindeutige ECC-Commands "
                "(/harness-audit, /ecc-guide, /instinct-status, /rpi:*).")

    # 3
    add_heading(doc, "3 · Das mentale Modell — die Bausteine", 1)
    add_table(doc, ["Baustein", "Was es ist", "Wo (global)", "Lebensdauer"], BUILDING_BLOCKS,
              widths=[0.95, 3.2, 1.7, 1.0])
    add_callout(doc, "Wichtigste Regel:", "Die durable Logik gehört in Skills. Commands sind nur der bequeme "
                "Einstieg. Was du zum dritten Mal tippst → mach eine Skill draus (/skill-create).",
                color=INDIGO_D, fill=SURFACE)

    # 4
    add_heading(doc, "4 · Der tägliche Workflow — die 5-Phasen-Pipeline", 1)
    add_para(doc, "Der Erfinder arbeitet in klaren Phasen, mit /clear dazwischen und Zwischenergebnissen in Dateien "
                  "(statt alles im Kontext zu halten):")
    add_code(doc,
             "Phase 1  RESEARCH   →  Explore-Agent / context-mode      →  research.md\n"
             "Phase 2  PLAN       →  /plan  (wartet auf dein OK!)        →  plan.md\n"
             "Phase 3  IMPLEMENT  →  /feature-dev + Skill tdd-workflow   →  Code + Tests\n"
             "Phase 4  REVIEW     →  /code-review (+ /<sprache>-review)  →  review.md\n"
             "Phase 5  VERIFY     →  Tests/Build (+ /build-fix)          →  grün, sonst zurück zu Phase 3")
    add_bullets(doc, [
        "Jeder Schritt: ein klarer Input, ein klarer Output (in Datei speichern).",
        "Outputs werden Inputs der nächsten Phase. Phasen nicht überspringen.",
        "/clear zwischen großen Phasen — Explorations-Kontext ist für die Umsetzung irrelevant.",
        "Subagents immer objektiven Kontext mitgeben, nicht nur die Frage.",
    ])

    # 5
    add_heading(doc, "5 · RPI-Workflow (BestPractice-Extra)", 1)
    add_para(doc, "Der RPI-Workflow ist die strengere, gate-getriebene Variante der Pipeline — ideal für größere "
                  "Features. Er kollidiert nicht mit ECC und ist global verfügbar:")
    add_table(doc, ["Command", "Phase", "Liefert"], [
        ["/rpi:research <feature>", "Research & Viability Gate", "GO/NO-GO-Entscheidung mit Begründung"],
        ["/rpi:plan <feature>", "Planung", "umfassende Planungs-Doku"],
        ["/rpi:implement <feature>", "Umsetzung", "phasierte Implementierung mit Validation-Gates"],
        ["/adopt-project", "Onboarding", "liest Codebase, füllt state/ (context/decisions/progress/tasks)"],
    ], widths=[2.1, 2.0, 2.7])
    add_callout(doc, "Wann RPI statt /plan?", "Nimm /rpi für größere, riskante Features mit nötigem Viability-Gate. "
                "Nimm /plan für den schnellen, normalen Plan-dann-Code-Flow.", color=INDIGO_D, fill=SURFACE)

    # 6
    add_heading(doc, "6 · Cheat-Sheet — wann welcher Command", 1)
    add_table(doc, ["Situation", "Command", "Zweck"], CMD_CHEAT, widths=[1.9, 2.5, 2.4])
    add_para(doc, "Sprach-spezifisch: /go-build|review|test, /rust-*, /cpp-*, /kotlin-*, /react-*, /flutter-*, "
                  "/python-review, /fastapi-review.  PRP-Pipeline: /prp-prd → /prp-plan → /prp-implement → "
                  "/prp-commit → /prp-pr.", color=MUTED, size=9.5)

    # 7
    add_heading(doc, "7 · Wann welcher MCP", 1)
    add_para(doc, "Faustregel: 20–30 MCPs konfiguriert, aber < 10 aktiv / < 80 Tools. Ungenutztes pro Projekt mit "
                  "/mcp deaktivieren — das Kontextfenster ist kostbar.")
    add_table(doc, ["Aufgabe", "MCP / Tool", "Hinweis"], MCP_ROWS, widths=[2.4, 1.7, 2.7])

    # 8
    add_heading(doc, "8 · Token-Ökonomie & Modellstrategie", 1)
    add_para(doc, "Billigstes ausreichendes Modell pro Aufgabe — das ist die Subagent-Architektur:")
    add_table(doc, ["Aufgabe", "Modell", "Warum"], MODEL_ROWS, widths=[2.4, 1.2, 3.2])
    add_callout(doc, "Default = Sonnet", "für ~90 % des Codings. Upgrade auf Opus bei: erster Versuch gescheitert · "
                "≥ 5 Dateien · Architektur-Entscheidung · Security-kritisch. Hilfe: /model-route, /cost-report.",
                color=INDIGO_D, fill=SURFACE)
    add_bullets(doc, [
        "Strategisches Compacting: Auto-Compact aus, manuell /compact mit Hint an logischen Punkten.",
        "Modulare Dateien (hunderte statt tausende Zeilen) → bessere First-Try-Trefferquote.",
        "/refactor-clean nach langen Sessions.",
    ])

    # 9
    add_heading(doc, "9 · Memory & Sessions", 1)
    add_table(doc, ["Command", "Zweck"], [
        ["/save-session", "Stand nach ~/.claude/session-data/ sichern"],
        ["/resume-session", "letzte Session laden & weitermachen"],
        ["/sessions", "Historie durchsuchen/verwalten"],
        ["/checkpoint", "Checkpoint im laufenden Lauf"],
        ["/aside", "Nebenfrage ohne Kontextverlust"],
    ], widths=[2.0, 4.6])
    add_para(doc, "Gute Session-Datei: Was funktioniert hat (mit Evidenz) · Was nicht ging · Was offen ist.", space=2)
    add_callout(doc, "Koexistenz claude-mem:", "Entscheide dich pro Projekt für EINE primäre Memory-Quelle, "
                "sonst doppelte Wahrheit. Keine Secrets in Memory.")

    # 10
    add_heading(doc, "10 · Continuous Learning (Self-Improvement)", 1)
    add_para(doc, "Das unterscheidet ECC von „nur Configs\": es lernt aus deinen Sessions.")
    add_table(doc, ["Command", "Zweck"], [
        ["/learn", "Muster aus der Session extrahieren"],
        ["/learn-eval", "extrahieren + Qualität selbst bewerten"],
        ["/evolve", "Instincts analysieren → bessere Skill-Struktur"],
        ["/promote", "Projekt-Instincts global befördern"],
        ["/instinct-status", "alle Instincts mit Confidence-Score"],
        ["/skill-create", "aus Git-History eine Skill generieren"],
    ], widths=[2.0, 4.6])
    add_para(doc, "Routine: Session-Ende → /learn-eval → bei guten Mustern /evolve → Bewährtes mit /promote global "
                  "verfügbar machen.", space=2)

    # 11
    add_heading(doc, "11 · Parallelisierung", 1)
    add_bullets(doc, [
        ("/fork", "Konversation forken für nicht-überlappende Nebenaufgaben (Fragen zur Codebase)."),
        ("Git-Worktrees", "für überlappende parallele Arbeit ohne Konflikte — eigene Claude-Instanz je Worktree."),
        ("Cascade-Methode", "neue Tasks in neuen Tabs, alt→neu abarbeiten, max. 3–4 gleichzeitig."),
        ("ECC-Multi-Model", "/multi-plan, /multi-workflow, /multi-backend, /multi-frontend, /loop-start."),
    ])
    add_code(doc, "git worktree add ../feature-a feature-a\ncd ../feature-a && claude   # eigene Instanz")

    # 12
    add_heading(doc, "12 · Security im Alltag + VPS-Hinweise", 1)
    add_para(doc, "Kernhaltung: Baue so, als würde das Modell irgendwann etwas Feindliches lesen, während es etwas "
                  "Wertvolles hält (lethal trifecta: private Daten + untrusted Content + externe Kommunikation).")
    add_para(doc, "Bereits aktiv / sicher:", bold=True, color=EMERALD, space=2)
    add_bullets(doc, SECURITY_ACTIVE)
    add_para(doc, "Bewusst NICHT automatisch (Least-Agency, opt-in):", bold=True, color=AMBER, space=2)
    add_bullets(doc, SECURITY_OPTIN)
    add_callout(doc, "VPS-weit denken:", "Da ECC global ist, wirkt es in allen Produktionsprojekten. ECC-Hooks "
                "bleiben deshalb inaktiv, bis du sie pro Bedarf sichtest und aktivierst. Härtung gezielt via "
                "./install-vps.sh --harden (legt vorher ein settings.json-Backup an).")

    # 13
    add_heading(doc, "13 · ECC-CLIs & Wartung", 1)
    add_code(doc,
             "cd \"/root/projekte/Claude Code BestPractice/ecc\"\n"
             "node scripts/ecc.js doctor          # Health-Check (claude-home: OK)\n"
             "node scripts/ecc.js list-installed   # was ist installiert\n"
             "node scripts/ecc.js repair           # ECC-Dateien wiederherstellen\n"
             "npx ecc consult \"security reviews\"  # Advisor: welche Komponenten?\n"
             "# Re-Install / Update VPS-weit:\n"
             "cd \"/root/projekte/Claude Code BestPractice\" && ./install-vps.sh")
    add_para(doc, "Slash-Einstieg: /ecc-guide (Onboarding), /harness-audit (Config-Scorecard), /cost-report, "
                  "/skill-health, /projects.", color=MUTED, size=9.5)

    # 14
    add_heading(doc, "14 · Quellen & TL;DR", 1)
    add_para(doc, "Original-Guides von @affaanmustafa (als X-Threads veröffentlicht; lokal im Repo unter ecc/):",
             bold=True, space=2)
    add_bullets(doc, [
        ("Shortform-Guide:", X_SHORT + "  (ecc/the-shortform-guide.md) — Setup & Philosophie"),
        ("Longform-Guide:", X_LONG + "  (ecc/the-longform-guide.md) — Token, Memory, Evals, Parallelisierung"),
        ("Security-Guide:", X_SEC + "  (ecc/the-security-guide.md) — Agent-Security, Pflichtlektüre"),
        ("Erfinder:", X_AUTH + "  (@affaanmustafa)"),
    ])
    add_para(doc, "TL;DR — so arbeitest du „wie der Erfinder“:", bold=True, color=INDIGO, space=2)
    add_bullets(doc, [
        "In Phasen denken: Research → /plan (oder /rpi) → /feature-dev+TDD → /code-review → Verify, /clear dazwischen.",
        "Kontext sauber: < 10 MCPs aktiv, billigstes ausreichendes Modell, modulare Dateien, strategisch compacten.",
        "Persistieren: /save-session am Ende, /resume-session am Anfang.",
        "Lernen lassen: /learn-eval → /evolve → /promote.",
        "Security zuerst: RTK aktiv, ECC-Hooks/AgentShield bewusst aktivieren, nie blind ausführen.",
        "Bei Unsicherheit: /ecc-guide, ecc doctor, die drei Original-Guides.",
    ])

    doc.save(DOCX_OUT)
    print("✅ Word:", DOCX_OUT)


# ============================================================ POWERPOINT
def _bg(slide, color):
    f = slide.background.fill
    f.solid()
    f.fore_color.rgb = color


def _box(slide, l, t, w, h):
    return slide.shapes.add_textbox(PInches(l), PInches(t), PInches(w), PInches(h)).text_frame


def _set(tf, text, size=18, color=P_INK, bold=False, align=PP_ALIGN.LEFT, font="Calibri"):
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.alignment = align
    r = p.add_run()
    r.text = text
    r.font.size = PPt(size)
    r.font.bold = bold
    r.font.color.rgb = color
    r.font.name = font
    return p


def _bullet(tf, text, size=15, color=P_INK, bold=False, level=0, first=False):
    p = tf.paragraphs[0] if first else tf.add_paragraph()
    p.level = level
    r = p.add_run()
    r.text = text
    r.font.size = PPt(size)
    r.font.bold = bold
    r.font.color.rgb = color
    r.font.name = "Calibri"
    return p


def _accent_bar(slide):
    bar = slide.shapes.add_shape(1, PInches(0), PInches(0), PInches(13.333), PInches(0.18))
    bar.fill.solid()
    bar.fill.fore_color.rgb = P_CYAN
    bar.line.fill.background()


def _title(slide, text):
    _accent_bar(slide)
    tf = _box(slide, 0.6, 0.35, 12.1, 0.9)
    _set(tf, text, size=28, color=P_INDIGO, bold=True)


def _table(slide, headers, rows, l, t, w, h, col_w=None, fsize=12):
    rcount = len(rows) + 1
    ccount = len(headers)
    gtbl = slide.shapes.add_table(rcount, ccount, PInches(l), PInches(t), PInches(w), PInches(h)).table
    gtbl.first_row = True
    if col_w:
        for i, cw in enumerate(col_w):
            gtbl.columns[i].width = PInches(cw)
    for ci, htxt in enumerate(headers):
        c = gtbl.cell(0, ci)
        c.fill.solid(); c.fill.fore_color.rgb = P_INDIGO
        c.margin_top = PInches(0.02); c.margin_bottom = PInches(0.02)
        tf = c.text_frame; tf.word_wrap = True
        p = tf.paragraphs[0]; r = p.add_run(); r.text = htxt
        r.font.size = PPt(fsize); r.font.bold = True; r.font.color.rgb = P_WHITE; r.font.name = "Calibri"
    for ri, row in enumerate(rows):
        for ci, val in enumerate(row):
            c = gtbl.cell(ri + 1, ci)
            c.fill.solid()
            c.fill.fore_color.rgb = PRGB(0xF3, 0xF4, 0xF6) if ri % 2 == 0 else P_WHITE
            c.margin_top = PInches(0.02); c.margin_bottom = PInches(0.02)
            tf = c.text_frame; tf.word_wrap = True
            p = tf.paragraphs[0]; r = p.add_run(); r.text = val
            r.font.size = PPt(fsize); r.font.color.rgb = P_INK; r.font.name = "Calibri"
    return gtbl


def build_pptx():
    prs = Presentation()
    prs.slide_width = PInches(13.333)
    prs.slide_height = PInches(7.5)
    blank = prs.slide_layouts[6]

    # --- Titelfolie
    s = prs.slides.add_slide(blank)
    _bg(s, P_INDIGO_D)
    bar = s.shapes.add_shape(1, PInches(0), PInches(3.05), PInches(13.333), PInches(0.06))
    bar.fill.solid(); bar.fill.fore_color.rgb = P_CYAN; bar.line.fill.background()
    tf = _box(s, 0.9, 1.5, 11.5, 1.0)
    _set(tf, "ENGINEERING HARNESS", size=16, color=P_CYAN, bold=True)
    tf = _box(s, 0.9, 1.95, 11.5, 1.2)
    _set(tf, "ECC × BestPractice", size=46, color=P_WHITE, bold=True)
    tf = _box(s, 0.9, 3.25, 11.5, 1.4)
    _bullet(tf, "Das fusionierte, VPS-weite Claude-Code-Harness", size=20, color=P_WHITE, bold=True, first=True)
    _bullet(tf, "Global aktiv in ~/.claude · ECC 2.0.0-rc.1 (core) + RPI-Workflow · RTK-sicher", size=14, color=P_MUTED)
    _bullet(tf, "Quelle / Re-Install:  ./install-vps.sh   ·   Guides: @affaanmustafa", size=14, color=P_MUTED)

    # --- Section: Was ist das?
    s = prs.slides.add_slide(blank); _title(s, "1 · Was ist dieses Harness?")
    tf = _box(s, 0.7, 1.4, 12.0, 5.5)
    _bullet(tf, "Fusion zweier Systeme — Fokus auf ECC:", size=18, color=P_INDIGO, bold=True, first=True)
    _bullet(tf, "ECC (Everything Claude Code) — die Engine: 63 Agents, ~79 Skills, 79 Commands, 21 Rule-Packs,", size=15, level=1)
    _bullet(tf, "manifest-Installer, Continuous Learning, Security-Scanning.", size=15, level=2)
    _bullet(tf, "BestPractice-Extras — RPI-Workflow, /adopt-project, state/-Pattern, Karpathy-Prinzipien.", size=15, level=1)
    _bullet(tf, "", size=8)
    _bullet(tf, "„Konfiguration ist Fine-Tuning, nicht Architektur.\"", size=18, color=P_AMBER, bold=True)
    _bullet(tf, "Wiederverwendbare Muster · sauberer Kontext · billigstes Modell · Verifikation mit Evidenz · Security zuerst.", size=14, color=P_MUTED)
    _bullet(tf, "5 Prinzipien: Agent-First · Test-Driven · Security-First · Immutability · Plan-Before-Execute.", size=14, color=P_INDIGO)

    # --- Setup & VPS
    s = prs.slides.add_slide(blank); _title(s, "2 · Setup & VPS-Architektur")
    tf = _box(s, 0.7, 1.35, 12.0, 2.1)
    _bullet(tf, "ECC ist GLOBAL (~/.claude) → aktiv in JEDEM VPS-Projekt (WMS, Jarvis, n8n …).", size=16, color=P_INDIGO, bold=True, first=True)
    _bullet(tf, "Namespace-sicher (rules/ecc, skills/ecc) · RTK-Hook unangetastet · settings.json byte-identisch.", size=14)
    _bullet(tf, "Reproduzierbar: Repo = Quelle, Re-Install via ./install-vps.sh (idempotent, mit Backup).", size=14)
    _table(s, ["Dein Tool", "ECC-Pendant", "Empfehlung"], [
        ["superpowers", "tdd-workflow, verification-loop", "beides nutzbar; ECC bevorzugen"],
        ["claude-mem", "/save-session, learning-v2", "EINE Memory-Quelle je Projekt"],
        ["RTK", "Token-Ökonomie", "ergänzen sich (Bash- vs Workflow-Ebene)"],
        ["context-mode", "—", "bleibt dein Recherche-Tool"],
    ], 0.7, 3.6, 12.0, 2.6, col_w=[2.4, 4.2, 5.4], fsize=12)

    # --- Mentales Modell
    s = prs.slides.add_slide(blank); _title(s, "3 · Mentales Modell — die Bausteine")
    _table(s, ["Baustein", "Was es ist", "Wo (global)"], [[b[0], b[1], b[2]] for b in BUILDING_BLOCKS],
           0.7, 1.5, 12.0, 4.4, col_w=[2.0, 7.0, 3.0], fsize=11)
    tf = _box(s, 0.7, 6.05, 12.0, 1.0)
    _bullet(tf, "Regel: Durable Logik gehört in Skills. Was du 3× tippst → /skill-create.", size=15, color=P_AMBER, bold=True, first=True)

    # --- Pipeline
    s = prs.slides.add_slide(blank); _title(s, "4 · Täglicher Workflow — 5 Phasen")
    cf = _box(s, 0.7, 1.45, 12.0, 2.6); _bg_shape = s.shapes.add_shape(1, PInches(0.7), PInches(1.45), PInches(12.0), PInches(2.5))
    _bg_shape.fill.solid(); _bg_shape.fill.fore_color.rgb = P_INDIGO_D; _bg_shape.line.fill.background()
    cf2 = _bg_shape.text_frame; cf2.word_wrap = True; cf2.margin_left = PInches(0.2)
    code = ("RESEARCH   →  Explore-Agent / context-mode      →  research.md\n"
            "PLAN       →  /plan  (wartet auf dein OK!)        →  plan.md\n"
            "IMPLEMENT  →  /feature-dev + tdd-workflow          →  Code + Tests\n"
            "REVIEW     →  /code-review (+ /<sprache>-review)   →  review.md\n"
            "VERIFY     →  Tests/Build (+ /build-fix)           →  grün / zurück")
    for i, line in enumerate(code.split("\n")):
        p = cf2.paragraphs[0] if i == 0 else cf2.add_paragraph()
        r = p.add_run(); r.text = line; r.font.name = "Consolas"; r.font.size = PPt(13)
        r.font.color.rgb = PRGB(0x9C, 0xE3, 0xF0)
    tf = _box(s, 0.7, 4.3, 12.0, 2.6)
    _bullet(tf, "Ein Input, ein Output je Schritt — in Dateien speichern.", size=15, first=True)
    _bullet(tf, "Phasen nicht überspringen. /clear zwischen großen Phasen.", size=15)
    _bullet(tf, "Subagents immer objektiven Kontext mitgeben, nicht nur die Frage.", size=15)

    # --- RPI
    s = prs.slides.add_slide(blank); _title(s, "5 · RPI-Workflow (BestPractice-Extra)")
    _table(s, ["Command", "Phase", "Liefert"], [
        ["/rpi:research <f>", "Viability-Gate", "GO/NO-GO mit Begründung"],
        ["/rpi:plan <f>", "Planung", "umfassende Planungs-Doku"],
        ["/rpi:implement <f>", "Umsetzung", "phasiert, mit Validation-Gates"],
        ["/adopt-project", "Onboarding", "liest Codebase, füllt state/"],
    ], 0.7, 1.5, 12.0, 3.0, col_w=[3.2, 3.0, 5.8], fsize=13)
    tf = _box(s, 0.7, 4.8, 12.0, 1.6)
    _bullet(tf, "Wann RPI? Größere, riskante Features mit nötigem Viability-Gate.", size=16, color=P_INDIGO, bold=True, first=True)
    _bullet(tf, "Wann /plan? Schneller, normaler Plan-dann-Code-Flow.", size=16, color=P_INDIGO)

    # --- Command Cheat-Sheet (gesplittet auf 2 Folien)
    half = 7
    for idx, chunk in enumerate([CMD_CHEAT[:half], CMD_CHEAT[half:]]):
        s = prs.slides.add_slide(blank)
        _title(s, "6 · Cheat-Sheet — wann welcher Command" + (" (1/2)" if idx == 0 else " (2/2)"))
        _table(s, ["Situation", "Command", "Zweck"], chunk, 0.6, 1.5, 12.2, 5.2,
               col_w=[3.0, 4.2, 5.0], fsize=12)

    # --- MCP
    s = prs.slides.add_slide(blank); _title(s, "7 · Wann welcher MCP")
    tf = _box(s, 0.7, 1.3, 12.0, 0.6)
    _set(tf, "Faustregel: 20–30 konfiguriert, < 10 aktiv / < 80 Tools. Ungenutztes mit /mcp deaktivieren.",
         size=14, color=P_AMBER, bold=True)
    _table(s, ["Aufgabe", "MCP / Tool", "Hinweis"], MCP_ROWS, 0.6, 1.95, 12.2, 4.9,
           col_w=[3.6, 2.8, 5.8], fsize=11)

    # --- Modelle
    s = prs.slides.add_slide(blank); _title(s, "8 · Token-Ökonomie & Modellstrategie")
    _table(s, ["Aufgabe", "Modell", "Warum"], MODEL_ROWS, 0.6, 1.5, 12.2, 4.2,
           col_w=[3.8, 1.8, 6.6], fsize=12)
    tf = _box(s, 0.7, 5.9, 12.0, 1.2)
    _bullet(tf, "Default = Sonnet (~90 %). Opus bei: 1. Versuch gescheitert · ≥5 Dateien · Architektur · Security.",
            size=15, color=P_INDIGO, bold=True, first=True)
    _bullet(tf, "Hilfe: /model-route, /cost-report. Auto-Compact aus, manuell /compact mit Hint.", size=14, color=P_MUTED)

    # --- Memory + Learning kombiniert
    s = prs.slides.add_slide(blank); _title(s, "9–10 · Memory, Sessions & Continuous Learning")
    _table(s, ["Command", "Zweck"], [
        ["/save-session · /resume-session", "Tag-zu-Tag-Fortschritt persistieren"],
        ["/sessions · /checkpoint · /aside", "Historie · Checkpoint · Nebenfrage"],
        ["/learn-eval → /evolve → /promote", "Self-Improvement-Loop (Instincts)"],
        ["/instinct-status · /skill-create", "Instincts zeigen · Skill aus Git-History"],
    ], 0.7, 1.5, 12.0, 2.8, col_w=[5.2, 6.8], fsize=13)
    tf = _box(s, 0.7, 4.6, 12.0, 1.6)
    _bullet(tf, "EINE primäre Memory-Quelle je Projekt (claude-mem-Koexistenz). Keine Secrets in Memory.",
            size=15, color=P_AMBER, bold=True, first=True)
    _bullet(tf, "Routine: Session-Ende → /learn-eval → /evolve → /promote.", size=15, color=P_INDIGO)

    # --- Security
    s = prs.slides.add_slide(blank); _title(s, "12 · Security im Alltag + VPS")
    tf = _box(s, 0.7, 1.35, 12.0, 2.6)
    _bullet(tf, "Aktiv / sicher:", size=16, color=P_INDIGO, bold=True, first=True)
    for lab, txt in SECURITY_ACTIVE:
        _bullet(tf, f"{lab} — {txt}", size=13, level=1)
    tf = _box(s, 0.7, 4.0, 12.0, 2.8)
    _bullet(tf, "Bewusst opt-in (Least-Agency):", size=16, color=P_AMBER, bold=True, first=True)
    for lab, txt in SECURITY_OPTIN:
        _bullet(tf, f"{lab} — {txt}", size=13, level=1)
    _bullet(tf, "VPS-weit: ECC global → Hooks bleiben inaktiv bis zur bewussten Aktivierung. Härtung: ./install-vps.sh --harden.",
            size=13, color=P_INDIGO)

    # --- Quellen / TL;DR
    s = prs.slides.add_slide(blank); _bg(s, P_INDIGO_D); _accent_bar(s)
    tf = _box(s, 0.8, 0.6, 11.7, 0.9); _set(tf, "Quellen & TL;DR", size=28, color=P_WHITE, bold=True)
    tf = _box(s, 0.8, 1.6, 11.7, 2.2)
    _bullet(tf, "Guides von @affaanmustafa (X-Threads; lokal unter ecc/):", size=15, color=P_CYAN, bold=True, first=True)
    _bullet(tf, "Shortform: " + X_SHORT, size=12, color=P_WHITE)
    _bullet(tf, "Longform:  " + X_LONG, size=12, color=P_WHITE)
    _bullet(tf, "Security:  " + X_SEC, size=12, color=P_WHITE)
    tf = _box(s, 0.8, 3.9, 11.7, 3.2)
    _bullet(tf, "TL;DR — wie der Erfinder:", size=16, color=P_CYAN, bold=True, first=True)
    _bullet(tf, "1. In Phasen: Research → /plan (oder /rpi) → /feature-dev+TDD → /code-review → Verify.", size=13, color=P_WHITE)
    _bullet(tf, "2. Kontext sauber: <10 MCPs, billigstes Modell, modulare Dateien, strategisch compacten.", size=13, color=P_WHITE)
    _bullet(tf, "3. Persistieren: /save-session · /resume-session.   4. Lernen: /learn-eval → /evolve → /promote.", size=13, color=P_WHITE)
    _bullet(tf, "5. Security zuerst: RTK aktiv, Hooks/AgentShield bewusst, nie blind ausführen.", size=13, color=P_WHITE)
    _bullet(tf, "6. Unsicher? /ecc-guide · ecc doctor · die drei Original-Guides.", size=13, color=P_WHITE)

    prs.save(PPTX_OUT)
    print("✅ PowerPoint:", PPTX_OUT)


if __name__ == "__main__":
    build_docx()
    build_pptx()

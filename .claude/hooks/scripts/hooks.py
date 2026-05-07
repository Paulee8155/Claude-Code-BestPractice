#!/usr/bin/env python3
"""Central hook handler for all 27 Claude Code lifecycle events.

Usage:
    hooks.py <EventName>          # invoked by Claude Code via settings.json
    hooks.py --self-test          # smoke test all event handlers
    hooks.py --list-events        # list known events

Reads hook payload as JSON on stdin, dispatches by event name.

Exit codes:
    0  allow / no objection
    1  generic error
    2  block — printed message is shown to Claude as a hard stop
"""
from __future__ import annotations

import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
CONFIG_PATH = REPO_ROOT / ".claude/hooks/config/hooks-config.json"
LOCAL_CONFIG_PATH = REPO_ROOT / ".claude/hooks/config/hooks-config.local.json"

EVENTS = [
    "PreToolUse", "PostToolUse", "PostToolUseFailure",
    "PermissionRequest", "UserPromptSubmit", "Notification", "Stop",
    "SubagentStart", "SubagentStop",
    "PreCompact", "PostCompact",
    "SessionStart", "SessionEnd", "Setup",
    "TeammateIdle", "TaskCreated", "TaskCompleted",
    "ConfigChange", "WorktreeCreate", "WorktreeRemove",
    "InstructionsLoaded", "Elicitation", "ElicitationResult",
    "StopFailure", "CwdChanged", "FileChanged", "PermissionDenied",
]

# ---------------------------------------------------------------------------
# Config + logging
# ---------------------------------------------------------------------------

def load_config() -> dict:
    cfg: dict = {}
    for p in (CONFIG_PATH, LOCAL_CONFIG_PATH):
        if p.is_file():
            try:
                cfg.update(json.loads(p.read_text()))
            except json.JSONDecodeError:
                pass
    return cfg


def is_disabled(event: str, cfg: dict) -> bool:
    return bool(cfg.get(f"disable{event}Hook", False))


def log(event: str, payload: dict, cfg: dict) -> None:
    if cfg.get("disableLogging", True):
        return
    log_path = REPO_ROOT / cfg.get("logFile", ".claude/hooks/log.jsonl")
    log_path.parent.mkdir(parents=True, exist_ok=True)
    entry = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "event": event,
        "payload": payload,
    }
    with log_path.open("a") as f:
        f.write(json.dumps(entry) + "\n")


# ---------------------------------------------------------------------------
# Safety: block-destructive (PreToolUse on Bash)
# ---------------------------------------------------------------------------

DESTRUCTIVE_PATTERNS = [
    "rm -rf", "rm -fr",
    "git push --force", "git push -f ",
    "git reset --hard",
    "git clean -fd", "git clean -f",
    "chmod -R 777",
    "sudo rm",
    "truncate --size 0",
    "dd if=",
    "> /dev/",
    "DROP TABLE", "drop table",
    "DROP DATABASE", "drop database",
]


def block_destructive(payload: dict) -> tuple[bool, str]:
    tool = payload.get("tool_name") or payload.get("tool") or ""
    if tool != "Bash":
        return False, ""
    cmd = payload.get("tool_input", {}).get("command", "") or ""
    for pat in DESTRUCTIVE_PATTERNS:
        if pat in cmd:
            return True, (
                f"BLOCKED by harness: '{pat}' requires explicit user confirmation.\n"
                "Describe the action and ask before proceeding."
            )
    return False, ""


# ---------------------------------------------------------------------------
# Safety: protect-secrets (PreToolUse on Read/Write/Edit)
# ---------------------------------------------------------------------------

SECRET_PATTERNS = [
    r"\.env$", r"\.env\.",
    r"/secrets/",
    r"credentials",
    r"\.pem$", r"\.key$",
    r"id_rsa", r"id_ed25519",
    r"\.p12$", r"\.pfx$", r"\.keystore$",
    r"service[._-]?account",
]


def protect_secrets(payload: dict) -> tuple[bool, str]:
    tool = payload.get("tool_name") or payload.get("tool") or ""
    if tool not in ("Read", "Write", "Edit", "NotebookEdit"):
        return False, ""
    ti = payload.get("tool_input", {}) or {}
    target = ti.get("file_path") or ti.get("path") or ti.get("notebook_path") or ""
    if not target:
        return False, ""
    for pat in SECRET_PATTERNS:
        if re.search(pat, target, re.IGNORECASE):
            return True, (
                f"BLOCKED by harness: '{target}' matches sensitive pattern '{pat}'.\n"
                "Confirm explicitly before accessing secrets or credentials."
            )
    return False, ""


# ---------------------------------------------------------------------------
# Per-event handlers (stubs by default; extend as needed)
# ---------------------------------------------------------------------------

def handle_PreToolUse(payload: dict, cfg: dict) -> int:
    safety = cfg.get("safety", {})
    if safety.get("blockDestructive", True):
        blocked, msg = block_destructive(payload)
        if blocked:
            print(msg, file=sys.stderr)
            return 2
    if safety.get("protectSecrets", True):
        blocked, msg = protect_secrets(payload)
        if blocked:
            print(msg, file=sys.stderr)
            return 2
    return 0


def _noop(_payload: dict, _cfg: dict) -> int:  # placeholder for future logic
    return 0


HANDLERS = {
    "PreToolUse": handle_PreToolUse,
}
for _e in EVENTS:
    HANDLERS.setdefault(_e, _noop)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print("usage: hooks.py <EventName> | --self-test | --list-events", file=sys.stderr)
        return 1

    arg = argv[1]
    if arg == "--list-events":
        print("\n".join(EVENTS))
        return 0
    if arg == "--self-test":
        return self_test()

    event = arg
    if event not in EVENTS:
        print(f"unknown event: {event}", file=sys.stderr)
        return 1

    cfg = load_config()
    if is_disabled(event, cfg):
        return 0

    raw = sys.stdin.read() if not sys.stdin.isatty() else ""
    try:
        payload = json.loads(raw) if raw.strip() else {}
    except json.JSONDecodeError:
        payload = {"_raw": raw}

    log(event, payload, cfg)

    handler = HANDLERS.get(event, _noop)
    try:
        return int(handler(payload, cfg) or 0)
    except Exception as e:  # pragma: no cover - defensive
        print(f"hook handler error ({event}): {e}", file=sys.stderr)
        return 1


def self_test() -> int:
    cfg = load_config()
    failures: list[str] = []

    # Safety: destructive command must be blocked
    rc = handle_PreToolUse(
        {"tool_name": "Bash", "tool_input": {"command": "rm -rf /tmp/x"}}, cfg,
    )
    if rc != 2:
        failures.append("block_destructive: expected 2, got " + str(rc))

    # Safety: secret read must be blocked
    rc = handle_PreToolUse(
        {"tool_name": "Read", "tool_input": {"file_path": "/repo/.env"}}, cfg,
    )
    if rc != 2:
        failures.append("protect_secrets: expected 2, got " + str(rc))

    # Safety: harmless command passes
    rc = handle_PreToolUse(
        {"tool_name": "Bash", "tool_input": {"command": "ls -la"}}, cfg,
    )
    if rc != 0:
        failures.append("benign Bash: expected 0, got " + str(rc))

    # All other events return 0 with empty payload
    for e in EVENTS:
        rc = HANDLERS[e]({}, cfg)
        if rc != 0:
            failures.append(f"{e} handler: expected 0, got {rc}")

    if failures:
        print("SELF-TEST FAILED:", file=sys.stderr)
        for f in failures:
            print("  -", f, file=sys.stderr)
        return 1
    print(f"SELF-TEST OK ({len(EVENTS)} events, safety checks active)")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))

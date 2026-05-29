# Hooks System

Central handler for all 27 Claude Code lifecycle events. One Python script,
one config file, per-event toggles.

```
.claude/hooks/
├── HOOKS-README.md                # this file
├── config/
│   ├── hooks-config.json          # checked-in, default toggles
│   └── hooks-config.local.json    # gitignored, per-machine overrides
└── scripts/
    └── hooks.py                   # dispatch table for all 27 events
```

## How it works

1. `settings.json` registers `python3 .claude/hooks/scripts/hooks.py <Event>`
   for each lifecycle event Claude Code emits.
2. The handler reads the JSON payload from stdin, looks up the per-event
   handler, and exits with `0` (allow), `2` (block), or `1` (error).
3. Each event can be disabled in `hooks-config.json` via
   `disable<EventName>Hook: true`.

## Default behavior

By default only `PreToolUse` is active — it runs the two safety checks:

| Check | Trigger | Blocks |
|---|---|---|
| `blockDestructive` | `Bash` tool calls | `rm -rf`, `git push --force`, `git reset --hard`, `git clean -f`, `chmod -R 777`, `sudo rm`, `dd if=`, `> /dev/`, `DROP TABLE`, etc. |
| `protectSecrets` | `Read` / `Write` / `Edit` / `NotebookEdit` | `.env*`, `/secrets/`, `credentials*`, `*.pem`, `*.key`, `id_rsa`, `id_ed25519`, `*.p12`, `*.pfx`, `*.keystore`, `service.account` |

All other events are wired but disabled — flip the relevant
`disable*Hook` flag to enable them and add custom logic in
`hooks.py` (`HANDLERS["EventName"]`).

## Supported events (27)

`PreToolUse`, `PostToolUse`, `PostToolUseFailure`, `PermissionRequest`,
`UserPromptSubmit`, `Notification`, `Stop`, `SubagentStart`, `SubagentStop`,
`PreCompact`, `PostCompact`, `SessionStart`, `SessionEnd`, `Setup`,
`TeammateIdle`, `TaskCreated`, `TaskCompleted`, `ConfigChange`,
`WorktreeCreate`, `WorktreeRemove`, `InstructionsLoaded`, `Elicitation`,
`ElicitationResult`, `StopFailure`, `CwdChanged`, `FileChanged`,
`PermissionDenied`.

## Self-test

```
python3 .claude/hooks/scripts/hooks.py --self-test
python3 .claude/hooks/scripts/hooks.py --list-events
```

Self-test verifies that each event handler exists and that the safety
checks block the right inputs.

## Logging

When `disableLogging` is `false` in `hooks-config.json`, every dispatched
event is appended as one JSON line to `.claude/hooks/log.jsonl`. Rotate or
truncate manually.

## Local overrides

Create `.claude/hooks/config/hooks-config.local.json` (gitignored) to flip
toggles on a single machine without touching the shared config — keys here
override the checked-in defaults.

## Sounds (optional)

The reference repo wires sound notifications per event via ElevenLabs TTS
in `.claude/hooks/sounds/`. This harness ships sound-off by default
(`disableSound: true`). Add `.claude/hooks/sounds/<event>.mp3` and extend
the matching handler in `hooks.py` to play it (e.g. via `afplay`,
`paplay`, or `winsound`).

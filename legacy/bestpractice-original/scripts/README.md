# scripts/

Place project utility scripts here.

## Conventions

- Scripts should be idempotent where possible (safe to run multiple times)
- Each script should have a comment at the top explaining what it does and when to use it
- Scripts that are destructive must prompt for confirmation before proceeding
- Add new scripts to this README

## Common Script Types

| Script | Purpose |
|---|---|
| `setup.sh` | One-time dev environment setup |
| `seed.sh` | Seed database with development data |
| `reset-db.sh` | Drop and recreate development database |
| `check-deps.sh` | Verify all required tools are installed |
| `generate-types.sh` | Regenerate types from schema |

## Adding a New Script

1. Create the file in `scripts/`
2. Make it executable: `chmod +x scripts/your-script.sh`
3. Add a top comment explaining purpose and usage
4. Add it to this README
5. Add it to `.claude/settings.json` allow list if Claude should run it

## Safety Rule

Scripts that delete data, reset state, or modify production must:
1. Print a warning message
2. Require explicit confirmation (`read -p "Continue? (y/N)"`)
3. Default to NO if the user just presses Enter

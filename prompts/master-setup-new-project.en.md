# Master Setup: New Project

> **Use this prompt** when you have a new, empty, or near-empty directory and want to drop the harness into it.
> Paste everything between the `===` lines into a fresh Claude Code session in the target directory.

---

```
============================================================
You will set up this directory as a new project with the Claude-Code-BestPractice harness.

Harness repo URL: https://github.com/Paulee8155/Claude-Code-BestPractice

Follow these 7 steps exactly. Use TaskCreate to track them. Report status briefly after each step.

## Step 1 — Verify tools

Check the following tools are available (each via `--version`):

| Tool | Verification | Install if missing |
|---|---|---|
| git | `git --version` | `apt install -y git` (Linux) / `brew install git` (mac) |
| node | `node --version` (≥ 18) | `curl -fsSL https://deb.nodesource.com/setup_lts.x | bash && apt install -y nodejs` |
| python3 | `python3 --version` (≥ 3.10) | `apt install -y python3` |
| rtk | `rtk --version` (≥ 0.38) | `curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/master/install.sh | sh` |
| bun | `bun --version` (≥ 1.0) | `curl -fsSL https://bun.sh/install | bash` |
| gh | `gh --version` (optional) | `apt install -y gh` |

Report tool status as a table. For missing tools: ask EXACTLY ONE AskUserQuestion whether to install all missing ones. Never install without asking.

## Step 2 — Verify + install claude-mem

Check whether `~/.claude-mem/settings.json` exists.
- Exists: report "claude-mem already installed".
- Missing: briefly explain that claude-mem is the cross-session memory layer (semantic search, web UI at http://localhost:37777). Ask whether to run `npx claude-mem install`. If yes: run it, then remind the user to restart Claude Code so the MCP tools register.

## Step 3 — Bring the harness into the current directory

Inspect the current directory with `ls -la`:

- **Empty or near-empty** (max .git, .gitignore, README): clone the harness in:
  ```
  git clone https://github.com/Paulee8155/Claude-Code-BestPractice.git /tmp/harness-source
  cp -r /tmp/harness-source/. ./
  rm -rf .git/                 # start your own git history
  rm -rf /tmp/harness-source
  git init
  git add -A
  git commit -m "feat: initial harness setup"
  ```

- **Has content already** (but no .claude/ and no CLAUDE.md): edge case. Ask the user whether to use the "Master Setup: Existing Project" prompt instead (safer because of the backup logic). If they want to continue here: same procedure as above, but WITHOUT `rm -rf .git`.

## Step 4 — Run the setup script

After cloning: `chmod +x scripts/*.sh`. Then run `./scripts/setup.sh`.

The script is interactive and asks 7 questions: Project Name, Project Type, Primary Language, Status, Runtime, Framework, Package Manager. If the user prefers to answer in this Claude conversation, offer it proactively: use `AskUserQuestion` with all 7 fields in ONE call, then fill `PROJECT_RULES.md` directly via Edit (schema is lines 9–16 of `PROJECT_RULES.md`).

## Step 5 — Verify MCP servers

Read `.mcp.json`. Report which MCP servers are configured. Remind the user that after a Claude Code restart, `/mcp` shows connection state. If the `claude-mem` MCP server doesn't appear after restart: hint that `npx claude-mem install` may need to run again.

## Step 6 — Verify harness

Run `./scripts/verify-harness.sh`. On `PASS — harness is intact`: continue. On FAIL: show the red lines and ask what to do.

## Step 7 — Final report

Tell the user:
1. Which tools were installed (previously missing → now installed)
2. What they still need to do:
   - Final review of PROJECT_RULES.md (very important — sections like "Sensitive Areas", "External Services", "Project-Specific Rules" must be filled by the user themselves)
   - Restart Claude Code for MCP reload
3. First commands to try:
   - `/rpi:research <feature-idea>` for brainstorming
   - `/rpi:plan <feature>` for planning
   - `/rpi:implement` for execution
4. That the 12 skills in `.claude/skills/` are automatically available (Claude decides when to use them)
5. That the Karpathy discipline rules + claude-mem rule load automatically every session

## Rules for YOU (Claude) during execution

- **Never** install tools without asking — always confirm via AskUserQuestion
- **Never** overwrite existing files without backup — on conflict, ask
- **Never** run `git push` — the user decides when and where to push
- For every `npm install`, `apt install`, `curl | sh`: confirm with the user
- Bash output > 20 lines: use RTK (e.g. `rtk git status`)
- Report briefly after each step (not just at the end)
- Use TaskCreate to track the 7 steps
- For `chmod +x`: only on files inside `./scripts/`, nowhere else
============================================================
```

---

## What you have afterward

- Complete harness structure in the project
- `PROJECT_RULES.md` with the base fields filled in
- `state/` initialised with project name + today's date
- `.claude/` with all skills, agents, rules, hooks
- Your own git history (independent of the harness repo)
- First commit on `main` with the entire setup

## What you still need to do

1. Finalise `PROJECT_RULES.md` (especially: Sensitive Areas, External Services, Project-Specific Rules, Known Issues)
2. Restart Claude Code once — so `claude-mem` and all MCP servers load
3. Optional: set GitHub remote + push

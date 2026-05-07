#!/usr/bin/env bash
# worktree.sh — manage parallel git worktrees for isolated feature work.
#
# Why worktrees?
# - Each feature gets its own checkout dir → no stash/checkout dance
# - Run multiple Claude Code sessions in parallel on different branches
# - Tests / dev servers don't conflict because each tree has its own files
#
# Layout convention:
#   /your/project              ← main checkout
#   /your/project-wt/<branch>  ← worktrees, sibling dir to main
#
# Commands:
#   worktree.sh add <branch>     create worktree for <branch>
#   worktree.sh list             list all worktrees
#   worktree.sh remove <branch>  remove worktree (branch survives)
#   worktree.sh prune            clean up stale worktree references

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
[[ -z "$REPO_ROOT" ]] && { echo "Not inside a git repo."; exit 1; }

REPO_NAME="$(basename "$REPO_ROOT")"
PARENT="$(dirname "$REPO_ROOT")"
WT_ROOT="$PARENT/${REPO_NAME}-wt"

cmd_add() {
  local branch="$1"
  [[ -z "$branch" ]] && { echo "Usage: worktree.sh add <branch>"; exit 1; }

  mkdir -p "$WT_ROOT"
  local wt_path="$WT_ROOT/$branch"

  if [[ -d "$wt_path" ]]; then
    echo "Worktree already exists: $wt_path"
    exit 0
  fi

  if git show-ref --verify --quiet "refs/heads/$branch"; then
    git worktree add "$wt_path" "$branch"
  else
    git worktree add -b "$branch" "$wt_path"
  fi

  echo
  echo "Worktree ready: $wt_path"
  echo "Open Claude Code there:"
  echo "  cd $wt_path"
}

cmd_list() {
  git worktree list
}

cmd_remove() {
  local branch="$1"
  [[ -z "$branch" ]] && { echo "Usage: worktree.sh remove <branch>"; exit 1; }
  local wt_path="$WT_ROOT/$branch"
  git worktree remove "$wt_path"
  echo "Removed worktree (branch '$branch' still exists)."
}

cmd_prune() {
  git worktree prune -v
}

case "${1:-}" in
  add)    shift; cmd_add "${1:-}" ;;
  list)   cmd_list ;;
  remove) shift; cmd_remove "${1:-}" ;;
  prune)  cmd_prune ;;
  *)
    cat <<EOF
Usage: worktree.sh <command> [args]

Commands:
  add <branch>     create worktree at $WT_ROOT/<branch>
  list             list all worktrees
  remove <branch>  remove worktree (branch survives)
  prune            clean up stale worktree references

Worktrees live in:  $WT_ROOT/
EOF
    exit 1
    ;;
esac

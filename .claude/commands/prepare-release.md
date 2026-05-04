---
description: Run the pre-release checklist to verify the project is ready to ship.
argument-hint: [version number]
---

# /prepare-release $ARGUMENTS

Prepare release: **$ARGUMENTS**

## Pre-Release Checklist

### Code Quality
- [ ] All tests pass (`npm test` / `pytest` / `go test ./...`)
- [ ] No type errors (`tsc --noEmit` / `mypy` / etc.)
- [ ] Linter is clean
- [ ] No `console.log`, `print`, `fmt.Println` debug output in production paths
- [ ] No hardcoded credentials, secrets, or dev URLs

### Functionality
- [ ] Core user flows work end-to-end
- [ ] New features work as specified
- [ ] No regressions in existing features
- [ ] Error states are handled gracefully

### Documentation
- [ ] `CHANGELOG.md` updated with changes since last release
- [ ] `README.md` reflects current setup steps
- [ ] Any new environment variables are documented
- [ ] Breaking changes are clearly marked

### Dependencies
- [ ] No dependency with known critical CVEs
- [ ] Dependency versions are pinned / locked

### Git & Versioning
- [ ] Working on the correct branch
- [ ] No uncommitted changes (`git status` is clean)
- [ ] Version bumped in `package.json` / `pyproject.toml` / etc.
- [ ] Git tag prepared: `git tag v$ARGUMENTS`

### Deployment (adapt to project)
- [ ] Environment variables set in production
- [ ] Database migrations reviewed and ready
- [ ] Rollback plan documented

## Release Commit

```
git add [changed files]
git commit -m "chore: release v$ARGUMENTS"
git tag v$ARGUMENTS
```

## Output

Report:
- Items checked and passed
- Any items that need attention before release
- Commands to execute for the release

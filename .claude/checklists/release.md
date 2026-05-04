# Checklist: Release

Run before every production release. Also available as `/prepare-release [version]`.

---

## Code Quality

- [ ] All tests pass
- [ ] No type errors
- [ ] Linter is clean
- [ ] No `console.log` / debug output in production paths
- [ ] No hardcoded credentials, dev URLs, or test data

## Functionality

- [ ] Core user flows tested manually (or automated E2E passes)
- [ ] New features verified against acceptance criteria
- [ ] No known regressions

## Documentation

- [ ] `CHANGELOG.md` updated
- [ ] `README.md` reflects current setup
- [ ] New env variables documented in `.env.example`
- [ ] Breaking changes clearly flagged

## Security

- [ ] No new dependencies with critical CVEs
- [ ] Auth and permissions work correctly
- [ ] Sensitive data not exposed in logs or responses

## Git

- [ ] On correct branch
- [ ] `git status` is clean (no uncommitted changes)
- [ ] Version bumped
- [ ] Tag created: `git tag v[version]`

## Deployment

- [ ] Env variables set in production
- [ ] Migrations reviewed and ready (if any)
- [ ] Rollback plan exists
- [ ] Monitoring/alerting active

## Post-Deploy

- [ ] Smoke test in production
- [ ] Error rate baseline confirmed normal
- [ ] Tag pushed: `git push origin v[version]`
- [ ] Release announced (if applicable)

# /release — Prepare and cut a new version

Follow these steps in order. If any step fails, stop and report the failure — do NOT skip ahead.

## 1. Determine version bump

Run:

```bash
git log $(git describe --tags --abbrev=0)..HEAD --oneline
```

Read the commits and apply semver based on conventional commits:

- `fix:` → patch
- `feat:` → minor
- `BREAKING CHANGE` or `!` → major

Present the proposed version bump to the user and wait for confirmation before proceeding.

## 2. Run all checks

Run `npm run static-checks`. Everything must pass. If anything fails, diagnose and fix the issue, then re-run. If you cannot fix after 3 attempts, stop and report.

## 3. Update ROADMAP.md

- Compare commits since the last tag against items in `ROADMAP.md`
- Move any completed items from **Remaining** to **Shipped** under the 1.0.0 MVP section (mark with ✅)
- Ensure new features not already listed are added to the shipped section

## 4. Update CHANGELOG.md

- Move items from `[Unreleased]` into a new version heading
- Group changes under `### Features`, `### Fixed`, `### Changed`, `### Removed` as appropriate
- Derive entries from the conventional commit messages since the last tag
- Follow the existing [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format
- Update comparison links at the bottom of the file

## 5. Commit docs changes

Commit the ROADMAP.md and CHANGELOG.md updates:

```
docs: update changelog and roadmap for vX.Y.Z release
```

## 6. Bump version and tag

Run:

```bash
npm version <patch|minor|major>
```

This updates `package.json`, creates a commit, and creates a git tag.

## 7. Verify build

Run:

```bash
npm run build
```

Ensure it compiles cleanly at the new version.

## 8. Push

Report the release summary (version, key changes, tag name) and ask the user for permission to push. Wait for confirmation before proceeding.

Once approved, push the commits and the new version tag:

```bash
git push origin main && git push origin vX.Y.Z
```

## 9. Monitor GitHub Actions

After pushing, monitor all triggered workflows to verify they succeed. The expected workflow chain is:

- **Static Checks** — triggered by push to main
- **release** — triggered by tag push (validates, publishes to npm, creates GitHub Release from CHANGELOG.md)

Poll workflow status using:

```bash
gh run list --limit 5
```

Check every 30 seconds until all workflows complete.

For any workflow that is still running, you can watch it with:

```bash
gh run watch <run-id>
```

If any workflow fails, investigate with:

```bash
gh run view <run-id> --log-failed
```

Report the final status of all workflows. If any fail, diagnose the issue and report it to the user.

## 10. Executive summary

Present a final release report to the user with the following format:

```
# Release vX.Y.Z

**Published:** <date and time in the user's local timezone>
**Tag:** vX.Y.Z
**Bump:** patch | minor | major
**npm:** https://www.npmjs.com/package/@darrenjaws/spotify-mcp

## Highlights

- <1-3 bullet points summarizing the most important changes for this release, written in plain language>

## Commits

- <list each commit included in this release (hash + message)>

## CI/CD

| Workflow | Status | Duration |
|---|---|---|
| Static Checks | <pass/fail> | <duration> |
| release | <pass/fail> | <duration> |

## Test results

- **Unit tests:** <count> passed
```

Fill in all values from the data collected during earlier steps. If any workflow failed, note it prominently at the top of the summary.

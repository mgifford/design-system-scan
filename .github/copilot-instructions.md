# Copilot Instructions for `design-system-scan`

## What this repo is

This is a small Node.js 24+ repository for scanning public sites for design-system adoption, currently focused on USWDS. It has two main surfaces:

- a CLI scanner that fetches pages, scores component/template “tells,” and optionally crawls same-origin URLs
- a GitHub Actions + GitHub Pages reporting pipeline that publishes an archive, latest dashboard, and per-run dashboards

Tech/runtime:

- ESM Node.js project, no framework, no transpile step
- Runtime and tests use built-in Node features (`fetch`, `node:test`)
- No lint config, formatter config, TypeScript, or bundler is present
- Repo is small: root files plus `src/`, `test/`, `.github/workflows/`

Trust this file first and only search the repo if these instructions are incomplete or proven wrong.

## Commands that were validated

Run from the repo root.

### Fastest safe validation path

1. `node src/cli.js --help`
2. `node src/cli.js --list-systems`
3. `npm test`

Observed:

- `node src/cli.js --help` works immediately
- `node src/cli.js --list-systems` works immediately and currently lists only `uswds`
- `npm test` passes without any install step and took about 0.1s in this environment

### Live scan commands that worked

Use these for smoke tests after scanner/report changes:

- Single-page, fastest live check:
  - `node src/cli.js --system uswds --json --no-assets https://designsystem.digital.gov/`
- Small crawl:
  - `node src/cli.js --system uswds --crawl --max-pages 2 --no-assets https://designsystem.digital.gov/`
- Snapshot save:
  - `node src/cli.js --system uswds --json --no-assets --save snapshots/copilot-sample.json https://designsystem.digital.gov/`
- Snapshot compare:
  - `node src/cli.js --system uswds --no-assets --compare snapshots/copilot-sample.json https://designsystem.digital.gov/`

Observed:

- `--no-assets` is the most reliable/fastest validation path for live scans; use it unless you are changing asset-fetch logic
- Single-page live scan took about 0.2s
- Two-page crawl took about 0.8s
- Snapshot compare worked against a saved snapshot in `snapshots/`

### Bootstrap/build/lint reality

- There is no build script
- There is no lint script
- There is no compile step
- The effective validation gate is `npm test`, plus any targeted CLI scan you ran for the changed behavior

## Command pitfalls and workarounds

- Always prefer `npm test` before exploring more; it is fast and is the CI gate
- Always use Node 24+ for real work and CI parity
- In this shell, `node -v` was `v18.20.8`; tests still passed, but `npm install` emitted an engine warning because `package.json` requires `>=24`
- `nvm use` was **not** available here (`command not found`), so do not assume `nvm` exists in every shell
- `npm install` is currently **not required** to run tests or the CLI because there are no dependencies, and it created an untracked `package-lock.json`; avoid running it unless you are intentionally changing package metadata or dependencies
- Live scan commands need network access; if they fail in a sandboxed environment, retry with the environment’s approved network mechanism rather than changing scanner code first

## Files and where to edit

Root:

- `README.md`: user-facing usage and workflow behavior
- `ACCESSIBILITY.md`: locked UI accessibility rules for Pages output
- `AGENTS.md`: repository-specific agent guidance
- `package.json`: scripts and engine requirement
- `.nvmrc`: pinned Node major version
- `.github/workflows/scan.yml`: CI, issue-triggered scans, Pages publishing, issue comments

Core source:

- `src/cli.js`: main entry point, argument parsing, `--crawl`, `--save`, `--compare`, `--json`
- `src/scanner.js`: fetch/crawl/extract/score pipeline; most scanner behavior changes belong here
- `src/reporters.js`: plain text and diff report formatting
- `src/snapshots.js`: save/load/diff of JSON snapshots
- `src/systems/index.js`: registry of design-system definitions
- `src/systems/uswds.js`: USWDS component/template tells and thresholds

Published Pages UI:

- `src/archive.js`: multi-run archive page at `/`, issue-linked archive rows, stable row anchors
- `src/dashboard.js`: dashboard page for `/latest/` and `/runs/<run-id>/`

Tests:

- `test/uswds-components.test.js`: official USWDS inventory + absent/partial/full fixtures
- `test/archive.test.js`: archive renderer regressions
- `test/dashboard.test.js`: dashboard renderer regressions

## CI and pre-checkin expectations

GitHub Actions workflow: `.github/workflows/scan.yml`

Important behavior:

- `test` job runs `npm test`
- `scan` job runs after tests pass
- `SCAN:` issues and reopened issues can trigger scans
- Issue titles/bodies can contain either full URLs or bare domains like `gsa.gov`
- Pages publishes:
  - `/` archive
  - `/latest/` newest run
  - `/runs/<run-id>/` immutable run page

Before finishing a change:

- Always run `npm test`
- If you changed scanner logic, run one targeted CLI scan
- If you changed report UI, keep `test/archive.test.js` and `test/dashboard.test.js` passing and update them if behavior changed
- If you changed workflow behavior, inspect `.github/workflows/scan.yml` carefully; issue comments and Pages links are easy to break

## Project-specific rules

- Prefer documented USWDS signals and keep the rules/tests aligned
- Preserve the distinction between `full`, `partial`, and `absent`
- Do not add hover-only `title` tooltips; follow `ACCESSIBILITY.md`
- For issue comments and report links, prefer exact/stable destinations over moving targets

# AGENTS.md

## Project overview

`design-system-scan` is a Node.js CLI and GitHub Actions workflow for scanning sites for design-system adoption across USWDS, VA.gov, the CMS Design System, GOV.UK, the NL Design System, the GC Design System, and KoliBri - Public UI.

The repo includes:

- a CLI scanner in [`src/cli.js`](/Users/mike.gifford/design-system-scan/src/cli.js)
- detection and crawl logic in [`src/scanner.js`](/Users/mike.gifford/design-system-scan/src/scanner.js)
- USWDS rules in [`src/systems/uswds.js`](/Users/mike.gifford/design-system-scan/src/systems/uswds.js)
- VA rules in [`src/systems/va.js`](/Users/mike.gifford/design-system-scan/src/systems/va.js)
- CMS rules in [`src/systems/cms.js`](/Users/mike.gifford/design-system-scan/src/systems/cms.js)
- GOV.UK rules in [`src/systems/govuk.js`](/Users/mike.gifford/design-system-scan/src/systems/govuk.js)
- NL Design System rules in [`src/systems/nlds.js`](/Users/mike.gifford/design-system-scan/src/systems/nlds.js)
- GC Design System rules in [`src/systems/gcds.js`](/Users/mike.gifford/design-system-scan/src/systems/gcds.js)
- KoliBri rules in [`src/systems/kolibri.js`](/Users/mike.gifford/design-system-scan/src/systems/kolibri.js)
- YAML semantic specs in [`data/design-system-specs/`](/Users/mike.gifford/design-system-scan/data/design-system-specs)
- GitHub Pages report renderers in [`src/archive.js`](/Users/mike.gifford/design-system-scan/src/archive.js) and [`src/dashboard.js`](/Users/mike.gifford/design-system-scan/src/dashboard.js)
- workflow automation in [`.github/workflows/scan.yml`](/Users/mike.gifford/design-system-scan/.github/workflows/scan.yml)

Read these first when working here:

- [`README.md`](/Users/mike.gifford/design-system-scan/README.md)
- [`ACCESSIBILITY.md`](/Users/mike.gifford/design-system-scan/ACCESSIBILITY.md)

AI disclosure is required in this project:

- Keep the AI disclosure section in [`README.md`](/Users/mike.gifford/design-system-scan/README.md) accurate and up to date.
- Only disclose AI tools or LLMs that are actually known to have been used.
- When AI meaningfully contributes to implementation, documentation, workflow logic, or generated project artifacts, update the README disclosure accordingly.

## Setup commands

- Use Node.js 24 or newer.
- Preferred local version switch: `nvm use`
- Install dependencies only if needed: `npm install`

## Common commands

- Run tests: `npm test`
- Run a sample auto-detect scan: `npm run scan -- https://designsystem.digital.gov/`
- Run a sample USWDS scan: `npm run scan:uswds -- https://designsystem.digital.gov/`
- Run a sample NL Design System scan: `npm run scan:nlds -- https://nldesignsystem.nl/`
- Run a sample GC Design System scan: `npm run scan:gcds -- https://design-system.canada.ca/`
- Run a sample KoliBri scan: `npm run scan:kolibri -- https://public-ui.github.io/`
- Scan with crawling: `node src/cli.js --system uswds --crawl --max-pages 20 https://example.gov/`
- Emit JSON only: `node src/cli.js --system uswds --json https://example.gov/`
- Validate live design-system inventories: `npm run validate:inventories`
- Review focused semantic specs for demos and forms in [`data/design-system-specs/`](/Users/mike.gifford/design-system-scan/data/design-system-specs)

## Testing instructions

- Run `npm test` after code changes.
- If you change report rendering, keep or expand the render-level tests in:
  - [`test/archive.test.js`](/Users/mike.gifford/design-system-scan/test/archive.test.js)
  - [`test/dashboard.test.js`](/Users/mike.gifford/design-system-scan/test/dashboard.test.js)
- If you change component rules, update the USWDS component tests in [`test/uswds-components.test.js`](/Users/mike.gifford/design-system-scan/test/uswds-components.test.js).
- Do not leave the repo with failing tests.

## Workflow notes

- `SCAN:` issues can trigger scans through [`.github/workflows/scan.yml`](/Users/mike.gifford/design-system-scan/.github/workflows/scan.yml).
- Issue titles or bodies may contain either full URLs or bare domains like `gsa.gov`.
- The workflow publishes:
  - `/` as the landing page
  - `/reports/` as the current reports index
  - `/reports/latest/` as the newest dashboard
  - `/reports/issues/issue-<n>/run-<run-id>/report.html` as the stable page for a specific issue-triggered run
  - `/archives/` as the long-term archive index
  - `/archives/issues/issue-<n>/<date>/report-package.zip` as the archived run package
- Issue comments should point people to the exact run page, archive entry, workflow run, and artifacts.

## Report UI guidance

- Treat the Pages UI as a product surface, not a throwaway report.
- Favor compact tables first, with deeper details available through modals or stable detail pages.
- For run-level details, prefer stable links over moving targets like `/latest/` when referencing a specific scan.
- Keep labels short and user-facing. Prefer `Date` over internal timestamps or implementation jargon.
- Keep the shared site header and footer consistent across landing, system, comparison, reports, archives, and dashboard pages.
- When updating system reference pages, preserve the published raw YAML spec links under `/specs/<system-id>.yaml`.

## Accessibility rules

Follow [`ACCESSIBILITY.md`](/Users/mike.gifford/design-system-scan/ACCESSIBILITY.md).

Important locked patterns:

- Do not use native `title` tooltips for user-facing help.
- Use accessible tooltip markup with `aria-describedby` and `role="tooltip"`.
- Keep dark mode and light mode both accessible.
- Respect `prefers-color-scheme`, `prefers-reduced-motion`, and `forced-colors`.
- Preserve visible focus indicators.

## Code style

- Prefer small, direct modules over framework-heavy abstractions.
- Keep output text human-readable and task-focused.
- Use semantic names for scan summaries and report labels.
- Avoid introducing dependencies unless they clearly simplify the project.

## When updating detection logic

- Preserve the distinction between:
  - full implementation evidence
  - partial implementation evidence
  - absence of evidence
- Prefer documented, stable tells from official design system docs.
- When changing component coverage or thresholds, keep the reasoning visible in the rules and tests.
- Keep the YAML semantic specs focused on structure and accessibility semantics, not exhaustive visual styling details.

## When updating issue comments or reports

- Link to exact destinations whenever possible.
- Avoid generic links that stop being correct after the next scan.
- Make the next user action obvious.
- Distinguish between current reports and archived packages in user-facing links and wording.
- If a scan fails because input is ambiguous, improve the workflow guidance or parser instead of only changing the error text.

## Commit guidance

- Keep commit messages short and descriptive.
- Group related changes together.
- If UI behavior changes, update tests and docs in the same change when possible.

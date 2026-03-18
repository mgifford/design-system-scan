# design-system-scan

`design-system-scan` is a rules-driven scanner for checking how closely a site appears to implement a design system.

The first included definition targets the [U.S. Web Design System](https://designsystem.digital.gov/) and is built to answer questions like:

- Is USWDS present at all?
- Which components look fully implemented vs partially implemented?
- Which external tells support that conclusion?
- Are there visible clues about which USWDS version is in use?

## What it does

The scanner evaluates each URL in three layers:

1. Site fingerprint
   It looks for broad tells such as `uswds.min.css`, `uswds.min.js`, `uswds-init`, the `usa-` class prefix, and common utility patterns.
2. Component detection
   It scores known components using weighted tells. For example, `usa-banner` alone suggests partial banner adoption, while `usa-banner` plus `usa-banner__header` and `usa-banner__content` is stronger evidence of a fuller implementation.
3. Version clues
   It searches page HTML, asset URLs, CSS, and JS for visible USWDS version strings.

This is heuristic, not a conformance validator. It helps surface evidence and likely alignment, not certify compliance.

It can now also:

- crawl a limited number of same-origin pages from a seed URL
- save JSON snapshots of scan results
- compare a new scan against an older snapshot to track drift over time

## Quick start

Requirements:

- Node.js 22+

Run against one or more URLs:

```bash
npm run scan:uswds -- https://designsystem.digital.gov/
```

Use a file of newline-delimited URLs:

```bash
node src/cli.js --system uswds --file urls.txt
```

Emit JSON for downstream analysis:

```bash
node src/cli.js --system uswds --json https://example.gov/
```

Run the rule tests:

```bash
npm test
```

Scan a site starting from one page:

```bash
node src/cli.js --system uswds --crawl --max-pages 20 https://example.gov/
```

Save a snapshot:

```bash
node src/cli.js --system uswds --crawl --max-pages 20 --save snapshots/example-2026-03-18.json https://example.gov/
```

Compare against an earlier snapshot:

```bash
node src/cli.js --system uswds --crawl --max-pages 20 --save snapshots/current.json --compare snapshots/previous.json https://example.gov/
```

## Example output

```text
U.S. Web Design System scan
Tracked definition: starter-2026-03
Docs: https://designsystem.digital.gov/

https://example.gov/
  Fingerprint: full (78%)
  Adoption: 6 full, 3 partial, 42% overall
  Version clues: 3.8.2
  Components:
    - Banner: full (100%) via usa-banner | usa-banner__header
    - Header and navigation: partial (57%) via usa-header | usa-nav
```

## Project structure

- [`ACCESSIBILITY.md`](/Users/mike.gifford/design-system-scan/ACCESSIBILITY.md): locked accessibility patterns for report UI behavior
- [`src/cli.js`](/Users/mike.gifford/design-system-scan/src/cli.js): command-line entrypoint
- [`src/scanner.js`](/Users/mike.gifford/design-system-scan/src/scanner.js): fetch, extract, score, and summarize pages
- [`src/snapshots.js`](/Users/mike.gifford/design-system-scan/src/snapshots.js): save, load, and diff scan snapshots
- [`src/systems/uswds.js`](/Users/mike.gifford/design-system-scan/src/systems/uswds.js): starter USWDS rule definition

## Maintaining the design system knowledge base

The long-term goal is to keep the rules under version control and update them as design systems evolve.

Recommended workflow:

1. Track each design system in its own file under `src/systems/`.
2. Add new component tells as stable markup, utility, token, or asset conventions become known.
3. Adjust weights and thresholds when false positives or false negatives show up in real scans.
4. Stamp each definition with a tracked revision like `starter-2026-03` so rule changes are visible over time.
5. Save raw JSON scan results if you want to compare the same site across months or against new rule versions.

Suggested snapshot convention:

- `snapshots/<system>/<hostname>/<yyyy-mm-dd>.json`

## GitHub Actions

This repo now includes a starter workflow at [`.github/workflows/scan.yml`](/Users/mike.gifford/design-system-scan/.github/workflows/scan.yml).

It supports:

- manual runs from the Actions tab using `workflow_dispatch`
- `SCAN:` issues opened or reopened, as long as a URL is present in the title or body
- weekday scheduled scans of `https://designsystem.digital.gov/`
- a weekly deeper scheduled scan of `https://designsystem.digital.gov/`
- `npm test` before the scan job runs
- uploaded artifacts containing both `scan.json` and a text `report.txt`
- publishing the latest run to GitHub Pages
- commenting on successful `SCAN:` issues with report links, then closing the issue

Once that workflow is pushed to GitHub, runs should appear at:

- [Actions](https://github.com/mgifford/design-system-scan/actions)

The first scheduled run depends on GitHub's scheduler, but you can trigger one immediately from the Actions tab after the workflow is on `main`.

### SCAN issue convention

To trigger a scan from an issue, open or reopen an issue whose title starts with `SCAN:`.

Example:

```text
Title: SCAN: https://example.gov/

Body:
system: uswds
crawl: true
max_pages: 10
```

Notes:

- The workflow uses the first URL it finds in the title or body.
- `system` defaults to `uswds`.
- `crawl` defaults to `true`.
- `max_pages` defaults to `10`.
- `pages:` and `number:` are also accepted as aliases for `max_pages:`.
- Non-`SCAN:` issues do not trigger the scan job.

### Why scores are below 100%

The text report now includes a short `missing:` line for components and templates when some expected tells were not found.

Example:

```text
- Accordion: full (89%) via usa-accordion | usa-accordion__button
  missing: Accordion heading
```

This helps distinguish:

- components that are clearly present but missing part of the documented structure
- components that are only partially implemented
- templates that match some component combinations but not the full expected layout

## Dashboard view

The GitHub Pages view is now intended to be a dashboard rather than a raw text dump.

It emphasizes:

- a compact summary table of scanned pages
- site-wide component and template summary tables
- expandable details per page for matched tells and missing tells

This is a better fit for scans that include many pages or many reviewed sites.

## Multi-scan archive

The Pages site now publishes:

- `/` as a cumulative archive of scans across runs
- `/latest/` as a dashboard for the most recent run
- `/history.json` as the cumulative machine-readable scan history

Each new successful run merges into the published archive so the site can scale beyond a single scan result.

## USWDS starter signals

The initial USWDS definition uses signals derived from official documentation, especially:

- [Documentation / Developers](https://designsystem.digital.gov/documentation/developers/)
- [Components overview](https://designsystem.digital.gov/components/overview/)
- [Design tokens](https://designsystem.digital.gov/design-tokens/)
- [Utilities](https://designsystem.digital.gov/utilities/)
- [Templates](https://designsystem.digital.gov/templates/)

The current component coverage includes:

- the full current official USWDS component inventory from the Components overview
- fixture-based `absent` / `partial` / `full` tests for every official component
- starter template detection for documentation pages, landing pages, 404 pages, authentication pages, and form templates

The test suite uses synthetic HTML fixtures that mirror live-site evidence like documented classes, attributes, and structure. It validates the scanner’s rule model, which is different from proving that any arbitrary site is semantically correct.

## Current limitations

- The crawler is intentionally lightweight and only follows same-origin HTML links from the seed pages.
- It only includes a starter USWDS definition today.
- It infers versions only when sites expose version strings in markup or assets.
- It does not yet auto-refresh design system definitions.

Those are good next steps once the starter scanner and rule model feel right.

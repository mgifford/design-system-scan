# design-system-scan

`design-system-scan` is a rules-driven scanner for checking how closely a site appears to implement a design system.

It now includes starter definitions for the [U.S. Web Design System](https://designsystem.digital.gov/), the [VA.gov Design System](https://design.va.gov/), the [CMS Design System](https://design.cms.gov/), the [GOV.UK Design System](https://design-system.service.gov.uk/), the [NL Design System](https://nldesignsystem.nl/), the [GC Design System](https://design-system.canada.ca/), and [KoliBri - Public UI](https://public-ui.github.io/), with auto-detection to determine which one better matches a submitted URL.

The scanner is built to answer questions like:

- Is USWDS present at all?
- Is the site more likely using USWDS, VA, CMS, GOV.UK, NLDS, GCDS, or KoliBri?
- Which components look fully implemented vs partially implemented?
- Which external tells support that conclusion?
- Are there visible clues about which USWDS version is in use?

## What it does

The scanner evaluates each URL in four layers:

1. Site fingerprint
   It looks for broad tells such as `uswds.min.css`, `uswds.min.js`, `uswds-init`, the `usa-` class prefix, the VA `va-` Web Component prefix, and other system-specific package or event markers.
2. Component detection
   It scores known components using weighted tells. For example, `usa-banner` alone suggests partial banner adoption, while `usa-banner` plus `usa-banner__header` and `usa-banner__content` is stronger evidence of a fuller implementation.
3. Design token detection
   It looks for system-specific CSS custom properties (design tokens) defined or consumed in inline styles and style blocks. Each system has its own token prefixes (for example `--uswds-color-`, `--govuk-colour-`, `--gcds-spacing-`), so a page using USWDS color tokens will not inadvertently score a GOV.UK result.
4. Version clues
   It searches page HTML, asset URLs, CSS, and JS for visible USWDS version strings.

This is heuristic, not a conformance validator. It helps surface evidence and likely alignment, not certify compliance.

It can now also:

- crawl a limited number of same-origin pages from a seed URL
- save JSON snapshots of scan results
- compare a new scan against an older snapshot to track drift over time

## Quick start

Requirements:

- Node.js 24+

Run against one or more URLs with auto-detection:

```bash
npm run scan -- https://designsystem.digital.gov/
```

Target USWDS explicitly:

```bash
npm run scan:uswds -- https://designsystem.digital.gov/
```

Target the VA Design System explicitly:

```bash
npm run scan:va -- https://design.va.gov/
```

Target the CMS Design System explicitly:

```bash
npm run scan:cms -- https://design.cms.gov/?theme=core
```

Target the GOV.UK Design System explicitly:

```bash
npm run scan:govuk -- https://design-system.service.gov.uk/
```

Target the NL Design System explicitly:

```bash
npm run scan:nlds -- https://nldesignsystem.nl/
```

Target the GC Design System explicitly:

```bash
npm run scan:gcds -- https://design-system.canada.ca/
```

Target KoliBri - Public UI explicitly:

```bash
npm run scan:kolibri -- https://public-ui.github.io/
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

## AI disclosure

Disclosure of AI use is important to this project.

### LLMs known to have been used

- OpenAI Codex / GPT-5-family coding agent
  - Used during project development to help design and implement code, workflows, tests, report UI changes, documentation, and structured design-system data maintained in this repository.

### AI use in the application at runtime

- No LLM is required to run `design-system-scan`.
- The scanner itself runs as deterministic Node.js code plus GitHub Actions workflow automation.
- Scan results are produced from rules, crawled content, and heuristic matching logic in this repository, not from a live model inference step.

### Browser-based or embedded AI

- No browser-based AI is enabled as part of the scanner or the published Pages reports.
- The GitHub Pages UI is static HTML, CSS, and JavaScript generated from repository code and scan artifacts.

### Scope note

- This section should list only AI tools that are known to have been used.
- AI tools that are not known to have been used should not be added speculatively.

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
- [`docs/design-system-component-matrix.md`](/Users/mike.gifford/design-system-scan/docs/design-system-component-matrix.md): cross-system semantic matrix and CMS theme comparison
- [`docs/design-system-semantic-specs.md`](/Users/mike.gifford/design-system-scan/docs/design-system-semantic-specs.md): how the YAML semantic specs support demo generation and cross-system review
- [`data/design-system-component-matrix.json`](/Users/mike.gifford/design-system-scan/data/design-system-component-matrix.json): machine-readable semantic component matrix
- [`data/design-systems/`](/Users/mike.gifford/design-system-scan/data/design-systems): official component inventories for each tracked design system
- [`data/design-system-specs/`](/Users/mike.gifford/design-system-scan/data/design-system-specs): focused YAML semantic specs for demo-friendly components and form patterns
- [`src/cli.js`](/Users/mike.gifford/design-system-scan/src/cli.js): command-line entrypoint
- [`src/scanner.js`](/Users/mike.gifford/design-system-scan/src/scanner.js): fetch, extract, score, and summarize pages
- [`src/snapshots.js`](/Users/mike.gifford/design-system-scan/src/snapshots.js): save, load, and diff scan snapshots
- [`src/systems/uswds.js`](/Users/mike.gifford/design-system-scan/src/systems/uswds.js): starter USWDS rule definition
- [`src/systems/va.js`](/Users/mike.gifford/design-system-scan/src/systems/va.js): starter VA rule definition
- [`src/systems/cms.js`](/Users/mike.gifford/design-system-scan/src/systems/cms.js): starter CMS Design System rule definition with child-theme detection
- [`src/systems/govuk.js`](/Users/mike.gifford/design-system-scan/src/systems/govuk.js): starter GOV.UK Design System rule definition
- [`src/systems/nlds.js`](/Users/mike.gifford/design-system-scan/src/systems/nlds.js): starter NL Design System rule definition
- [`src/systems/gcds.js`](/Users/mike.gifford/design-system-scan/src/systems/gcds.js): starter GC Design System rule definition
- [`src/systems/kolibri.js`](/Users/mike.gifford/design-system-scan/src/systems/kolibri.js): starter KoliBri - Public UI rule definition

## Maintaining the design system knowledge base

The long-term goal is to keep the rules under version control and update them as design systems evolve.

Recommended workflow:

1. Track each design system in its own file under `src/systems/`.
2. Add new component tells as stable markup, utility, token, or asset conventions become known.
3. Adjust weights and thresholds when false positives or false negatives show up in real scans.
4. Stamp each definition with a tracked revision like `starter-2026-03` so rule changes are visible over time.
5. Save raw JSON scan results if you want to compare the same site across months or against new rule versions.
6. Keep the YAML semantic spec for each design system focused on demo-critical component structure and accessibility expectations, especially for form patterns.

Suggested snapshot convention:

- `snapshots/<system>/<hostname>/<yyyy-mm-dd>.json`

## GitHub Actions

This repo now includes a starter workflow at [`.github/workflows/scan.yml`](/Users/mike.gifford/design-system-scan/.github/workflows/scan.yml).

It supports:

- manual runs from the Actions tab using `workflow_dispatch`
- `SCAN:` issues opened or reopened, as long as a URL is present in the title or body
- a separate `Scan submitted URLs` workflow to process already-open `SCAN:` issues
- weekday scheduled scans of `https://designsystem.digital.gov/`
- a weekly deeper scheduled scan of `https://designsystem.digital.gov/`
- a monthly `Validate design system inventories` workflow that compares the tracked design-system component inventories in this repo against the live upstream component overview pages
- `npm test` before the scan job runs
- uploaded artifacts containing both `scan.json` and a text `report.txt`
- publishing the latest run to GitHub Pages
- publishing stable Pages reports under `reports/issues/issue-<n>/run-<run-id>/`
- commenting on successful `SCAN:` issues with report links, then closing the issue

Once that workflow is pushed to GitHub, runs should appear at:

- [Actions](https://github.com/mgifford/design-system-scan/actions)

The first scheduled run depends on GitHub's scheduler, but you can trigger one immediately from the Actions tab after the workflow is on `main`.

### Monthly inventory validation

The repo also includes [`.github/workflows/validate-design-system-inventories.yml`](/Users/mike.gifford/design-system-scan/.github/workflows/validate-design-system-inventories.yml), which runs monthly and can also be triggered manually.

It checks the inventory JSON files under [`data/design-systems/`](/Users/mike.gifford/design-system-scan/data/design-systems) against the live component overview pages for:

- USWDS
- VA.gov
- CMS Design System
- GOV.UK
- NL Design System
- GC Design System
- KoliBri - Public UI

You can run the same check locally with:

```bash
npm run validate:inventories
```

The workflow uploads JSON and Markdown artifacts so definition drift can be reviewed and updated in this repo.

## Semantic YAML specs

The repo now also includes focused YAML semantic specs for each supported system under [`data/design-system-specs/`](/Users/mike.gifford/design-system-scan/data/design-system-specs).

These are intentionally narrower than the full inventory JSON files. They are meant to support:

- one-page demo sites for each design system
- AI-assisted interpretation of design-system instructions
- cross-system semantic comparison for common patterns like inputs, selects, validation, and buttons

They currently focus on demo-critical structure:

- system metadata
- demo focus areas
- canonical selectors or custom elements
- required elements and attributes
- accessibility expectations

The generated Pages site publishes these raw specs under `/specs/<system-id>.yaml`, and each system page links to its spec directly.
It also now publishes starter demo pages under `/demos/<system-id>/`, generated from those YAML specs for semantic review and testing. Where a system exposes stable official CDN assets, the demo can load those assets directly so the page more closely resembles the real design system; the CMS demo now does this with the documented CMS CDN CSS and web-components bundle.

### SCAN issue convention

To trigger a scan from an issue, open or reopen an issue whose title starts with `SCAN:`.

Example:

```text
Title: SCAN: https://example.gov/

Body:
system: uswds
crawl: true
max_pages: 100
```

Notes:

- The issue-triggered workflow scans all URLs it finds in the title and body.
- `system` defaults to `auto`.
- `crawl` defaults to `true`.
- `max_pages` defaults to `100` for workflow-triggered scans.
- If an issue contains more than `100` accepted URLs and no explicit page limit is provided, the workflow uses the accepted URL count as the fallback cap instead of `100`.
- `pages:` and `number:` are also accepted as aliases for `max_pages:`.
- Non-`SCAN:` issues do not trigger the scan job.
- Already-open `SCAN:` issues can be dispatched by the separate `Scan submitted URLs` workflow.

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
- modal details per page for matched tells and missing tells
- a summary header with date, linked trigger, detected system, proposed version, theme, and crawl counts

This is a better fit for scans that include many pages or many reviewed sites.

## Pages structure

The Pages site now publishes:

- `/` as a lightweight landing page that links into the scan reports
- `/comparison/` as the design-system comparison page
- `/systems/<id>/` as per-system reference pages with indexed component inventories
- `/reports/` as the current reports index, showing the latest report per trigger from roughly the last month
- `/reports/latest/` as a dashboard for the most recent run
- `/reports/history.json` as the cumulative machine-readable scan history
- `/reports/issues/issue-<n>/run-<run-id>/report.html` as the stable issue-specific HTML report
- `/reports/issues/issue-<n>/run-<run-id>/report.md` as the Markdown report
- `/reports/issues/issue-<n>/run-<run-id>/report.csv` as the page summary CSV
- `/reports/issues/issue-<n>/run-<run-id>/report.json` as the per-run JSON summary
- `/archives/` as the long-term archive index for older runs
- `/archives/issues/issue-<n>/<date>/report-package.zip` as the archived ZIP package for an issue-triggered run

Each new successful run merges into the published history. The current reports index stays focused on recent latest-per-trigger results, while older runs remain available through the archive packages.

## Design token detection

The scanner looks for design tokens through three signal types for each token group:

1. A CSS external-asset regex that matches the token prefix inside linked stylesheets (weight 2).
2. An HTML regex that matches a token being defined as a CSS custom property, for example `:root { --uswds-color-primary: … }` (weight 2).
3. An HTML regex that matches a token being consumed via `var()`, for example `color: var(--uswds-color-primary)` (weight 1).

Thresholds are `full` at 0.55 and `partial` at 0.35. A token group is scored `absent` if none of the signals match.

Token prefixes are system-specific, so GCDS token usage will not score a USWDS result and vice versa.

### Token groups by system

| System | Token group | CSS custom property prefix | Token docs |
| --- | --- | --- | --- |
| USWDS | Color tokens | `--uswds-color-` | [Design tokens – color](https://designsystem.digital.gov/design-tokens/color/overview/) |
| USWDS | Typography tokens | `--uswds-font-` | [Design tokens – typography](https://designsystem.digital.gov/design-tokens/typesetting/overview/) |
| USWDS | Spacing tokens | `--uswds-spacing-` | [Design tokens – spacing](https://designsystem.digital.gov/design-tokens/spacing-units/) |
| USWDS | Theme override tokens | `--uswds-theme-` | [Design tokens – settings](https://designsystem.digital.gov/documentation/settings/) |
| VA.gov | Color tokens | `--vads-color-` | [VA Design System tokens](https://design.va.gov/foundation/color-palette) |
| VA.gov | Typography tokens | `--vads-font-` | [VA Design System typography](https://design.va.gov/foundation/typography) |
| VA.gov | Spacing tokens | `--vads-spacing-` | [VA Design System spacing](https://design.va.gov/foundation/spacing-units) |
| CMS | Color tokens | `--cmsgov-color-` | [CMSDS design tokens](https://design.cms.gov/design-tokens/) |
| CMS | Typography tokens | `--cmsgov-font-` | [CMSDS design tokens](https://design.cms.gov/design-tokens/) |
| CMS | Spacing tokens | `--cmsgov-spacing-` | [CMSDS design tokens](https://design.cms.gov/design-tokens/) |
| GOV.UK | Colour tokens¹ | `--govuk-colour-` | [GOV.UK Frontend variables](https://frontend.design-system.service.gov.uk/sass-api-reference/) |
| GOV.UK | Typography tokens | `--govuk-font-` | [GOV.UK Frontend variables](https://frontend.design-system.service.gov.uk/sass-api-reference/) |
| GOV.UK | Spacing tokens | `--govuk-spacing-` | [GOV.UK Frontend variables](https://frontend.design-system.service.gov.uk/sass-api-reference/) |
| NL Design System | Color tokens | `--nl-color-` | [NLDS design tokens](https://nldesignsystem.nl/richtlijnen/stijl/design-tokens/) |
| NL Design System | Typography tokens | `--nl-typography-` | [NLDS design tokens](https://nldesignsystem.nl/richtlijnen/stijl/design-tokens/) |
| NL Design System | Spacing tokens | `--nl-space-` | [NLDS design tokens](https://nldesignsystem.nl/richtlijnen/stijl/design-tokens/) |
| GC Design System | Color tokens | `--gcds-color-` | [GCDS tokens](https://design-system.canada.ca/en/styles/design-tokens/) |
| GC Design System | Typography tokens | `--gcds-font-` | [GCDS tokens](https://design-system.canada.ca/en/styles/design-tokens/) |
| GC Design System | Spacing tokens | `--gcds-spacing-` | [GCDS tokens](https://design-system.canada.ca/en/styles/design-tokens/) |
| KoliBri | Color tokens | `--kol-color-` | [KoliBri theming](https://public-ui.github.io/docs/concepts/theming) |
| KoliBri | Typography tokens | `--kol-font-` | [KoliBri theming](https://public-ui.github.io/docs/concepts/theming) |
| KoliBri | Border tokens | `--kol-border-` | [KoliBri theming](https://public-ui.github.io/docs/concepts/theming) |

Token detection results appear in the plain-text report under `Design tokens:` per page and in the site-wide summary under `Site-wide token tells:`.

To see token results in JSON output:

```bash
node src/cli.js --system uswds --json https://designsystem.digital.gov/
```

¹ GOV.UK uses British English (`colour`) in its official CSS custom property names and token group id.

Token groups appear in each page result under the `tokens` array, and in the site-wide summary under `siteSummary.tokens`.

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
- design token detection for color, typography, spacing, and theme tokens

The test suite uses synthetic HTML fixtures that mirror live-site evidence like documented classes, attributes, and structure. It validates the scanner’s rule model, which is different from proving that any arbitrary site is semantically correct.

## VA.gov starter signals

The initial VA definition is optimized around the official Web Components guidance and distinctive `va-` custom elements.
It includes design token detection for `--vads-color-`, `--vads-font-`, and `--vads-spacing-` prefixes.

## CMS Design System starter signals

The CMS definition is optimized around the official `ds-*` Web Components, the `@cmsgov/*` package family, and theme-specific CDN assets.

As of March 18, 2026, the public docs expose four theme contexts in the switcher:

- `Core`
- `CMS.gov`
- `HealthCare.gov`
- `Medicare.gov`

The scanner treats this as one CMS design-system family with child-theme detection, so it can report both:

- whether a site appears to use CMSDS at all
- which theme is the strongest match based on package imports, theme CSS, CDN paths, and theme-specific header/footer components

## GOV.UK starter signals

The GOV.UK definition is optimized around the official `govuk-` class prefix, `govuk-frontend`, and the standard `data-module` hooks used by GOV.UK Frontend.
It includes design token detection for `--govuk-colour-`, `--govuk-font-`, and `--govuk-spacing-` prefixes.

The repo now also tracks machine-readable component inventories for each design system under [data/design-systems/](/Users/mike.gifford/design-system-scan/data/design-systems), so all official component sets can be indexed separately from current scanner coverage.

The starter coverage currently prioritizes:

- VA Web Component fingerprinting
- core components like Alert, Button, Modal, Breadcrumbs, Accordion, and the Official Gov banner
- auto-detection alongside USWDS so a submitted URL can be compared against both systems

## Current limitations

- The crawler is intentionally lightweight and only follows same-origin HTML links from the seed pages.
- It only includes a starter USWDS definition today.
- It infers versions only when sites expose version strings in markup or assets.
- It does not yet auto-refresh design system definitions.

Those are good next steps once the starter scanner and rule model feel right.

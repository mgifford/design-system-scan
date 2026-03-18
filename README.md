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

## Quick start

Requirements:

- Node.js 18+

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

- [`src/cli.js`](/Users/mike.gifford/design-system-scan/src/cli.js): command-line entrypoint
- [`src/scanner.js`](/Users/mike.gifford/design-system-scan/src/scanner.js): fetch, extract, score, and summarize pages
- [`src/systems/uswds.js`](/Users/mike.gifford/design-system-scan/src/systems/uswds.js): starter USWDS rule definition

## Maintaining the design system knowledge base

The long-term goal is to keep the rules under version control and update them as design systems evolve.

Recommended workflow:

1. Track each design system in its own file under `src/systems/`.
2. Add new component tells as stable markup, utility, token, or asset conventions become known.
3. Adjust weights and thresholds when false positives or false negatives show up in real scans.
4. Stamp each definition with a tracked revision like `starter-2026-03` so rule changes are visible over time.
5. Save raw JSON scan results if you want to compare the same site across months or against new rule versions.

## USWDS starter signals

The initial USWDS definition uses signals derived from official documentation, especially:

- [Documentation / Developers](https://designsystem.digital.gov/documentation/developers/)
- [Components overview](https://designsystem.digital.gov/components/overview/)
- [Design tokens](https://designsystem.digital.gov/design-tokens/)
- [Utilities](https://designsystem.digital.gov/utilities/)
- [Templates](https://designsystem.digital.gov/templates/)

The current component coverage includes:

- Banner
- Accordion
- Header and navigation
- Footer
- Identifier
- Buttons
- Alert
- Breadcrumb
- Search
- Form controls
- Table
- Modal
- Pagination
- Card
- Collection
- Tag
- Skipnav

## Current limitations

- It scans the URLs you provide, but it does not crawl an entire domain yet.
- It only includes a starter USWDS definition today.
- It infers versions only when sites expose version strings in markup or assets.
- It does not yet diff historical scans or auto-refresh design system definitions.

Those are good next steps once the starter scanner and rule model feel right.

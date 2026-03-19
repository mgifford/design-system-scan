# Accessibility Guardrails

This file locks in the accessibility patterns used by the published report UI in this repository.

It applies to:

- the GitHub Pages archive view generated from [`src/archive.js`](/Users/mike.gifford/design-system-scan/src/archive.js)
- the latest-run dashboard generated from [`src/dashboard.js`](/Users/mike.gifford/design-system-scan/src/dashboard.js)
- future UI additions to reports, dashboards, filters, dialogs, and helper text

## Core rule

Accessibility requirements are product requirements. New UI work in this repo should follow documented patterns instead of introducing one-off behavior.

## Locked patterns

### Anchor links

Use the accessible anchor-link pattern described in:

- [Anchor Links Accessibility Best Practices](https://mgifford.github.io/ACCESSIBILITY.md/examples/ANCHOR_LINKS_ACCESSIBILITY_BEST_PRACTICES.html)

Requirements for this repo:

- Heading anchors must link to real heading `id` values.
- The anchor target must remain keyboard-focusable and visible on focus.
- Anchor links must have an accessible name that explains what section they link to.
- Avoid injecting anchor links that replace the heading itself or make the heading text harder to read.
- Show anchor affordances on hover and keyboard focus rather than leaving them permanently prominent.

Current implementation:

- landing, reports, archives, system, comparison, and report headings in [`src/archive.js`](/Users/mike.gifford/design-system-scan/src/archive.js)
- latest dashboard headings in [`src/dashboard.js`](/Users/mike.gifford/design-system-scan/src/dashboard.js)

### Tooltips

Use the accessible tooltip pattern described in:

- [Tooltip Accessibility Best Practices](https://github.com/mgifford/ACCESSIBILITY.md/blob/main/examples/TOOLTIP_ACCESSIBILITY_BEST_PRACTICES.md)

Requirements for this repo:

- Do not rely on the native `title` attribute for user-facing help text.
- Use `aria-describedby` on the trigger and `role="tooltip"` on the tooltip content.
- Tooltips must work on both hover and keyboard focus.
- `Escape` must dismiss a visible tooltip without moving focus.
- Tooltips must remain visible when the pointer moves from the trigger onto the tooltip.
- Tooltip content must be supplementary only, not essential instructions.
- Tooltip content must not contain interactive controls.

Current implementation:

- archive date/time tooltips in [`src/archive.js`](/Users/mike.gifford/design-system-scan/src/archive.js)

### Light and dark mode

Use the accessible theme pattern described in:

- [Light/Dark Mode Accessibility Best Practices](https://github.com/mgifford/ACCESSIBILITY.md/blob/main/examples/LIGHT_DARK_MODE_ACCESSIBILITY_BEST_PRACTICES.md)

Requirements for this repo:

- Default to the user’s system preference via `prefers-color-scheme`.
- Allow a manual light/dark override.
- Persist the manual override with `localStorage`.
- Keep visible focus indicators in all supported themes.
- Ensure tables, badges, dialogs, and links remain readable in both modes.
- Support `forced-colors: active`.
- Avoid hard-coded one-off colors when a theme token should be used instead.
- Keep zebra striping subtle and relative to the page background.
- Respect `prefers-reduced-motion` for theme transitions.

Current implementation:

- archive theme support in [`src/archive.js`](/Users/mike.gifford/design-system-scan/src/archive.js)
- dashboard theme support in [`src/dashboard.js`](/Users/mike.gifford/design-system-scan/src/dashboard.js)

## Required checks for report UI changes

When changing the generated Pages UI, verify:

- keyboard navigation still works end to end
- focus indicators remain visible
- tooltip markup still uses `aria-describedby` and `role="tooltip"`
- no new `title=`-only help patterns were introduced
- heading anchor links still have accessible names and stable `id` targets
- light mode remains readable
- dark mode remains readable
- forced-colors mode has usable borders and controls
- tests still pass with `npm test`

## Tests that protect these patterns

- [`test/archive.test.js`](/Users/mike.gifford/design-system-scan/test/archive.test.js)
- [`test/dashboard.test.js`](/Users/mike.gifford/design-system-scan/test/dashboard.test.js)

Add or update render-level tests when accessibility behavior changes.

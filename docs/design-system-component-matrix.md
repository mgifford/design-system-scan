# Design system component matrix

This is the current scanner-facing comparison grid for the design systems tracked in this repository.

It is intentionally scoped to what the scanner knows how to detect today, not the full official inventory of each design system.

Legend:

- `Y`: direct component support in the current scanner definition
- `~`: semantic equivalent or adjacent pattern, but not a direct one-to-one component match
- `N`: not currently represented in the scanner definition

## Current system coverage

| System | Current scanner support |
| --- | --- |
| USWDS | Broad starter coverage across the official component inventory |
| VA.gov Design System | Starter coverage focused on distinctive Web Components and high-signal patterns |
| CMS Design System | Starter coverage focused on `ds-*` Web Components, package/CDN fingerprints, and child-theme detection |

## Cross-system semantic grid

| Semantic family | USWDS | VA | CMSDS | Notes |
| --- | --- | --- | --- | --- |
| Official government banner | Y | Y | Y | Strong convergence. Each system has a clear government-banner pattern. |
| Accordion / disclosure | Y | Y | Y | Strong convergence. |
| Alert / notification | Y | Y | Y | Strong convergence. |
| Button / primary action | Y | Y | Y | Strong convergence. |
| Modal / dialog | Y | Y | Y | Strong convergence, though CMS names this `Dialog`. |
| Breadcrumbs | Y | Y | N | USWDS and VA align closely here. |
| Header / global navigation | Y | N | Y | CMS currently models theme-specific headers. |
| Footer / site footer | Y | N | Y | CMS currently models theme-specific footers. |
| Tooltip / inline help | Y | N | Y | Emerging convergence. |
| Choice controls | Y | N | Y | Semantics align, but CMS collapses several input patterns into `Choice`. |
| Select / dropdown | Y | N | Y | Same semantic role, different implementation granularity. |
| Date input | Y | N | Y | Same semantic role, different implementation granularity. |
| Badge / tag / status label | ~ | N | Y | USWDS `Tag` is semantically adjacent to CMS `Badge`. |

## Where convergence is strongest

The clearest common pattern across the currently tracked systems is:

1. Official government banner
2. Accordion
3. Alert
4. Button
5. Modal/dialog

Those five areas are the best candidates for a shared semantic taxonomy because all three tracked systems already express them directly.

The next tier of convergence is partial:

1. Breadcrumbs are aligned between USWDS and VA.
2. Header and footer are aligned between USWDS and CMS.
3. Tooltip/help patterns are aligned between USWDS and CMS.
4. Form controls align semantically, but not at the same level of component granularity.

## CMS theme matrix

The CMS Design System is best treated as one component family with multiple theme contexts.

As of March 18, 2026, the public docs expose four theme contexts:

- `Core`
- `CMS.gov`
- `HealthCare.gov`
- `Medicare.gov`

The scanner currently treats the theme as a second layer of detection inside CMSDS.

| CMS semantic family | Core | CMS.gov | HealthCare.gov | Medicare.gov | Notes |
| --- | --- | --- | --- | --- | --- |
| Shared CMSDS package and component family | Y | Y | Y | Y | All four themes are part of one package family. |
| Official government banner | Y | Y | Y | Y | Modeled via `USA Banner` and theme/package tells. |
| Accordion | Y | Y | Y | Y | Shared component family. |
| Alert | Y | Y | Y | Y | Shared component family. |
| Button | Y | Y | Y | Y | Shared component family. |
| Choice / form option | Y | Y | Y | Y | Shared component family. |
| Dropdown | Y | Y | Y | Y | Shared component family. |
| Date field | Y | Y | Y | Y | Shared component family. |
| Dialog | Y | Y | Y | Y | Shared component family. |
| Help drawer | Y | Y | Y | Y | Shared component family. |
| Hint | Y | Y | Y | Y | Shared component family. |
| Tooltip | Y | Y | Y | Y | Shared component family. |
| Header | N | N | Y | Y | Currently modeled as theme-specific site chrome. |
| Footer | N | N | Y | Y | Currently modeled as theme-specific site chrome. |

## CMS theme takeaways

The CMS themes do not currently look like fully separate component systems. They look more like:

1. One shared component platform
2. Theme-specific packaging and styles
3. Theme-specific site chrome, especially headers and footers

That means the most useful semantic model for CMS is:

1. Detect CMSDS as the parent system
2. Detect the strongest theme match
3. Treat headers, footers, logos, and a few branded components as theme-specific variants
4. Treat the rest of the interaction patterns as shared CMS semantics

## Recommended semantic taxonomy for future systems

These are the semantic families most worth normalizing as new design systems are added:

1. Official government banner
2. Disclosure / accordion
3. Notification / alert
4. Button / primary action
5. Modal / dialog
6. Breadcrumbs
7. Header / global navigation
8. Footer / site footer
9. Tooltip / inline help
10. Choice controls
11. Select / dropdown
12. Date input
13. Badge / tag / status label

## Important limitations

1. This matrix describes the scanner-supported inventory today.
2. USWDS is much more complete than VA and CMS at the moment.
3. VA and CMS should still be expanded toward their full official component inventories.
4. Some semantic matches are intentionally broad because different systems split the same user need into different component shapes.

## Sources

- [USWDS components overview](https://designsystem.digital.gov/components/overview/)
- [VA.gov Design System](https://design.va.gov/)
- [CMS Design System introduction](https://design.cms.gov/?theme=core)
- [CMS For developers](https://design.cms.gov/getting-started/for-developers/?theme=medicare)
- [CMS components overview](https://design.cms.gov/components/overview/)
- [CMS component analytics](https://design.cms.gov/components/analytics/?theme=cmsgov)

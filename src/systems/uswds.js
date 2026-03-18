export const uswds = {
  id: "uswds",
  name: "U.S. Web Design System",
  version: "starter-2026-03",
  homepage: "https://designsystem.digital.gov/",
  docs: [
    "https://designsystem.digital.gov/documentation/developers/",
    "https://designsystem.digital.gov/components/overview/",
    "https://designsystem.digital.gov/design-tokens/",
    "https://designsystem.digital.gov/utilities/",
    "https://designsystem.digital.gov/templates/",
    "https://designsystem.digital.gov/website-standards/",
    "https://designsystem.digital.gov/design-principles/",
  ],
  siteFingerprint: {
    thresholds: {
      full: 0.6,
      partial: 0.25,
    },
    signals: [
      {
        label: "Compiled USWDS stylesheet",
        type: "asset-substring",
        pattern: "uswds.min.css",
        weight: 3,
      },
      {
        label: "Compiled USWDS script",
        type: "asset-substring",
        pattern: "uswds.min.js",
        weight: 3,
      },
      {
        label: "USWDS initializer",
        type: "asset-substring",
        pattern: "uswds-init",
        weight: 2,
      },
      {
        label: "USWDS class prefix",
        type: "class-prefix",
        pattern: "usa-",
        weight: 3,
      },
      {
        label: "USWDS utility spacing class",
        type: "class-regex",
        pattern: "^(margin|padding)-[a-z-]+-\\d+$",
        weight: 2,
      },
      {
        label: "USWDS grid utility",
        type: "class-regex",
        pattern: "^(grid-|tablet:grid-|desktop:grid-)",
        weight: 2,
      },
      {
        label: "USWDS color utility",
        type: "class-regex",
        pattern: "^(bg|text|border)-[a-z-]+$",
        weight: 1,
      },
      {
        label: "USWDS source marker",
        type: "text-substring",
        pattern: "@uswds/uswds",
        weight: 1,
      },
    ],
  },
  components: [
    {
      id: "banner",
      name: "Banner",
      signals: [
        { label: "Banner block", type: "class-exact", pattern: "usa-banner", weight: 3 },
        {
          label: "Banner header element",
          type: "class-exact",
          pattern: "usa-banner__header",
          weight: 2,
        },
        {
          label: "Banner content element",
          type: "class-exact",
          pattern: "usa-banner__content",
          weight: 2,
        },
      ],
    },
    {
      id: "accordion",
      name: "Accordion",
      signals: [
        { label: "Accordion block", type: "class-exact", pattern: "usa-accordion", weight: 3 },
        {
          label: "Accordion button",
          type: "class-exact",
          pattern: "usa-accordion__button",
          weight: 2,
        },
        {
          label: "Accordion content",
          type: "class-exact",
          pattern: "usa-accordion__content",
          weight: 2,
        },
      ],
    },
    {
      id: "header",
      name: "Header and navigation",
      signals: [
        { label: "Header block", type: "class-exact", pattern: "usa-header", weight: 3 },
        { label: "Nav block", type: "class-exact", pattern: "usa-nav", weight: 2 },
        { label: "Navbar", type: "class-exact", pattern: "usa-navbar", weight: 1 },
        { label: "Menu button", type: "class-exact", pattern: "usa-menu-btn", weight: 1 },
      ],
    },
    {
      id: "footer",
      name: "Footer",
      signals: [
        { label: "Footer block", type: "class-exact", pattern: "usa-footer", weight: 3 },
        {
          label: "Primary footer section",
          type: "class-exact",
          pattern: "usa-footer__primary-section",
          weight: 2,
        },
        {
          label: "Secondary footer section",
          type: "class-exact",
          pattern: "usa-footer__secondary-section",
          weight: 2,
        },
      ],
    },
    {
      id: "identifier",
      name: "Identifier",
      signals: [
        {
          label: "Identifier block",
          type: "class-exact",
          pattern: "usa-identifier",
          weight: 3,
        },
        {
          label: "Identifier masthead",
          type: "class-exact",
          pattern: "usa-identifier__masthead",
          weight: 2,
        },
        {
          label: "Identifier required links",
          type: "class-exact",
          pattern: "usa-identifier__required-links-list",
          weight: 1,
        },
      ],
    },
    {
      id: "button",
      name: "Buttons",
      signals: [
        { label: "Button class", type: "class-exact", pattern: "usa-button", weight: 3 },
        {
          label: "Secondary button modifier",
          type: "class-exact",
          pattern: "usa-button--secondary",
          weight: 1,
        },
        {
          label: "Outline button modifier",
          type: "class-exact",
          pattern: "usa-button--outline",
          weight: 1,
        },
      ],
    },
    {
      id: "alert",
      name: "Alert",
      signals: [
        { label: "Alert class", type: "class-exact", pattern: "usa-alert", weight: 3 },
        {
          label: "Alert body",
          type: "class-exact",
          pattern: "usa-alert__body",
          weight: 2,
        },
        {
          label: "Alert variants",
          type: "class-regex",
          pattern: "^usa-alert--",
          weight: 1,
        },
      ],
    },
    {
      id: "breadcrumb",
      name: "Breadcrumb",
      signals: [
        { label: "Breadcrumb block", type: "class-exact", pattern: "usa-breadcrumb", weight: 3 },
        {
          label: "Breadcrumb list",
          type: "class-exact",
          pattern: "usa-breadcrumb__list",
          weight: 2,
        },
        {
          label: "Breadcrumb current page",
          type: "class-exact",
          pattern: "usa-current",
          weight: 1,
        },
      ],
    },
    {
      id: "search",
      name: "Search",
      signals: [
        { label: "Search block", type: "class-exact", pattern: "usa-search", weight: 3 },
        {
          label: "Search submit text",
          type: "class-exact",
          pattern: "usa-search__submit-text",
          weight: 1,
        },
        {
          label: "Search small modifier",
          type: "class-exact",
          pattern: "usa-search--small",
          weight: 1,
        },
      ],
    },
    {
      id: "form-controls",
      name: "Form controls",
      signals: [
        { label: "Input", type: "class-exact", pattern: "usa-input", weight: 2 },
        { label: "Select", type: "class-exact", pattern: "usa-select", weight: 2 },
        { label: "Checkbox", type: "class-exact", pattern: "usa-checkbox", weight: 1 },
        { label: "Radio", type: "class-exact", pattern: "usa-radio", weight: 1 },
        { label: "Form group", type: "class-exact", pattern: "usa-form-group", weight: 1 },
      ],
    },
    {
      id: "table",
      name: "Table",
      signals: [
        { label: "Table", type: "class-exact", pattern: "usa-table", weight: 3 },
        {
          label: "Borderless table",
          type: "class-exact",
          pattern: "usa-table--borderless",
          weight: 1,
        },
        {
          label: "Stacked header table",
          type: "class-exact",
          pattern: "usa-table--stacked-header",
          weight: 1,
        },
      ],
    },
    {
      id: "modal",
      name: "Modal",
      signals: [
        { label: "Modal", type: "class-exact", pattern: "usa-modal", weight: 3 },
        {
          label: "Modal overlay",
          type: "class-exact",
          pattern: "usa-modal-wrapper",
          weight: 1,
        },
        {
          label: "Modal trigger attribute",
          type: "html-regex",
          pattern: "data-open-modal=",
          weight: 1,
        },
      ],
    },
    {
      id: "pagination",
      name: "Pagination",
      signals: [
        { label: "Pagination", type: "class-exact", pattern: "usa-pagination", weight: 3 },
        {
          label: "Pagination list",
          type: "class-exact",
          pattern: "usa-pagination__list",
          weight: 1,
        },
        {
          label: "Current page item",
          type: "class-exact",
          pattern: "usa-current-page",
          weight: 1,
        },
      ],
    },
    {
      id: "card",
      name: "Card",
      signals: [
        { label: "Card", type: "class-exact", pattern: "usa-card", weight: 3 },
        { label: "Card group", type: "class-exact", pattern: "usa-card-group", weight: 1 },
        {
          label: "Card header",
          type: "class-exact",
          pattern: "usa-card__header",
          weight: 1,
        },
      ],
    },
    {
      id: "collection",
      name: "Collection",
      signals: [
        { label: "Collection", type: "class-exact", pattern: "usa-collection", weight: 3 },
        {
          label: "Collection item",
          type: "class-exact",
          pattern: "usa-collection__item",
          weight: 1,
        },
        {
          label: "Collection heading",
          type: "class-exact",
          pattern: "usa-collection__heading",
          weight: 1,
        },
      ],
    },
    {
      id: "tag",
      name: "Tag",
      signals: [
        { label: "Tag", type: "class-exact", pattern: "usa-tag", weight: 3 },
        { label: "Big tag", type: "class-exact", pattern: "usa-tag--big", weight: 1 },
      ],
    },
    {
      id: "skipnav",
      name: "Skipnav",
      signals: [
        { label: "Skipnav", type: "class-exact", pattern: "usa-skipnav", weight: 3 },
      ],
    },
  ],
  maintenance: {
    notes: [
      "This starter definition focuses on stable, externally detectable tells from official USWDS markup and asset conventions.",
      "The implementation status is heuristic: full means a strong set of expected signals matched, partial means some markers were found, absent means no meaningful evidence was found.",
      "Version detection is opportunistic and depends on visible asset URLs or embedded version strings.",
    ],
  },
};

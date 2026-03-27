function signal(type, label, pattern, weight = 1) {
  return { type, label, pattern, weight };
}

function component(id, name, signals, thresholds) {
  return { id, name, signals, ...(thresholds ? { thresholds } : {}) };
}

function exactTag(label, pattern, weight = 1) {
  return signal("tag-exact", label, pattern, weight);
}

function exactClass(label, pattern, weight = 1) {
  return signal("class-exact", label, pattern, weight);
}

function tagPrefix(label, pattern, weight = 1) {
  return signal("tag-prefix", label, pattern, weight);
}

function assetSubstring(label, pattern, weight = 1) {
  return signal("asset-substring", label, pattern, weight);
}

function htmlRegex(label, pattern, weight = 1) {
  return signal("html-regex", label, pattern, weight);
}

function textSubstring(label, pattern, weight = 1) {
  return signal("text-substring", label, pattern, weight);
}

const components = [
  component("breadcrumbs", "Breadcrumbs", [
    exactTag("Breadcrumbs tag", "gcds-breadcrumbs", 3),
  ]),
  component("button", "Button", [
    exactTag("Button tag", "gcds-button", 3),
    exactClass("Button utility class", "gcds-button", 1),
  ]),
  component("checkboxes", "Checkboxes", [
    exactTag("Checkboxes tag", "gcds-checkboxes", 3),
  ]),
  component("details", "Details", [
    exactTag("Details tag", "gcds-details", 3),
  ]),
  component("error-message", "Error message", [
    exactTag("Error message tag", "gcds-error-message", 3),
  ]),
  component("error-summary", "Error summary", [
    exactTag("Error summary tag", "gcds-error-summary", 3),
  ]),
  component("fieldset", "Fieldset", [
    exactTag("Fieldset tag", "gcds-fieldset", 3),
  ]),
  component("file-uploader", "File uploader", [
    exactTag("File uploader tag", "gcds-file-uploader", 3),
  ]),
  component("footer", "GC footer", [
    exactTag("Footer tag", "gcds-footer", 3),
  ]),
  component("grid", "Grid", [
    exactTag("Grid tag", "gcds-grid", 3),
    exactClass("Grid class", "gcds-grid", 1),
  ]),
  component("header", "GC header", [
    exactTag("Header tag", "gcds-header", 3),
  ]),
  component("icon", "Icon", [
    exactTag("Icon tag", "gcds-icon", 3),
  ]),
  component("input", "Input", [
    exactTag("Input tag", "gcds-input", 3),
  ]),
  component("lang-toggle", "Language toggle", [
    exactTag("Language toggle tag", "gcds-lang-toggle", 3),
  ]),
  component("link", "Link", [
    exactTag("Link tag", "gcds-link", 3),
  ]),
  component("notice", "Notice", [
    exactTag("Notice tag", "gcds-notice", 3),
  ]),
  component("pagination", "Pagination", [
    exactTag("Pagination tag", "gcds-pagination", 3),
  ]),
  component("radio-group", "Radio group", [
    exactTag("Radio group tag", "gcds-radio-group", 3),
  ]),
  component("search", "Search", [
    exactTag("Search tag", "gcds-search", 3),
  ]),
  component("select", "Select", [
    exactTag("Select tag", "gcds-select", 3),
  ]),
  component("side-nav", "Side navigation", [
    exactTag("Side nav tag", "gcds-side-nav", 3),
  ]),
  component("signature", "GC signature", [
    exactTag("Signature tag", "gcds-signature", 3),
  ]),
  component("step-indicator", "Step indicator", [
    exactTag("Step indicator tag", "gcds-step-indicator", 3),
  ]),
  component("textarea", "Text area", [
    exactTag("Text area tag", "gcds-textarea", 3),
  ]),
  component("theme-and-topic-menu", "Theme and topic menu", [
    exactTag("Theme and topic menu tag", "gcds-topic-menu", 3),
  ]),
  component("top-nav", "Top navigation", [
    exactTag("Top nav tag", "gcds-top-nav", 3),
  ]),
];

const tokens = [
  component(
    "color-tokens",
    "Color design tokens",
    [
      signal("css-regex", "GCDS color token in CSS", "--gcds-color-", 2),
      htmlRegex("GCDS color token defined", "--gcds-color-[a-z0-9][a-z0-9-]*\\s*:", 2),
      htmlRegex("GCDS color token used", "var\\(--gcds-color-", 1),
    ],
    { full: 0.55, partial: 0.35 }
  ),
  component(
    "typography-tokens",
    "Typography design tokens",
    [
      signal("css-regex", "GCDS font token in CSS", "--gcds-font-", 2),
      htmlRegex("GCDS font token defined", "--gcds-font-[a-z0-9][a-z0-9-]*\\s*:", 2),
      htmlRegex("GCDS font token used", "var\\(--gcds-font-", 1),
    ],
    { full: 0.55, partial: 0.35 }
  ),
  component(
    "spacing-tokens",
    "Spacing design tokens",
    [
      signal("css-regex", "GCDS spacing token in CSS", "--gcds-spacing-", 2),
      htmlRegex("GCDS spacing token defined", "--gcds-spacing-[a-z0-9][a-z0-9-]*\\s*:", 2),
      htmlRegex("GCDS spacing token used", "var\\(--gcds-spacing-", 1),
    ],
    { full: 0.55, partial: 0.35 }
  ),
];

export const gcds = {
  id: "gcds",
  name: "GC Design System",
  version: "starter-2026-03",
  homepage: "https://design-system.canada.ca/",
  docs: [
    "https://design-system.canada.ca/",
    "https://design-system.canada.ca/en/components/",
    "https://design-system.canada.ca/en/start-to-use/",
    "https://design-system.canada.ca/en/components/details/",
  ],
  siteFingerprint: {
    thresholds: {
      full: 0.55,
      partial: 0.2,
    },
    signals: [
      tagPrefix("GCDS web component prefix", "gcds-", 4),
      htmlRegex("GCDS custom element markup", "<gcds-[a-z0-9-]+\\b", 3),
      textSubstring("GC Design System package", "@cdssnc/gcds-components", 3),
      assetSubstring("GC Design System asset", "gcds-components", 3),
      textSubstring("GC Design System text", "GC Design System", 1),
      textSubstring("Government of Canada design system text", "Government of Canada", 1),
    ],
  },
  components,
  templates: [],
  tokens,
  maintenance: {
    notes: [
      "GC Design System provides production-ready, framework-agnostic web components for Government of Canada services.",
      "Starter detection prioritizes distinctive gcds-* custom elements and package references from the official docs.",
      "Coverage currently focuses on the highest-signal official components and can be expanded against live GC implementations over time.",
    ],
  },
};

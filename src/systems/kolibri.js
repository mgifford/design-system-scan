function signal(type, label, pattern, weight = 1) {
  return { type, label, pattern, weight };
}

function component(id, name, signals, thresholds) {
  return { id, name, signals, ...(thresholds ? { thresholds } : {}) };
}

function exactTag(label, pattern, weight = 1) {
  return signal("tag-exact", label, pattern, weight);
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
  component("accordion", "Accordion", [exactTag("Accordion tag", "kol-accordion", 3)]),
  component("alert", "Alert", [exactTag("Alert tag", "kol-alert", 3)]),
  component("badge", "Badge", [exactTag("Badge tag", "kol-badge", 3)]),
  component("breadcrumb", "Breadcrumb", [exactTag("Breadcrumb tag", "kol-breadcrumb", 3)]),
  component("button", "Button", [exactTag("Button tag", "kol-button", 3)]),
  component("card", "Card", [exactTag("Card tag", "kol-card", 3)]),
  component("combobox", "Combobox", [exactTag("Combobox tag", "kol-combobox", 3)]),
  component("details", "Details", [exactTag("Details tag", "kol-details", 3)]),
  component("drawer", "Drawer", [exactTag("Drawer tag", "kol-drawer", 3)]),
  component("form", "Form", [exactTag("Form tag", "kol-form", 3)]),
  component("link", "Link", [exactTag("Link tag", "kol-link", 3)]),
  component("modal", "Modal", [exactTag("Modal tag", "kol-modal", 3)]),
  component("nav", "Navigation", [exactTag("Navigation tag", "kol-nav", 3)]),
  component("pagination", "Pagination", [exactTag("Pagination tag", "kol-pagination", 3)]),
  component("popover", "Popover", [exactTag("Popover tag", "kol-popover", 3)]),
  component("select", "Select", [exactTag("Select tag", "kol-select", 3)]),
  component("single-select", "Single Select", [exactTag("Single select tag", "kol-single-select", 3)]),
  component("skip-nav", "Skip Navigation", [exactTag("Skip navigation tag", "kol-skip-nav", 3)]),
  component("split-button", "Split Button", [exactTag("Split button tag", "kol-split-button", 3)]),
  component("tabs", "Tabs", [exactTag("Tabs tag", "kol-tabs", 3)]),
  component("textarea", "Textarea", [exactTag("Textarea tag", "kol-textarea", 3)]),
  component("tooltip", "Tooltip", [exactTag("Tooltip tag", "kol-tooltip", 3)]),
  component("tree", "Tree", [
    exactTag("Tree tag", "kol-tree", 3),
    exactTag("Tree item tag", "kol-tree-item", 2),
  ]),
];

export const kolibri = {
  id: "kolibri",
  name: "KoliBri - Public UI",
  version: "starter-2026-03",
  homepage: "https://public-ui.github.io/",
  docs: [
    "https://public-ui.github.io/docs",
    "https://public-ui.github.io/docs/components",
    "https://public-ui.github.io/docs/get-started",
    "https://public-ui.github.io/docs/components/accordion",
  ],
  siteFingerprint: {
    thresholds: {
      full: 0.55,
      partial: 0.2,
    },
    signals: [
      tagPrefix("KoliBri web component prefix", "kol-", 4),
      htmlRegex("KoliBri custom element markup", "<kol-[a-z0-9-]+\\b", 3),
      textSubstring("Public UI package", "@public-ui/components", 3),
      textSubstring("Public UI loader", "@public-ui/components/loader", 2),
      assetSubstring("Public UI package asset", "@public-ui/", 2),
      textSubstring("KoliBri schema", "@public-ui/schema", 1),
      textSubstring("KoliBri project name", "KoliBri", 1),
      textSubstring("Public UI website reference", "public-ui.github.io", 1),
    ],
  },
  components,
  templates: [],
  tokens: [
    component(
      "color-tokens",
      "Color design tokens",
      [
        signal("css-regex", "KoliBri color token in CSS", "--kol-color-", 2),
        htmlRegex("KoliBri color token defined", "--kol-color-[a-z0-9-]+\\s*:", 2),
        htmlRegex("KoliBri color token used", "var\\(--kol-color-", 1),
      ],
      { full: 0.55, partial: 0.35 }
    ),
    component(
      "typography-tokens",
      "Typography design tokens",
      [
        signal("css-regex", "KoliBri font token in CSS", "--kol-font-", 2),
        htmlRegex("KoliBri font token defined", "--kol-font-[a-z0-9-]+\\s*:", 2),
        htmlRegex("KoliBri font token used", "var\\(--kol-font-", 1),
      ],
      { full: 0.55, partial: 0.35 }
    ),
    component(
      "border-tokens",
      "Border design tokens",
      [
        signal("css-regex", "KoliBri border token in CSS", "--kol-border-", 2),
        htmlRegex("KoliBri border token defined", "--kol-border-[a-z0-9-]+\\s*:", 2),
        htmlRegex("KoliBri border token used", "var\\(--kol-border-", 1),
      ],
      { full: 0.55, partial: 0.35 }
    ),
  ],
  maintenance: {
    notes: [
      "KoliBri - Public UI is the accessible public-sector web component library documented at public-ui.github.io and maintained by ITZBund.",
      "Starter detection currently prioritizes distinctive kol-* custom elements and @public-ui package references from the official docs.",
      "Coverage currently focuses on the highest-signal official components and can be expanded as more live KoliBri implementations are reviewed.",
    ],
  },
};

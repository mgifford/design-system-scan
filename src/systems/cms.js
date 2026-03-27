function signal(type, label, pattern, weight = 1) {
  return { type, label, pattern, weight };
}

function component(id, name, signals, thresholds) {
  return { id, name, signals, ...(thresholds ? { thresholds } : {}) };
}

function theme(id, name, signals, thresholds) {
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
  component("accordion", "Accordion", [
    exactTag("Accordion tag", "ds-accordion", 3),
    htmlRegex("Accordion heading prop", "heading=", 1),
    htmlRegex("Accordion content markup", "<ds-accordion\\b[^>]*>.*</ds-accordion>", 1),
  ]),
  component("alert", "Alert", [
    exactTag("Alert tag", "ds-alert", 3),
    htmlRegex("Alert variation prop", "(variation|weight)=", 1),
    textSubstring("Alert analytics config", "alertSendsAnalytics", 1),
  ]),
  component("autocomplete", "Autocomplete", [
    exactTag("Autocomplete tag", "ds-autocomplete", 3),
    htmlRegex("Autocomplete label prop", "label=", 1),
  ]),
  component("badge", "Badge", [
    exactTag("Badge tag", "ds-badge", 3),
    htmlRegex("Badge variation prop", "variation=", 1),
  ]),
  component("button", "Button", [
    exactTag("Button tag", "ds-button", 3),
    htmlRegex("Button variation prop", "variation=", 1),
    textSubstring("Button analytics config", "buttonSendsAnalytics", 1),
  ]),
  component("card", "Card", [
    exactTag("Card tag", "ds-card", 3),
    htmlRegex("Card heading prop", "heading=", 1),
  ]),
  component("checkbox", "Checkbox", [
    exactTag("Choice tag", "ds-choice", 2),
    htmlRegex("Checkbox type prop", "type=[\"']checkbox[\"']", 2),
    htmlRegex("Checkbox checked prop", "checked", 1),
  ]),
  component("single-input-date-field", "Single Input Date Field", [
    exactTag("Date field tag", "ds-date-field", 3),
    htmlRegex("Date field label", "label=", 1),
  ]),
  component("multi-input-date-field", "Multi Input Date Field", [
    exactTag("Date field tag", "ds-date-field", 2),
    htmlRegex("Multi-input date field type", "type=[\"']multi[\"']", 2),
    htmlRegex("Date field label", "label=", 1),
  ]),
  component("drawer-help-drawer", "Drawer & Help Drawer", [
    exactTag("Help drawer tag", "ds-help-drawer", 3),
    exactTag("Drawer tag", "ds-drawer", 3),
    textSubstring("Help drawer analytics config", "helpDrawerSendsAnalytics", 1),
  ]),
  component("modal-dialog", "Modal Dialog", [
    exactTag("Dialog tag", "ds-dialog", 2),
    exactTag("Modal dialog tag", "ds-modal-dialog", 3),
    htmlRegex("Dialog heading", "heading=", 1),
    textSubstring("Dialog analytics config", "dialogSendsAnalytics", 1),
  ]),
  component("dropdown", "Dropdown", [
    exactTag("Dropdown tag", "ds-dropdown", 3),
    htmlRegex("Dropdown label prop", "label=", 1),
    htmlRegex("Dropdown options", "<option\\b", 1),
  ]),
  component("filter-chip", "Filter Chip", [
    exactTag("Filter chip tag", "ds-filter-chip", 3),
    htmlRegex("Filter chip label prop", "label=", 1),
  ]),
  component("healthcare-footer", "Healthcare.gov Footer", [
    htmlRegex("Healthcare footer tag", "<ds-healthcare-gov-footer\\b", 3),
    textSubstring("Footer analytics config", "footerSendsAnalytics", 1),
  ]),
  component("medicare-footer", "Medicare.gov Footer", [
    htmlRegex("Medicare footer tag", "<ds-medicare-gov-footer\\b", 3),
    textSubstring("Footer analytics config", "footerSendsAnalytics", 1),
  ]),
  component("healthcare-header", "Healthcare.gov Header", [
    htmlRegex("Healthcare header tag", "<ds-healthcare-gov-header\\b", 3),
    textSubstring("Header analytics config", "headerSendsAnalytics", 1),
  ]),
  component("medicare-header", "Medicare.gov Header", [
    htmlRegex("Medicare header tag", "<ds-medicare-gov-header\\b", 3),
    textSubstring("Header analytics config", "headerSendsAnalytics", 1),
  ]),
  component("hint", "Hint", [
    exactTag("Hint tag", "ds-hint", 3),
    htmlRegex("Hint requirement prop", "requirement-label", 1),
  ]),
  component("icon", "Icon", [
    exactTag("Icon tag", "ds-icon", 3),
    htmlRegex("Icon name prop", "icon=", 1),
  ]),
  component("inline-error", "Inline Error", [
    exactTag("Inline error tag", "ds-inline-error", 3),
    htmlRegex("Inline error id prop", "id=", 1),
  ]),
  component("label-legend", "Label & Legend", [
    exactTag("Label tag", "ds-label", 2),
    exactTag("Legend tag", "ds-legend", 2),
  ]),
  component("month-picker", "Month Picker", [
    exactTag("Month picker tag", "ds-month-picker", 3),
    htmlRegex("Month picker label", "label=", 1),
  ]),
  component("note-box", "Note Box", [
    exactTag("Note box tag", "ds-note-box", 3),
    htmlRegex("Note box heading", "heading=", 1),
  ]),
  component("pagination", "Pagination", [
    exactTag("Pagination tag", "ds-pagination", 3),
    htmlRegex("Pagination current page", "current-page", 1),
  ]),
  component("radio-button", "Radio Button", [
    exactTag("Choice tag", "ds-choice", 2),
    htmlRegex("Radio type prop", "type=[\"']radio[\"']", 2),
    htmlRegex("Choice checked prop", "checked", 1),
  ]),
  component("review", "Review", [
    exactTag("Review tag", "ds-review", 3),
    htmlRegex("Review heading", "heading=", 1),
  ]),
  component("skip-nav", "Skip Nav", [
    exactTag("Skip nav tag", "ds-skip-nav", 3),
    htmlRegex("Skip nav href", "href=", 1),
  ]),
  component("spinner", "Spinner", [
    exactTag("Spinner tag", "ds-spinner", 3),
    htmlRegex("Spinner size prop", "size=", 1),
  ]),
  component("table", "Table", [
    exactTag("Table tag", "ds-table", 3),
    htmlRegex("Table head markup", "<thead\\b", 1),
  ]),
  component("tabs", "Tabs", [
    exactTag("Tabs tag", "ds-tabs", 3),
    htmlRegex("Tabs panel markup", "<ds-tab-panel\\b", 1),
  ]),
  component("text-field", "Text Field", [
    exactTag("Text field tag", "ds-text-field", 3),
    htmlRegex("Text field label prop", "label=", 1),
  ]),
  component("third-party-external-link", "Third Party External Link", [
    exactTag("Third-party external link tag", "ds-third-party-external-link", 3),
    htmlRegex("External link href", "href=", 1),
  ]),
  component("tooltip", "Tooltip", [
    exactTag("Tooltip tag", "ds-tooltip", 3),
    textSubstring("Tooltip analytics config", "tooltipSendsAnalytics", 1),
    textSubstring("Analytics event", "ds-analytics-event", 1),
  ]),
  component("usa-banner", "USA Banner", [
    exactTag("USA banner tag", "ds-usa-banner", 3),
    textSubstring("Banner utility text", "An official website of the United States government", 1),
  ]),
  component("vertical-navigation", "Vertical Navigation", [
    exactTag("Vertical navigation tag", "ds-vertical-nav", 3),
    htmlRegex("Vertical nav item tag", "<ds-vertical-nav-item\\b", 1),
  ]),
];

const themes = [
  theme("core", "Core", [
    assetSubstring("Core package asset", "/cdn/design-system/", 3),
    assetSubstring("Core theme stylesheet", "core-theme.css", 3),
    textSubstring("Core package import", "@cmsgov/design-system", 3),
  ]),
  theme("cmsgov", "CMS.gov", [
    assetSubstring("CMS.gov package asset", "/cdn/ds-cms-gov/", 3),
    assetSubstring("CMS.gov theme stylesheet", "cmsgov-theme.css", 3),
    textSubstring("CMS.gov package import", "@cmsgov/ds-cms-gov", 3),
    textSubstring("CMS.gov footer text", "Centers for Medicare & Medicaid Services", 1),
  ]),
  theme("healthcare", "HealthCare.gov", [
    assetSubstring("HealthCare.gov package asset", "/cdn/ds-healthcare-gov/", 3),
    assetSubstring("HealthCare.gov theme stylesheet", "healthcare-theme.css", 3),
    textSubstring("HealthCare.gov package import", "@cmsgov/ds-healthcare-gov", 3),
    htmlRegex("HealthCare.gov header tag", "<ds-healthcare-gov-header\\b", 2),
    htmlRegex("HealthCare.gov footer tag", "<ds-healthcare-gov-footer\\b", 2),
  ]),
  theme("medicare", "Medicare.gov", [
    assetSubstring("Medicare.gov package asset", "/cdn/ds-medicare-gov/", 3),
    assetSubstring("Medicare.gov theme stylesheet", "medicare-theme.css", 3),
    textSubstring("Medicare.gov package import", "@cmsgov/ds-medicare-gov", 3),
    htmlRegex("Medicare.gov header tag", "<ds-medicare-gov-header\\b", 2),
    htmlRegex("Medicare.gov footer tag", "<ds-medicare-gov-footer\\b", 2),
  ]),
];

export const cms = {
  id: "cms",
  name: "CMS Design System",
  version: "starter-2026-03",
  homepage: "https://design.cms.gov/",
  docs: [
    "https://design.cms.gov/",
    "https://design.cms.gov/getting-started/for-developers/?theme=core",
    "https://design.cms.gov/getting-started/child-design-systems/",
    "https://design.cms.gov/components/overview/",
    "https://design.cms.gov/components/analytics/?theme=cmsgov",
  ],
  siteFingerprint: {
    thresholds: {
      full: 0.55,
      partial: 0.2,
    },
    signals: [
      tagPrefix("CMSDS web component prefix", "ds-", 4),
      htmlRegex("CMSDS custom element markup", "<ds-[a-z0-9-]+\\b", 3),
      textSubstring("Core package import", "@cmsgov/design-system", 3),
      textSubstring("CMS.gov package import", "@cmsgov/ds-cms-gov", 3),
      textSubstring("HealthCare.gov package import", "@cmsgov/ds-healthcare-gov", 3),
      textSubstring("Medicare.gov package import", "@cmsgov/ds-medicare-gov", 3),
      assetSubstring("Core CDN asset", "/cdn/design-system/", 3),
      assetSubstring("CMS.gov CDN asset", "/cdn/ds-cms-gov/", 3),
      assetSubstring("HealthCare.gov CDN asset", "/cdn/ds-healthcare-gov/", 3),
      assetSubstring("Medicare.gov CDN asset", "/cdn/ds-medicare-gov/", 3),
      textSubstring("Web component analytics event", "ds-analytics-event", 1),
    ],
  },
  components,
  themes,
  templates: [],
  tokens: [
    component(
      "color-tokens",
      "Color design tokens",
      [
        signal("css-regex", "CMSDS color token in CSS", "--cmsgov-color-", 2),
        htmlRegex("CMSDS color token defined", "--cmsgov-color-[a-z0-9-]+\\s*:", 2),
        htmlRegex("CMSDS color token used", "var\\(--cmsgov-color-", 1),
      ],
      { full: 0.55, partial: 0.35 }
    ),
    component(
      "typography-tokens",
      "Typography design tokens",
      [
        signal("css-regex", "CMSDS font token in CSS", "--cmsgov-font-", 2),
        htmlRegex("CMSDS font token defined", "--cmsgov-font-[a-z0-9-]+\\s*:", 2),
        htmlRegex("CMSDS font token used", "var\\(--cmsgov-font-", 1),
      ],
      { full: 0.55, partial: 0.35 }
    ),
    component(
      "spacing-tokens",
      "Spacing design tokens",
      [
        signal("css-regex", "CMSDS spacing token in CSS", "--cmsgov-spacing-", 2),
        htmlRegex("CMSDS spacing token defined", "--cmsgov-spacing-[a-z0-9-]+\\s*:", 2),
        htmlRegex("CMSDS spacing token used", "var\\(--cmsgov-spacing-", 1),
      ],
      { full: 0.55, partial: 0.35 }
    ),
  ],
  maintenance: {
    notes: [
      "CMSDS is a family of design systems with a Core package plus CMS.gov, HealthCare.gov, and Medicare.gov child themes.",
      "Theme detection relies primarily on package imports and theme stylesheet/CDN paths because those are more stable than page copy.",
      "Many CMSDS implementations use ds-* web components, but some downstream sites may use React or Preact bindings with fewer custom-element tells.",
    ],
  },
};

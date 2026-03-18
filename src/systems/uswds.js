function signal(type, label, pattern, weight = 1) {
  return { type, label, pattern, weight };
}

function componentRef(label, componentId, minimumStatus = "partial", weight = 1) {
  return { type: "component-ref", label, componentId, minimumStatus, weight };
}

function component(id, name, signals, thresholds) {
  return { id, name, signals, ...(thresholds ? { thresholds } : {}) };
}

function exactClass(label, pattern, weight = 1) {
  return signal("class-exact", label, pattern, weight);
}

function classPrefix(label, pattern, weight = 1) {
  return signal("class-prefix", label, pattern, weight);
}

function classRegex(label, pattern, weight = 1) {
  return signal("class-regex", label, pattern, weight);
}

function htmlRegex(label, pattern, weight = 1) {
  return signal("html-regex", label, pattern, weight);
}

const officialComponents = [
  component("accordion", "Accordion", [
    exactClass("Accordion block", "usa-accordion", 3),
    exactClass("Accordion heading", "usa-accordion__heading", 1),
    exactClass("Accordion button", "usa-accordion__button", 2),
    exactClass("Accordion content", "usa-accordion__content", 2),
    htmlRegex(
      "Accordion button state",
      "class=[\"'][^\"']*usa-accordion__button[^\"']*[\"'][^>]*aria-(?:controls|expanded)=",
      1
    ),
  ]),
  component("alert", "Alert", [
    exactClass("Alert block", "usa-alert", 3),
    exactClass("Alert body", "usa-alert__body", 2),
    classRegex("Alert variant", "^usa-alert--", 1),
  ]),
  component("banner", "Banner", [
    exactClass("Banner block", "usa-banner", 3),
    exactClass("Banner header", "usa-banner__header", 2),
    exactClass("Banner content", "usa-banner__content", 2),
    exactClass("Banner button", "usa-banner__button", 1),
  ]),
  component("breadcrumb", "Breadcrumb", [
    exactClass("Breadcrumb block", "usa-breadcrumb", 3),
    exactClass("Breadcrumb list", "usa-breadcrumb__list", 2),
    exactClass("Breadcrumb item", "usa-breadcrumb__list-item", 1),
    exactClass("Breadcrumb link", "usa-breadcrumb__link", 1),
  ]),
  component("button", "Button", [
    exactClass("Button class", "usa-button", 3),
    classRegex("Button modifier", "^usa-button--", 1),
    htmlRegex("Explicit button type", "type=[\"']button[\"']", 1),
  ]),
  component("button-group", "Button group", [
    exactClass("Button group block", "usa-button-group", 3),
    exactClass("Button group item", "usa-button-group__item", 2),
    classRegex("Segmented variant", "^usa-button-group--", 1),
  ]),
  component("card", "Card", [
    exactClass("Card block", "usa-card", 3),
    exactClass("Card container", "usa-card__container", 1),
    exactClass("Card header", "usa-card__header", 1),
    exactClass("Card body", "usa-card__body", 1),
  ]),
  component("character-count", "Character count", [
    exactClass("Character count block", "usa-character-count", 3),
    exactClass("Character count field", "usa-character-count__field", 1),
    exactClass("Character count message", "usa-character-count__message", 2),
  ]),
  component("checkbox", "Checkbox", [
    exactClass("Checkbox block", "usa-checkbox", 3),
    exactClass("Checkbox input", "usa-checkbox__input", 2),
    exactClass("Checkbox label", "usa-checkbox__label", 2),
  ]),
  component("collection", "Collection", [
    exactClass("Collection block", "usa-collection", 3),
    exactClass("Collection item", "usa-collection__item", 1),
    exactClass("Collection heading", "usa-collection__heading", 1),
    exactClass("Collection body", "usa-collection__body", 1),
  ]),
  component("combo-box", "Combo box", [
    exactClass("Combo box block", "usa-combo-box", 3),
    htmlRegex("Combobox role", "role=[\"']combobox[\"']", 2),
    htmlRegex("Autocomplete attribute", "aria-autocomplete=", 1),
  ]),
  component("data-visualizations", "Data visualizations", [
    htmlRegex("Chart section id", "section-(?:bar|line)chart", 3),
    htmlRegex("Charting library", "highcharts", 2),
    exactClass("Chart prose wrapper", "usa-prose", 1),
  ]),
  component("date-picker", "Date picker", [
    exactClass("Date picker block", "usa-date-picker", 3),
    htmlRegex("Date picker input", "<input[^>]*>", 1),
    htmlRegex("Calendar button", "calendar", 1),
  ]),
  component("date-range-picker", "Date range picker", [
    exactClass("Date range picker block", "usa-date-range-picker", 3),
    exactClass("Nested date picker", "usa-date-picker", 2),
    htmlRegex("Date range inputs", "<input[^>]*>.*<input[^>]*>", 1),
  ]),
  component("file-input", "File input", [
    exactClass("File input block", "usa-file-input", 3),
    htmlRegex("File input type", "type=[\"']file[\"']", 2),
    exactClass("File input error", "usa-error-message", 1),
  ]),
  component("footer", "Footer", [
    exactClass("Footer block", "usa-footer", 3),
    exactClass("Footer primary section", "usa-footer__primary-section", 2),
    exactClass("Footer secondary section", "usa-footer__secondary-section", 2),
    classRegex("Footer variant", "^usa-footer--", 1),
  ]),
  component("form", "Form", [
    exactClass("Form block", "usa-form", 3),
    exactClass("Required hint", "usa-hint--required", 1),
    exactClass("Fieldset", "usa-fieldset", 1),
  ]),
  component("grid", "Grid", [
    exactClass("Grid row", "grid-row", 2),
    exactClass("Grid container", "grid-container", 2),
    classRegex("Grid columns", "^(grid-col|tablet:grid-col|desktop:grid-col)", 2),
  ]),
  component("header", "Header", [
    exactClass("Header block", "usa-header", 3),
    exactClass("Navbar", "usa-navbar", 1),
    exactClass("Primary nav", "usa-nav", 2),
    classRegex("Header variant", "^usa-header--", 1),
  ]),
  component("icon", "Icon", [
    exactClass("Icon block", "usa-icon", 3),
    classRegex("Icon size", "^usa-icon--size-", 2),
  ]),
  component("icon-list", "Icon list", [
    exactClass("Icon list block", "usa-icon-list", 3),
    exactClass("Icon list item", "usa-icon-list__item", 1),
    exactClass("Icon list icon", "usa-icon-list__icon", 1),
    exactClass("Icon list content", "usa-icon-list__content", 1),
  ]),
  component("identifier", "Identifier", [
    exactClass("Identifier block", "usa-identifier", 3),
    exactClass("Identifier masthead", "usa-identifier__section--masthead", 1),
    exactClass("Identifier required links", "usa-identifier__required-links-list", 2),
  ]),
  component("in-page-navigation", "In-page navigation", [
    exactClass("In-page navigation block", "usa-in-page-navigation", 3),
    exactClass("In-page nav component", "usa-in-page-nav", 2),
    exactClass("In-page nav container", "usa-in-page-nav-container", 1),
  ]),
  component("input-mask", "Input mask", [
    exactClass("Input mask block", "usa-input-mask", 3),
    htmlRegex("Masked input pattern", "pattern=", 1),
    exactClass("Form block", "usa-form", 1),
  ]),
  component("input-prefix-suffix", "Input prefix/suffix", [
    exactClass("Input prefix/suffix wrapper", "usa-input-prefix-suffix", 3),
    exactClass("Input group", "usa-input-group", 2),
    exactClass("Input prefix", "usa-input-prefix", 1),
    exactClass("Input suffix", "usa-input-suffix", 1),
  ]),
  component("language-selector", "Language selector", [
    exactClass("Language selector block", "usa-language-selector", 3),
    htmlRegex("Language option links", "hreflang=|lang=", 1),
    exactClass("Link styling", "usa-link", 1),
  ]),
  component("link", "Link", [
    exactClass("USWDS link", "usa-link", 3),
    classRegex("Link modifier", "^usa-link--", 1),
    htmlRegex("Link target or rel", "(target=|rel=)", 1),
  ]),
  component("list", "List", [
    exactClass("USWDS list", "usa-list", 3),
    exactClass("Unstyled list", "usa-list--unstyled", 1),
    htmlRegex("List role", "role=[\"']list[\"']", 1),
  ]),
  component("memorable-date", "Memorable date", [
    exactClass("Memorable date block", "usa-memorable-date", 3),
    exactClass("Select control", "usa-select", 1),
    classRegex("Date field grouping", "^usa-form-group--(month|day|year|select)$", 2),
  ]),
  component("modal", "Modal", [
    exactClass("Modal block", "usa-modal", 3),
    exactClass("Modal content", "usa-modal__content", 1),
    exactClass("Modal heading", "usa-modal__heading", 1),
    htmlRegex("Modal trigger", "data-open-modal=", 1),
  ]),
  component("pagination", "Pagination", [
    exactClass("Pagination block", "usa-pagination", 3),
    exactClass("Pagination list", "usa-pagination__list", 1),
    exactClass("Pagination item", "usa-pagination__item", 1),
    exactClass("Pagination link", "usa-pagination__link", 1),
  ]),
  component("process-list", "Process list", [
    exactClass("Process list block", "usa-process-list", 3),
    exactClass("Process list item", "usa-process-list__item", 2),
  ]),
  component("prose", "Prose", [
    exactClass("Prose block", "usa-prose", 3),
    classRegex("Readable measure utility", "^measure-", 1),
    htmlRegex("Paragraph content", "<p\\b", 1),
  ]),
  component("radio-buttons", "Radio buttons", [
    exactClass("Radio block", "usa-radio", 3),
    exactClass("Radio input", "usa-radio__input", 2),
    exactClass("Radio label", "usa-radio__label", 2),
  ]),
  component("range-slider", "Range slider", [
    exactClass("Range input", "usa-range", 3),
    htmlRegex("Range input type", "type=[\"']range[\"']", 2),
  ]),
  component("search", "Search", [
    exactClass("Search block", "usa-search", 3),
    exactClass("Search submit text", "usa-search__submit-text", 1),
    exactClass("Search submit icon", "usa-search__submit-icon", 1),
    classRegex("Search variant", "^usa-search--", 1),
  ]),
  component(
    "select",
    "Select",
    [
      exactClass("Select block", "usa-select", 3),
      htmlRegex("Select element", "<select\\b", 2),
      htmlRegex("Select options", "<option\\b", 1),
    ],
    { full: 0.95, partial: 0.3 }
  ),
  component("side-navigation", "Side navigation", [
    exactClass("Sidenav block", "usa-sidenav", 3),
    exactClass("Sidenav item", "usa-sidenav__item", 2),
    exactClass("Sidenav sublist", "usa-sidenav__sublist", 1),
  ]),
  component("site-alert", "Site alert", [
    exactClass("Site alert block", "usa-site-alert", 3),
    classRegex("Site alert variant", "^usa-site-alert--", 1),
    exactClass("Site alert prose", "usa-prose", 1),
  ]),
  component("step-indicator", "Step indicator", [
    exactClass("Step indicator block", "usa-step-indicator", 3),
    exactClass("Step indicator segment", "usa-step-indicator__segment", 2),
    exactClass("Step indicator heading", "usa-step-indicator__heading", 1),
  ]),
  component("summary-box", "Summary box", [
    exactClass("Summary box block", "usa-summary-box", 3),
    exactClass("Summary box heading", "usa-summary-box__heading", 2),
    exactClass("Summary box body", "usa-summary-box__body", 1),
  ]),
  component("table", "Table", [
    exactClass("Table block", "usa-table", 3),
    classRegex("Table modifier", "^usa-table--", 1),
    exactClass("Scrollable table container", "usa-table-container--scrollable", 1),
  ]),
  component("tag", "Tag", [
    exactClass("Tag block", "usa-tag", 3),
    classRegex("Tag modifier", "^usa-tag--", 1),
    htmlRegex("Tag label metadata", "aria-label=", 1),
  ]),
  component("text-input", "Text input", [
    exactClass("Text input", "usa-input", 3),
    exactClass("Textarea", "usa-textarea", 1),
    classRegex("Input validation state", "^usa-input--", 1),
  ]),
  component("time-picker", "Time picker", [
    exactClass("Time picker block", "usa-time-picker", 3),
    htmlRegex("Time picker input", "<input\\b", 1),
    htmlRegex("Time input", "type=[\"']time[\"']", 1),
  ]),
  component("tooltip", "Tooltip", [
    exactClass("Tooltip block", "usa-tooltip", 3),
    htmlRegex("Tooltip association", "aria-describedby=", 1),
    htmlRegex("Tooltip role", "role=[\"']tooltip[\"']", 1),
  ]),
  component("typography", "Typography", [
    exactClass("Alt heading", "usa-heading-alt", 2),
    exactClass("Prose block", "usa-prose", 2),
    classRegex("Measure utility", "^measure-", 1),
  ]),
  component("validation", "Validation", [
    exactClass("Validation block", "usa-validation", 3),
    exactClass("Validation alert", "usa-alert--validation", 2),
    exactClass("Validation checklist", "usa-checklist", 2),
    exactClass("Validation checklist item", "usa-checklist__item", 1),
  ]),
];

const templates = [
  component(
    "landing-page",
    "Landing page",
    [
      htmlRegex("Hero section", "usa-hero", 3),
      htmlRegex("Graphic list", "usa-graphic-list", 2),
      componentRef("Header present", "header", "partial", 1),
      componentRef("Footer present", "footer", "partial", 1),
    ],
    { full: 0.75, partial: 0.5 }
  ),
  component(
    "documentation-page",
    "Documentation page",
    [
      componentRef("Side navigation present", "side-navigation", "partial", 3),
      classRegex("Documentation layout", "^usa-layout-docs", 2),
      componentRef("Header present", "header", "partial", 1),
      componentRef("Footer present", "footer", "partial", 1),
    ],
    { full: 0.75, partial: 0.5 }
  ),
  component(
    "404-page",
    "404 page",
    [
      htmlRegex("404 title or heading", "(<title>[^<]*404|<h1[^>]*>\\s*404\\b)", 3),
      componentRef("Button group present", "button-group", "partial", 2),
      componentRef("Header present", "header", "partial", 1),
      componentRef("Footer present", "footer", "partial", 1),
      componentRef("Identifier present", "identifier", "partial", 1),
    ],
    { full: 0.75, partial: 0.5 }
  ),
  component(
    "authentication-pages",
    "Authentication pages",
    [
      exactClass("Password reveal control", "usa-show-password", 3),
      componentRef("Form present", "form", "partial", 2),
      componentRef("Text input present", "text-input", "partial", 1),
      componentRef("Header present", "header", "partial", 1),
    ],
    { full: 0.75, partial: 0.5 }
  ),
  component(
    "form-templates",
    "Form templates",
    [
      componentRef("Form present", "form", "partial", 3),
      componentRef("Text input present", "text-input", "partial", 1),
      componentRef("Select present", "select", "partial", 1),
      componentRef("Validation present", "validation", "partial", 1),
    ],
    { full: 0.75, partial: 0.5 }
  ),
];

export const uswds = {
  id: "uswds",
  name: "U.S. Web Design System",
  version: "starter-2026-03",
  homepage: "https://designsystem.digital.gov/",
  docs: [
    "https://designsystem.digital.gov/documentation/developers/",
    "https://designsystem.digital.gov/components/overview/",
    "https://designsystem.digital.gov/components/accordion/",
    "https://designsystem.digital.gov/templates/",
    "https://designsystem.digital.gov/design-tokens/",
    "https://designsystem.digital.gov/utilities/",
  ],
  siteFingerprint: {
    thresholds: {
      full: 0.6,
      partial: 0.25,
    },
    signals: [
      signal("asset-substring", "Compiled USWDS stylesheet", "uswds.min.css", 3),
      signal("asset-substring", "Compiled USWDS script", "uswds.min.js", 3),
      signal("asset-substring", "USWDS initializer", "uswds-init", 2),
      classPrefix("USWDS class prefix", "usa-", 3),
      classRegex("USWDS spacing utility", "^(margin|padding)-[a-z-]+-\\d+$", 2),
      classRegex("USWDS grid utility", "^(grid-|tablet:grid-|desktop:grid-)", 2),
      classRegex("USWDS color utility", "^(bg|text|border)-[a-z-]+$", 1),
      signal("text-substring", "USWDS source marker", "@uswds/uswds", 1),
    ],
  },
  components: officialComponents,
  templates,
  maintenance: {
    notes: [
      "The component list follows the current official USWDS Components overview.",
      "Detection is heuristic and optimized for live-site evidence such as documented classes, attributes, and structural relationships.",
      "Some components expose stronger live-site tells than others; tests verify the rule model rather than claiming full conformance.",
    ],
  },
};

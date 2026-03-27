function signal(type, label, pattern, weight = 1) {
  return { type, label, pattern, weight };
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
    exactClass("Accordion block", "govuk-accordion", 3),
    exactClass("Accordion section button", "govuk-accordion__section-button", 1),
    htmlRegex("Accordion data module", "data-module=[\"']govuk-accordion[\"']", 1),
  ]),
  component("back-link", "Back link", [
    exactClass("Back link", "govuk-back-link", 3),
  ]),
  component("breadcrumbs", "Breadcrumbs", [
    exactClass("Breadcrumbs block", "govuk-breadcrumbs", 3),
    exactClass("Breadcrumbs list", "govuk-breadcrumbs__list", 1),
    exactClass("Breadcrumbs link", "govuk-breadcrumbs__link", 1),
  ]),
  component("button", "Button", [
    exactClass("Button block", "govuk-button", 3),
    classPrefix("Button modifier", "govuk-button--", 1),
    htmlRegex("Button data module", "data-module=[\"']govuk-button[\"']", 1),
  ]),
  component("character-count", "Character count", [
    exactClass("Character count block", "govuk-character-count", 3),
    htmlRegex("Character count data module", "data-module=[\"']govuk-character-count[\"']", 1),
  ]),
  component("checkboxes", "Checkboxes", [
    exactClass("Checkboxes block", "govuk-checkboxes", 3),
    exactClass("Checkbox input", "govuk-checkboxes__input", 1),
    exactClass("Checkbox item", "govuk-checkboxes__item", 1),
  ]),
  component("cookie-banner", "Cookie banner", [
    exactClass("Cookie banner block", "govuk-cookie-banner", 3),
    htmlRegex("Cookie banner data module", "data-module=[\"']govuk-cookie-banner[\"']", 1),
  ]),
  component("date-input", "Date input", [
    exactClass("Date input block", "govuk-date-input", 3),
    exactClass("Date input item", "govuk-date-input__item", 1),
    exactClass("Date input input", "govuk-date-input__input", 1),
  ]),
  component("details", "Details", [
    exactClass("Details block", "govuk-details", 3),
    exactClass("Details summary", "govuk-details__summary", 1),
    htmlRegex("Details data module", "data-module=[\"']govuk-details[\"']", 1),
  ]),
  component("error-message", "Error message", [
    exactClass("Error message block", "govuk-error-message", 3),
  ]),
  component("error-summary", "Error summary", [
    exactClass("Error summary block", "govuk-error-summary", 3),
    htmlRegex("Error summary data module", "data-module=[\"']govuk-error-summary[\"']", 1),
  ]),
  component("exit-this-page", "Exit this page", [
    exactClass("Exit this page block", "govuk-exit-this-page", 3),
    htmlRegex("Exit this page data module", "data-module=[\"']govuk-exit-this-page[\"']", 1),
  ]),
  component("fieldset", "Fieldset", [
    exactClass("Fieldset block", "govuk-fieldset", 3),
    exactClass("Fieldset legend", "govuk-fieldset__legend", 1),
  ]),
  component("file-upload", "File upload", [
    exactClass("File upload input", "govuk-file-upload", 3),
    htmlRegex("File input type", "type=[\"']file[\"']", 1),
  ]),
  component("footer", "GOV.UK footer", [
    exactClass("Footer block", "govuk-footer", 3),
    exactClass("Footer meta", "govuk-footer__meta", 1),
  ]),
  component("header", "GOV.UK header", [
    exactClass("Header block", "govuk-header", 3),
    exactClass("Header service name", "govuk-header__service-name", 1),
    exactClass("Header navigation", "govuk-header__navigation", 1),
  ]),
  component("inset-text", "Inset text", [
    exactClass("Inset text block", "govuk-inset-text", 3),
  ]),
  component("notification-banner", "Notification banner", [
    exactClass("Notification banner block", "govuk-notification-banner", 3),
    exactClass("Notification banner title", "govuk-notification-banner__title", 1),
  ]),
  component("pagination", "Pagination", [
    exactClass("Pagination block", "govuk-pagination", 3),
    exactClass("Pagination item", "govuk-pagination__item", 1),
  ]),
  component("panel", "Panel", [
    exactClass("Panel block", "govuk-panel", 3),
    exactClass("Panel title", "govuk-panel__title", 1),
  ]),
  component("password-input", "Password input", [
    exactClass("Password input wrapper", "govuk-password-input", 3),
    htmlRegex("Password input data module", "data-module=[\"']govuk-password-input[\"']", 1),
  ]),
  component("phase-banner", "Phase banner", [
    exactClass("Phase banner block", "govuk-phase-banner", 3),
    exactClass("Phase banner content", "govuk-phase-banner__content", 1),
  ]),
  component("radios", "Radios", [
    exactClass("Radios block", "govuk-radios", 3),
    exactClass("Radio input", "govuk-radios__input", 1),
    exactClass("Radio item", "govuk-radios__item", 1),
  ]),
  component("select", "Select", [
    exactClass("Select block", "govuk-select", 3),
    htmlRegex("Select element", "<select\\b", 1),
  ]),
  component("service-navigation", "Service navigation", [
    exactClass("Service navigation block", "govuk-service-navigation", 3),
    htmlRegex("Service navigation data module", "data-module=[\"']govuk-service-navigation[\"']", 1),
  ]),
  component("skip-link", "Skip link", [
    exactClass("Skip link", "govuk-skip-link", 3),
  ]),
  component("summary-list", "Summary list", [
    exactClass("Summary list block", "govuk-summary-list", 3),
    exactClass("Summary list row", "govuk-summary-list__row", 1),
  ]),
  component("table", "Table", [
    exactClass("Table block", "govuk-table", 3),
    exactClass("Table row", "govuk-table__row", 1),
  ]),
  component("tabs", "Tabs", [
    exactClass("Tabs block", "govuk-tabs", 3),
    htmlRegex("Tabs data module", "data-module=[\"']govuk-tabs[\"']", 1),
    exactClass("Tabs list", "govuk-tabs__list", 1),
  ]),
  component("tag", "Tag", [
    exactClass("Tag block", "govuk-tag", 3),
  ]),
  component("task-list", "Task list", [
    exactClass("Task list block", "govuk-task-list", 3),
    exactClass("Task list item", "govuk-task-list__item", 1),
  ]),
  component("text-input", "Text input", [
    exactClass("Input block", "govuk-input", 3),
    classPrefix("Input width modifier", "govuk-input--", 1),
  ]),
  component("textarea", "Textarea", [
    exactClass("Textarea block", "govuk-textarea", 3),
  ]),
  component("warning-text", "Warning text", [
    exactClass("Warning text block", "govuk-warning-text", 3),
    exactClass("Warning text icon", "govuk-warning-text__icon", 1),
  ]),
];

export const govuk = {
  id: "govuk",
  name: "GOV.UK Design System",
  version: "starter-2026-03",
  homepage: "https://design-system.service.gov.uk/",
  docs: [
    "https://design-system.service.gov.uk/",
    "https://design-system.service.gov.uk/components/",
    "https://design-system.service.gov.uk/components/accordion/",
    "https://design-system.service.gov.uk/components/button/",
  ],
  siteFingerprint: {
    thresholds: {
      full: 0.55,
      partial: 0.2,
    },
    signals: [
      classPrefix("GOV.UK class prefix", "govuk-", 4),
      textSubstring("GOV.UK Frontend package", "govuk-frontend", 3),
      assetSubstring("GOV.UK Frontend asset", "govuk-frontend", 3),
      htmlRegex("GOV.UK data module", "data-module=[\"']govuk-[a-z0-9-]+[\"']", 2),
      textSubstring("GOV.UK Frontend namespace", "GOVUKFrontend", 2),
      textSubstring("GOV.UK Design System text", "GOV.UK Design System", 1),
    ],
  },
  components,
  templates: [],
  tokens: [
    component(
      "colour-tokens",
      "Colour design tokens",
      [
        signal("css-regex", "GOV.UK colour token in CSS", "--govuk-colour-", 2),
        htmlRegex("GOV.UK colour token defined", "--govuk-colour-[a-z0-9-]+\\s*:", 2),
        htmlRegex("GOV.UK colour token used", "var\\(--govuk-colour-", 1),
      ],
      { full: 0.55, partial: 0.35 }
    ),
    component(
      "typography-tokens",
      "Typography design tokens",
      [
        signal("css-regex", "GOV.UK font token in CSS", "--govuk-font-", 2),
        htmlRegex("GOV.UK font token defined", "--govuk-font-[a-z0-9-]+\\s*:", 2),
        htmlRegex("GOV.UK font token used", "var\\(--govuk-font-", 1),
      ],
      { full: 0.55, partial: 0.35 }
    ),
    component(
      "spacing-tokens",
      "Spacing design tokens",
      [
        signal("css-regex", "GOV.UK spacing token in CSS", "--govuk-spacing-", 2),
        htmlRegex("GOV.UK spacing token defined", "--govuk-spacing-[a-z0-9-]+\\s*:", 2),
        htmlRegex("GOV.UK spacing token used", "var\\(--govuk-spacing-", 1),
      ],
      { full: 0.55, partial: 0.35 }
    ),
  ],
  maintenance: {
    notes: [
      "The GOV.UK Design System is usually implemented via GOV.UK Frontend and uses a consistent govuk- class prefix.",
      "Starter detection prioritizes distinctive component blocks and data-module attributes from the official component guidance.",
      "This definition currently focuses on the official component inventory rather than patterns and page templates.",
    ],
  },
};

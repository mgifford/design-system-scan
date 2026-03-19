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

function exactTag(label, pattern, weight = 1) {
  return signal("tag-exact", label, pattern, weight);
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
  component("alert", "Alert", [
    exactClass("Alert class", "nl-alert", 3),
    exactTag("Alert custom element", "nl-alert", 2),
  ]),
  component("alert-dialog", "Alert Dialog", [
    exactClass("Alert dialog class", "nl-alert-dialog", 3),
    exactTag("Alert dialog custom element", "nl-alert-dialog", 2),
  ]),
  component("breadcrumb-navigation", "Breadcrumb Navigation", [
    exactClass("Breadcrumb navigation class", "nl-breadcrumb-navigation", 3),
    htmlRegex("Breadcrumb landmark", "<nav\\b[^>]*aria-label=[\"'][^\"']*breadcrumb", 1),
  ]),
  component("button", "Button", [
    exactClass("Button class", "nl-button", 3),
    exactTag("Button custom element", "nl-button", 2),
    classPrefix("Button modifier", "nl-button--", 1),
  ]),
  component("checkbox", "Checkbox", [
    exactClass("Checkbox class", "nl-checkbox", 3),
    exactTag("Checkbox custom element", "nl-checkbox", 2),
  ]),
  component("checkbox-group", "Checkbox Group", [
    exactClass("Checkbox group class", "nl-checkbox-group", 3),
  ]),
  component("dialog", "Dialog", [
    exactClass("Dialog class", "nl-dialog", 3),
    exactTag("Dialog custom element", "nl-dialog", 2),
  ]),
  component("form-field", "Form Field", [
    exactClass("Form field class", "nl-form-field", 3),
    classPrefix("Form field part", "nl-form-field__", 1),
  ]),
  component("link", "Link", [
    exactClass("Link class", "nl-link", 3),
    exactTag("Link custom element", "nl-link", 2),
  ]),
  component("modal-dialog", "Modal Dialog", [
    exactClass("Modal dialog class", "nl-modal-dialog", 3),
    exactTag("Modal dialog custom element", "nl-modal-dialog", 2),
  ]),
  component("notification-banner", "Notification Banner", [
    exactClass("Notification banner class", "nl-notification-banner", 3),
    exactTag("Notification banner custom element", "nl-notification-banner", 2),
  ]),
  component("page-footer", "Page Footer", [
    exactClass("Page footer class", "nl-page-footer", 3),
    exactTag("Page footer custom element", "nl-page-footer", 2),
  ]),
  component("page-header", "Page Header", [
    exactClass("Page header class", "nl-page-header", 3),
    exactTag("Page header custom element", "nl-page-header", 2),
  ]),
  component("radio-button", "Radio Button", [
    exactClass("Radio button class", "nl-radio-button", 3),
    exactTag("Radio button custom element", "nl-radio-button", 2),
  ]),
  component("radio-group", "Radio Group", [
    exactClass("Radio group class", "nl-radio-group", 3),
  ]),
  component("select", "Select", [
    exactClass("Select class", "nl-select", 3),
    exactTag("Select custom element", "nl-select", 2),
  ]),
  component("side-navigation", "Side Navigation", [
    exactClass("Side navigation class", "nl-side-navigation", 3),
  ]),
  component("skip-link", "Skip Link", [
    exactClass("Skip link class", "nl-skip-link", 3),
    exactTag("Skip link custom element", "nl-skip-link", 2),
  ]),
  component("table", "Table", [
    exactClass("Table class", "nl-table", 3),
    exactTag("Table custom element", "nl-table", 2),
  ]),
  component("tabs", "Tabs", [
    exactClass("Tabs class", "nl-tabs", 3),
    exactTag("Tabs custom element", "nl-tabs", 2),
  ]),
  component("task-list", "Task List", [
    exactClass("Task list class", "nl-task-list", 3),
  ]),
  component("text-area", "Text Area", [
    exactClass("Text area class", "nl-text-area", 3),
    exactTag("Text area custom element", "nl-text-area", 2),
  ]),
  component("text-input", "Text Input", [
    exactClass("Text input class", "nl-text-input", 3),
    exactTag("Text input custom element", "nl-text-input", 2),
  ]),
  component("toggletip", "Toggletip", [
    exactClass("Toggletip class", "nl-toggletip", 3),
    exactTag("Toggletip custom element", "nl-toggletip", 2),
  ]),
];

export const nlds = {
  id: "nlds",
  name: "NL Design System",
  version: "starter-2026-03",
  homepage: "https://nldesignsystem.nl/",
  docs: [
    "https://nldesignsystem.nl/",
    "https://nldesignsystem.nl/componenten/",
    "https://nldesignsystem.nl/button/",
  ],
  siteFingerprint: {
    thresholds: {
      full: 0.55,
      partial: 0.2,
    },
    signals: [
      classPrefix("NLDS class prefix", "nl-", 4),
      htmlRegex("NLDS custom element markup", "<nl-[a-z0-9-]+\\b", 3),
      textSubstring("NL Design System package", "@nl-design-system-", 3),
      assetSubstring("NL Design System asset", "@nl-design-system-", 3),
      textSubstring("NL Design System website reference", "nldesignsystem.nl", 2),
      textSubstring("NL Design System text", "NL Design System", 1),
      textSubstring("Utrecht package", "@utrecht/", 1),
      assetSubstring("Utrecht asset", "utrecht", 1),
    ],
  },
  components,
  templates: [],
  maintenance: {
    notes: [
      "NL Design System is a distributed design-system community with shared component definitions and multiple implementation packages.",
      "Starter detection currently prioritizes the official nl-* naming conventions and package references surfaced in the component docs.",
      "Some real-world NLDS adopters may expose stronger community-package tells than shared NLDS-family markup, so coverage will improve as more live examples are reviewed.",
    ],
  },
};

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

function htmlRegex(label, pattern, weight = 1) {
  return signal("html-regex", label, pattern, weight);
}

function textSubstring(label, pattern, weight = 1) {
  return signal("text-substring", label, pattern, weight);
}

const components = [
  component("accordion", "Accordion", [
    exactTag("Accordion tag", "va-accordion", 3),
    htmlRegex("Accordion single-select prop", "open-single", 1),
    htmlRegex("Accordion bordered prop", "bordered", 1),
  ]),
  component("alert", "Alert", [
    exactTag("Alert tag", "va-alert", 3),
    htmlRegex("Alert status role", "role=[\"'](?:status|alert)[\"']", 1),
    textSubstring("Analytics event", "component-library-analytics", 1),
  ]),
  component("breadcrumbs", "Breadcrumbs", [
    exactTag("Breadcrumbs tag", "va-breadcrumbs", 3),
    htmlRegex("Breadcrumb list prop", "breadcrumb-list=", 2),
    htmlRegex("Breadcrumb home label prop", "home-veterans-affairs", 1),
  ]),
  component("button", "Button", [
    exactTag("Button tag", "va-button", 3),
    htmlRegex("Button text prop", "text=", 1),
    htmlRegex("Button variant prop", "(primary-alternate|secondary|submit|back)=", 1),
  ]),
  component("modal", "Modal", [
    exactTag("Modal tag", "va-modal", 3),
    htmlRegex("Modal status prop", "(status|warning|error|success)=", 1),
    htmlRegex("Modal visible prop", "(visible|click-outside-to-close)=", 1),
  ]),
  component("official-gov-banner", "Official Gov banner", [
    exactTag("Official Gov banner tag", "va-official-gov-banner", 3),
    htmlRegex("Banner TLD prop", "tld=", 1),
    textSubstring("Analytics event", "component-library-analytics", 1),
  ]),
];

export const va = {
  id: "va",
  name: "VA.gov Design System",
  version: "starter-2026-03",
  homepage: "https://design.va.gov/",
  docs: [
    "https://design.va.gov/about/developers/using-web-components",
    "https://design.va.gov/components/accordion",
    "https://design.va.gov/components/alert/",
    "https://design.va.gov/components/banner/official-gov",
    "https://design.va.gov/components/breadcrumbs",
    "https://design.va.gov/components/button/",
    "https://design.va.gov/components/modal/",
  ],
  siteFingerprint: {
    thresholds: {
      full: 0.6,
      partial: 0.25,
    },
    signals: [
      tagPrefix("VA web component prefix", "va-", 4),
      htmlRegex("VA custom element markup", "<va-[a-z0-9-]+\\b", 3),
      textSubstring(
        "VA component library package",
        "@department-of-veterans-affairs/component-library",
        3
      ),
      textSubstring("VA analytics event", "component-library-analytics", 2),
      textSubstring("VA load event", "va-component-did-load", 1),
      textSubstring("VA React binding import path", "dist/react-bindings", 1),
    ],
  },
  components,
  templates: [],
  tokens: [
    component(
      "color-tokens",
      "Color design tokens",
      [
        signal("css-regex", "VADS color token in CSS", "--vads-color-", 2),
        htmlRegex("VADS color token defined", "--vads-color-[a-z0-9-]+\\s*:", 2),
        htmlRegex("VADS color token used", "var\\(--vads-color-", 1),
      ],
      { full: 0.55, partial: 0.35 }
    ),
    component(
      "typography-tokens",
      "Typography design tokens",
      [
        signal("css-regex", "VADS font token in CSS", "--vads-font-", 2),
        htmlRegex("VADS font token defined", "--vads-font-[a-z0-9-]+\\s*:", 2),
        htmlRegex("VADS font token used", "var\\(--vads-font-", 1),
      ],
      { full: 0.55, partial: 0.35 }
    ),
    component(
      "spacing-tokens",
      "Spacing design tokens",
      [
        signal("css-regex", "VADS spacing token in CSS", "--vads-spacing-", 2),
        htmlRegex("VADS spacing token defined", "--vads-spacing-[a-z0-9-]+\\s*:", 2),
        htmlRegex("VADS spacing token used", "var\\(--vads-spacing-", 1),
      ],
      { full: 0.55, partial: 0.35 }
    ),
  ],
  maintenance: {
    notes: [
      "The VA design system relies heavily on Web Components and uses a va- prefix for custom elements.",
      "Many VA components are documented as USWDS v3-based, so auto-detection compares both VA and USWDS signals.",
      "This starter definition prioritizes distinctive web-component tells over exhaustive component coverage.",
    ],
  },
};

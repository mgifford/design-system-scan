import test from "node:test";
import assert from "node:assert/strict";

import { cms } from "../src/systems/cms.js";
import { gcds } from "../src/systems/gcds.js";
import { govuk } from "../src/systems/govuk.js";
import { kolibri } from "../src/systems/kolibri.js";
import { nlds } from "../src/systems/nlds.js";
import { evaluateHtml, selectBestSystemReport } from "../src/scanner.js";
import { uswds } from "../src/systems/uswds.js";
import { va } from "../src/systems/va.js";

function wrapReport(definition, page) {
  return {
    system: {
      id: definition.id,
      name: definition.name,
      trackedVersion: definition.version,
    },
    pages: [page],
    siteSummary: {
      pageCount: 1,
      successfulPageCount: 1,
      fingerprintedPageCount: page.siteFingerprint.status === "absent" ? 0 : 1,
    },
  };
}

test("auto detection prefers USWDS on USWDS-style markup", () => {
  const html = `
    <div class="usa-banner">
      <div class="usa-banner__header"></div>
      <div class="usa-banner__content"></div>
    </div>
    <header class="usa-header usa-header--extended">
      <div class="usa-navbar"></div>
      <nav class="usa-nav"></nav>
    </header>
    <form class="usa-search usa-search--small">
      <button type="button" class="usa-button">
        <span class="usa-search__submit-icon"></span>
      </button>
    </form>
  `;

  const selection = selectBestSystemReport([
    wrapReport(uswds, evaluateHtml("https://example.gov/", html, uswds)),
    wrapReport(va, evaluateHtml("https://example.gov/", html, va)),
    wrapReport(govuk, evaluateHtml("https://example.gov/", html, govuk)),
  ]);

  assert.equal(selection.selected.system.id, "uswds");
});

test("auto detection prefers VA on VA web components", () => {
  const html = `
    <script type="module">
      import "@department-of-veterans-affairs/component-library";
    </script>
    <va-alert role="status"></va-alert>
    <va-button text="Continue"></va-button>
    <va-modal status="warning"></va-modal>
  `;

  const selection = selectBestSystemReport([
    wrapReport(uswds, evaluateHtml("https://www.va.gov/", html, uswds)),
    wrapReport(va, evaluateHtml("https://www.va.gov/", html, va)),
    wrapReport(govuk, evaluateHtml("https://www.va.gov/", html, govuk)),
  ]);

  assert.equal(selection.selected.system.id, "va");
});

test("auto detection prefers CMSDS on ds web components", () => {
  const html = `
    <script type="module">
      import "@cmsgov/ds-healthcare-gov";
    </script>
    <script src="https://design.cms.gov/cdn/ds-healthcare-gov/15.0.0/web-components/bundle/all.js"></script>
    <link rel="stylesheet" href="https://design.cms.gov/cdn/ds-healthcare-gov/15.0.0/css/healthcare-theme.css" />
    <ds-alert variation="warn"></ds-alert>
    <ds-button variation="solid"></ds-button>
    <ds-tooltip></ds-tooltip>
  `;

  const selection = selectBestSystemReport([
    wrapReport(uswds, evaluateHtml("https://example.gov/", html, uswds)),
    wrapReport(va, evaluateHtml("https://example.gov/", html, va)),
    wrapReport(cms, evaluateHtml("https://example.gov/", html, cms)),
    wrapReport(govuk, evaluateHtml("https://example.gov/", html, govuk)),
  ]);

  assert.equal(selection.selected.system.id, "cms");
});

test("auto detection prefers GOV.UK on govuk frontend markup", () => {
  const html = `
    <link rel="stylesheet" href="https://assets.example.gov/govuk-frontend/govuk/all.min.css" />
    <script type="module">
      import "govuk-frontend/govuk/all";
    </script>
    <div class="govuk-cookie-banner" data-module="govuk-cookie-banner"></div>
    <button class="govuk-button" data-module="govuk-button">Continue</button>
    <nav class="govuk-pagination"></nav>
  `;

  const selection = selectBestSystemReport([
    wrapReport(uswds, evaluateHtml("https://www.gov.uk/", html, uswds)),
    wrapReport(va, evaluateHtml("https://www.gov.uk/", html, va)),
    wrapReport(cms, evaluateHtml("https://www.gov.uk/", html, cms)),
    wrapReport(govuk, evaluateHtml("https://www.gov.uk/", html, govuk)),
  ]);

  assert.equal(selection.selected.system.id, "govuk");
});

test("auto detection prefers NL Design System on nl-design-system markup", () => {
  const html = `
    <link rel="stylesheet" href="https://cdn.example.nl/@nl-design-system-candidate/button-css/button.css" />
    <header class="nl-page-header"></header>
    <a class="nl-skip-link" href="#main">Ga direct naar de inhoud</a>
    <button class="nl-button">Verder</button>
    <div class="nl-page-footer"></div>
  `;

  const selection = selectBestSystemReport([
    wrapReport(uswds, evaluateHtml("https://example.nl/", html, uswds)),
    wrapReport(va, evaluateHtml("https://example.nl/", html, va)),
    wrapReport(cms, evaluateHtml("https://example.nl/", html, cms)),
    wrapReport(govuk, evaluateHtml("https://example.nl/", html, govuk)),
    wrapReport(nlds, evaluateHtml("https://example.nl/", html, nlds)),
  ]);

  assert.equal(selection.selected.system.id, "nlds");
});

test("auto detection prefers GC Design System on gcds web components", () => {
  const html = `
    <script type="module">
      import "@cdssnc/gcds-components";
    </script>
    <gcds-header></gcds-header>
    <gcds-breadcrumbs></gcds-breadcrumbs>
    <gcds-button>Continue</gcds-button>
    <gcds-footer></gcds-footer>
  `;

  const selection = selectBestSystemReport([
    wrapReport(uswds, evaluateHtml("https://www.canada.ca/", html, uswds)),
    wrapReport(va, evaluateHtml("https://www.canada.ca/", html, va)),
    wrapReport(cms, evaluateHtml("https://www.canada.ca/", html, cms)),
    wrapReport(govuk, evaluateHtml("https://www.canada.ca/", html, govuk)),
    wrapReport(nlds, evaluateHtml("https://www.canada.ca/", html, nlds)),
    wrapReport(gcds, evaluateHtml("https://www.canada.ca/", html, gcds)),
    wrapReport(kolibri, evaluateHtml("https://www.canada.ca/", html, kolibri)),
  ]);

  assert.equal(selection.selected.system.id, "gcds");
});

test("auto detection prefers KoliBri on Public UI web components", () => {
  const html = `
    <script type="module">
      import "@public-ui/components/loader";
      import "@public-ui/components";
    </script>
    <kol-skip-nav _href="#main">Zum Inhalt</kol-skip-nav>
    <kol-button _label="Weiter"></kol-button>
    <kol-pagination></kol-pagination>
  `;

  const selection = selectBestSystemReport([
    wrapReport(uswds, evaluateHtml("https://example.de/", html, uswds)),
    wrapReport(va, evaluateHtml("https://example.de/", html, va)),
    wrapReport(cms, evaluateHtml("https://example.de/", html, cms)),
    wrapReport(govuk, evaluateHtml("https://example.de/", html, govuk)),
    wrapReport(nlds, evaluateHtml("https://example.de/", html, nlds)),
    wrapReport(gcds, evaluateHtml("https://example.de/", html, gcds)),
    wrapReport(kolibri, evaluateHtml("https://example.de/", html, kolibri)),
  ]);

  assert.equal(selection.selected.system.id, "kolibri");
});

test("auto detection returns unknown when no system has clear evidence", () => {
  const html = `
    <main>
      <h1>Example service</h1>
      <p>This page uses plain HTML without any tracked design-system conventions.</p>
      <a href="/about">About</a>
    </main>
  `;

  const selection = selectBestSystemReport([
    wrapReport(uswds, evaluateHtml("https://example.com/", html, uswds)),
    wrapReport(va, evaluateHtml("https://example.com/", html, va)),
    wrapReport(cms, evaluateHtml("https://example.com/", html, cms)),
    wrapReport(govuk, evaluateHtml("https://example.com/", html, govuk)),
    wrapReport(nlds, evaluateHtml("https://example.com/", html, nlds)),
    wrapReport(gcds, evaluateHtml("https://example.com/", html, gcds)),
    wrapReport(kolibri, evaluateHtml("https://example.com/", html, kolibri)),
  ]);

  assert.equal(selection.selected.system.id, "unknown");
  assert.equal(selection.selected.system.name, "Unknown design system");
  assert.equal(selection.selected.siteSummary.fingerprintedPageCount, 0);
  assert.deepEqual(selection.selected.pages[0].components, []);
  assert.deepEqual(selection.selected.pages[0].templates, []);
});

import test from "node:test";
import assert from "node:assert/strict";

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
  ]);

  assert.equal(selection.selected.system.id, "va");
});

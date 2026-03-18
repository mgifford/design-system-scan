import test from "node:test";
import assert from "node:assert/strict";

import { evaluateHtml } from "../src/scanner.js";
import { cms } from "../src/systems/cms.js";

function findTheme(page, id) {
  return page.themes.find((theme) => theme.id === id);
}

test("CMSDS identifies the core theme from package and stylesheet tells", () => {
  const html = `
    <link rel="stylesheet" href="https://design.cms.gov/cdn/design-system/13.1.0/css/index.css" />
    <link rel="stylesheet" href="https://design.cms.gov/cdn/design-system/13.1.0/css/core-theme.css" />
    <script type="module">
      import "@cmsgov/design-system";
    </script>
    <ds-alert variation="warn"></ds-alert>
  `;

  const page = evaluateHtml("https://example.gov/", html, cms);
  const coreTheme = findTheme(page, "core");

  assert.equal(coreTheme.status, "full");
  assert.equal(page.primaryTheme?.id, "core");
});

test("CMSDS identifies the HealthCare.gov child theme", () => {
  const html = `
    <link rel="stylesheet" href="https://design.cms.gov/cdn/ds-healthcare-gov/15.0.0/css/index.css" />
    <link rel="stylesheet" href="https://design.cms.gov/cdn/ds-healthcare-gov/15.0.0/css/healthcare-theme.css" />
    <script type="module">
      import "@cmsgov/ds-healthcare-gov";
    </script>
    <script src="https://design.cms.gov/cdn/ds-healthcare-gov/15.0.0/web-components/bundle/all.js"></script>
    <ds-healthcare-gov-header></ds-healthcare-gov-header>
  `;

  const page = evaluateHtml("https://www.healthcare.gov/", html, cms);
  const healthcareTheme = findTheme(page, "healthcare");

  assert.equal(healthcareTheme.status, "full");
  assert.equal(page.primaryTheme?.id, "healthcare");
  assert.match(page.versions.join(","), /15\.0\.0/);
});

test("CMSDS identifies the Medicare.gov child theme", () => {
  const html = `
    <link rel="stylesheet" href="https://design.cms.gov/cdn/ds-medicare-gov/15.0.0/css/index.css" />
    <link rel="stylesheet" href="https://design.cms.gov/cdn/ds-medicare-gov/15.0.0/css/medicare-theme.css" />
    <script type="module">
      import "@cmsgov/ds-medicare-gov";
    </script>
    <ds-medicare-gov-footer></ds-medicare-gov-footer>
  `;

  const page = evaluateHtml("https://www.medicare.gov/", html, cms);
  const medicareTheme = findTheme(page, "medicare");

  assert.equal(medicareTheme.status, "full");
  assert.equal(page.primaryTheme?.id, "medicare");
});

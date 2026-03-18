import test from "node:test";
import assert from "node:assert/strict";

import { buildDashboardHtml } from "../src/dashboard.js";

test("dashboard includes accessible dark mode support", () => {
  const html = buildDashboardHtml(
    {
      siteSummary: {
        successfulPageCount: 1,
        pageCount: 1,
        fingerprintedPageCount: 1,
        components: [],
        templates: [],
      },
      pages: [],
    },
    {
      runUrl: "https://github.com/mgifford/design-system-scan/actions/runs/1",
      trigger: "manual",
      url: "https://example.gov/",
      system: "uswds",
      maxPages: "10",
      reportText: "",
    }
  );

  assert.match(html, /id="theme-toggle"/);
  assert.match(html, /Switch to dark mode/);
  assert.match(html, /prefers-color-scheme: dark/);
  assert.match(html, /forced-colors: active/);
  assert.match(html, /localStorage\.setItem\('theme'/);
});

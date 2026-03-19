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

test("dashboard uses modal dialogs for page details", () => {
  const html = buildDashboardHtml(
    {
      system: { name: "U.S. Web Design System" },
      siteSummary: {
        successfulPageCount: 1,
        pageCount: 1,
        fingerprintedPageCount: 1,
        components: [],
        templates: [],
        primaryTheme: null,
      },
      pages: [
        {
          url: "https://example.gov/",
          siteFingerprint: { status: "full", coverage: 1 },
          summary: {
            fullComponentCount: 2,
            partialComponentCount: 1,
            matchedTemplateCount: 0,
            overallCoverage: 0.5,
          },
          versions: ["3.0.0"],
          components: [
            {
              name: "Banner",
              status: "full",
              coverage: 1,
              matchedSignals: [{ value: "usa-banner" }],
              missingSignals: [],
            },
          ],
          templates: [],
          assetInventory: { assetErrors: [] },
        },
      ],
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

  assert.match(html, /data-open-modal=/);
  assert.match(html, /<dialog id="page-modal-/);
  assert.match(html, />Details<\/button>/);
  assert.match(html, /showModal\(\)/);
  assert.doesNotMatch(html, /<details>/);
  assert.doesNotMatch(html, /<summary>Details<\/summary>/);
});

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
      repository: "mgifford/design-system-scan",
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
  assert.match(html, /Project home/);
  assert.match(html, /Reports/);
  assert.match(html, /Latest report/);
  assert.match(html, /Archives/);
  assert.match(html, /href="#scanned-pages"/);
  assert.match(html, /aria-label="Copy link to Scanned pages section"/);
});

test("dashboard uses modal dialogs for page details", () => {
  const html = buildDashboardHtml(
    {
      system: { id: "uswds", name: "U.S. Web Design System" },
      siteSummary: {
        successfulPageCount: 1,
        pageCount: 1,
        fingerprintedPageCount: 1,
        components: [{ id: "button", name: "Button", full: 1, partial: 0 }],
        templates: [],
        primaryTheme: null,
      },
      pages: [
        {
          url: "https://example.gov/",
          scannedAt: "2026-03-19T15:30:00.000Z",
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
              id: "button",
              name: "Button",
              status: "full",
              coverage: 1,
              matchedSignals: [{ value: "usa-button" }],
              missingSignals: [],
            },
          ],
          templates: [],
          assetInventory: { assetErrors: [] },
        },
      ],
    },
    {
      repository: "mgifford/design-system-scan",
      runUrl: "https://github.com/mgifford/design-system-scan/actions/runs/1",
      trigger: "issue-7",
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
  assert.match(html, /<strong>Date<\/strong>2026-03-19T15:30:00.000Z/);
  assert.match(html, /<strong>Trigger<\/strong><a href="https:\/\/github\.com\/mgifford\/design-system-scan\/issues\/7">Issue 7<\/a>/);
  assert.match(html, /<strong>Proposed version<\/strong>3\.0\.0/);
  assert.match(html, /href="\.\.\/\.\.\/systems\/uswds\/#component-button">Button<\/a>/);
  assert.match(html, /summary-modal-button-full/);
  assert.match(html, /Button: full matches/);
  assert.match(html, /Join the community on GitHub/);
  assert.doesNotMatch(html, /<details>/);
  assert.doesNotMatch(html, /<summary>Details<\/summary>/);
});

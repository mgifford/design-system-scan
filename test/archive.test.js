import test from "node:test";
import assert from "node:assert/strict";

import { buildArchiveIndexHtml } from "../src/archive.js";

test("archive dates use accessible tooltip markup instead of title attributes", () => {
  const html = buildArchiveIndexHtml({
    updatedAt: "2026-03-18T18:54:17.707Z",
    scans: [
      {
        id: "23253601700",
        repository: "mgifford/design-system-scan",
        runNumber: "41",
        runUrl: "https://github.com/mgifford/design-system-scan/actions/runs/23253601700",
        scannedAt: "2026-03-18T18:54:17.707Z",
        trigger: "issue-6",
        seedUrl: "https://design.cms.gov/",
        system: "uswds",
        crawl: true,
        maxPages: 10,
        sha: "abcdef123456",
        siteSummary: {
          successfulPageCount: 10,
          pageCount: 10,
          fingerprintedPageCount: 2,
          components: [{ name: "Accordion", full: 4, partial: 1 }],
          templates: [{ name: "Documentation page", full: 1, partial: 1 }],
        },
        pages: [],
      },
    ],
  });

  assert.match(html, /role="tooltip"/);
  assert.match(html, /aria-describedby="tooltip-scan-date-23253601700"/);
  assert.match(html, />Issue 6</);
  assert.doesNotMatch(html, /title=/);
  assert.match(html, /id="theme-toggle"/);
  assert.match(html, /prefers-color-scheme: dark/);
  assert.match(html, /localStorage\.getItem\('theme'\)/);
});

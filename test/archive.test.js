import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { buildArchiveIndexHtml, writeArchiveSite } from "../src/archive.js";

test("archive dates use accessible tooltip markup instead of title attributes", () => {
  const html = buildArchiveIndexHtml({
    updatedAt: "2026-03-18T18:54:17.707Z",
    scans: [
      {
        id: "23253601700",
        repository: "mgifford/design-system-scan",
        runId: "23253601700",
        runNumber: "41",
        runUrl: "https://github.com/mgifford/design-system-scan/actions/runs/23253601700",
        scannedAt: "2026-03-18T18:54:17.707Z",
        trigger: "issue-6",
        issueNumber: "6",
        seedUrl: "https://design.cms.gov/",
        system: "uswds",
        crawl: true,
        maxPages: 10,
        acceptedUrls: 10,
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
  assert.match(html, /reports\/issues\/issue-6\/run-23253601700\/report\.html/);
  assert.doesNotMatch(html, /title=/);
  assert.match(html, /id="theme-toggle"/);
  assert.match(html, /prefers-color-scheme: dark/);
  assert.match(html, /localStorage\.getItem\('theme'\)/);
});

test("archive site writes stable per-issue report files", async () => {
  const outputDir = await fs.mkdtemp(path.join(os.tmpdir(), "dss-archive-"));

  await writeArchiveSite(outputDir, {
    updatedAt: "2026-03-18T18:54:17.707Z",
    scans: [
      {
        id: "23253601700",
        repository: "mgifford/design-system-scan",
        runId: "23253601700",
        runNumber: "41",
        runUrl: "https://github.com/mgifford/design-system-scan/actions/runs/23253601700",
        scannedAt: "2026-03-18T18:54:17.707Z",
        trigger: "issue-6",
        issueNumber: "6",
        seedUrl: "https://design.cms.gov/",
        system: "cms",
        crawl: true,
        maxPages: 10,
        acceptedUrls: 10,
        sha: "abcdef123456",
        systemInfo: { name: "CMS Design System" },
        siteSummary: {
          successfulPageCount: 2,
          pageCount: 2,
          fingerprintedPageCount: 2,
          components: [{ name: "Accordion", full: 2, partial: 0 }],
          templates: [],
          themes: [{ name: "Core", full: 2, partial: 0 }],
        },
        pages: [
          {
            url: "https://design.cms.gov/",
            fingerprint: { status: "full", coverage: 1 },
            summary: { fullComponentCount: 3, partialComponentCount: 0, matchedTemplateCount: 0 },
            versions: ["13.1.0"],
          },
        ],
      },
    ],
  });

  const html = await fs.readFile(
    path.join(outputDir, "reports/issues/issue-6/run-23253601700/report.html"),
    "utf8"
  );
  const markdown = await fs.readFile(
    path.join(outputDir, "reports/issues/issue-6/run-23253601700/report.md"),
    "utf8"
  );
  const csv = await fs.readFile(
    path.join(outputDir, "reports/issues/issue-6/run-23253601700/report.csv"),
    "utf8"
  );

  assert.match(html, /Accepted URLs<\/strong>10/);
  assert.match(markdown, /Accepted URLs: 10/);
  assert.match(csv, /page_url,fingerprint_status/);
});

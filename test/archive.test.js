import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { buildArchiveIndexHtml, buildScanReportHtml, writeArchiveSite } from "../src/archive.js";

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
  assert.match(html, /href="#reports"/);
  assert.match(html, /aria-label="Copy link to Reports section"/);
  assert.match(html, />Issue 6</);
  assert.match(html, /issues\/issue-6\/run-23253601700\/report\.html/);
  assert.doesNotMatch(html, /title=/);
  assert.match(html, /id="theme-toggle"/);
  assert.match(html, /prefers-color-scheme: dark/);
  assert.match(html, /localStorage\.getItem\('theme'\)/);
  assert.match(html, /<a class="button-link" href="issues\/issue-6\/run-23253601700\/report\.html">Details<\/a>/);
  assert.doesNotMatch(html, /<dialog/);
});

test("scan report html includes page-level detail content", () => {
  const html = buildScanReportHtml({
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
    reportPaths: {
      html: "reports/issues/issue-6/run-23253601700/report.html",
      markdown: "reports/issues/issue-6/run-23253601700/report.md",
      csv: "reports/issues/issue-6/run-23253601700/report.csv",
      json: "reports/issues/issue-6/run-23253601700/report.json",
    },
    siteSummary: {
      successfulPageCount: 2,
      pageCount: 2,
      fingerprintedPageCount: 2,
      primaryTheme: { name: "Core" },
      components: [{ name: "Accordion", full: 2, partial: 0 }],
      templates: [],
      themes: [{ name: "Core", full: 2, partial: 0 }],
    },
    pages: [
      {
        url: "https://design.cms.gov/",
        fingerprint: { status: "full", coverage: 1 },
        summary: {
          fullComponentCount: 3,
          partialComponentCount: 1,
          matchedTemplateCount: 0,
          overallCoverage: 0.75,
        },
        versions: ["13.1.0"],
        components: [
          {
            name: "Accordion",
            status: "full",
            coverage: 1,
            matched: ["ds-c-accordion"],
            missing: [],
          },
        ],
        templates: [],
        assetErrors: [],
      },
    ],
  });

  assert.match(html, /<strong>Theme:<\/strong> Core/);
  assert.match(html, /<strong>Proposed version:<\/strong> 13\.1\.0/);
  assert.match(html, /<a href="\.\.\/\.\.\/\.\.\/\.\.\/">Project home<\/a>/);
  assert.match(html, /<a href="\.\.\/\.\.\/\.\.\/">Reports<\/a>/);
  assert.match(html, /<a href="\.\.\/\.\.\/\.\.\/\.\.\/reports\/latest\/">Latest report<\/a>/);
  assert.match(html, /<a href="\.\.\/\.\.\/\.\.\/\.\.\/archives\/">Archives<\/a>/);
  assert.match(html, /open source <a href="https:\/\/github\.com\/mgifford\/design-system-scan">design-system-scan<\/a> project/);
  assert.match(html, /<strong>Component types identified<\/strong>1/);
  assert.match(html, /<h2 id="page-details">Page details<\/h2>/);
  assert.match(html, /Each scanned page includes the detected design-system fingerprint/);
  assert.match(html, /<h3><a href="https:\/\/design\.cms\.gov\/">https:\/\/design\.cms\.gov\/<\/a><\/h3>/);
  assert.match(html, /Accordion/);
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
  const issueAlias = await fs.readFile(path.join(outputDir, "reports/6/index.html"), "utf8");
  const issueDateAlias = await fs.readFile(
    path.join(outputDir, "reports/6/2026-03-18T18-54-17-707Z/index.html"),
    "utf8"
  );
  const archiveIndex = await fs.readFile(path.join(outputDir, "reports/index.html"), "utf8");
  const rootIndex = await fs.readFile(path.join(outputDir, "index.html"), "utf8");
  const markdown = await fs.readFile(
    path.join(outputDir, "reports/issues/issue-6/run-23253601700/report.md"),
    "utf8"
  );
  const csv = await fs.readFile(
    path.join(outputDir, "reports/issues/issue-6/run-23253601700/report.csv"),
    "utf8"
  );

  assert.match(rootIndex, /Open reports/);
  assert.match(rootIndex, /Open archives/);
  assert.match(rootIndex, /Project home/);
  assert.match(rootIndex, /Latest report/);
  assert.match(rootIndex, /href="#currently-supported"/);
  assert.match(rootIndex, /href="\.\/reports\/"/);
  assert.match(rootIndex, /href="\.\/archives\/"/);
  assert.match(rootIndex, /href="\.\/reports\/latest\/"/);
  assert.match(rootIndex, /Why This Matters/);
  assert.match(rootIndex, /Currently Supported/);
  assert.match(rootIndex, /How To Read A Report/);
  assert.match(rootIndex, /USWDS/);
  assert.match(rootIndex, /VA\.gov/);
  assert.match(rootIndex, /CMS Design System/);
  assert.match(rootIndex, /GOV\.UK/);
  assert.match(rootIndex, /href="\.\/systems\/uswds\/"/);
  assert.match(rootIndex, /href="\.\/systems\/va\/"/);
  assert.match(rootIndex, /href="\.\/systems\/cms\/"/);
  assert.match(rootIndex, /href="\.\/systems\/govuk\/"/);
  assert.match(rootIndex, /href="\.\/comparison\/"/);
  assert.match(rootIndex, /Design System Comparison/);
  assert.match(rootIndex, /Join the community on GitHub/);
  assert.match(archiveIndex, /Design System Scan Reports/);
  assert.match(archiveIndex, /Latest report/);
  assert.match(archiveIndex, /Archives/);
  assert.match(archiveIndex, /newest report for each trigger/);
  assert.match(html, /Accepted URLs<\/strong>10/);
  assert.match(issueAlias, /Design system scan report/);
  assert.match(issueDateAlias, /Design system scan report/);
  assert.match(html, /<a href="\.\/report\.md">Markdown report<\/a>/);
  assert.match(html, /<a href="\.\.\/\.\.\/\.\.\/">Current reports index<\/a>/);
  assert.match(html, /Archive ZIP package/);
  assert.match(markdown, /Accepted URLs: 10/);
  assert.match(csv, /page_url,fingerprint_status/);

  const archivesIndex = await fs.readFile(path.join(outputDir, "archives/index.html"), "utf8");
  assert.match(archivesIndex, /Design System Scan Archives/);
  assert.match(archivesIndex, /downloadable ZIP packages/);
  assert.match(archivesIndex, /Pages crawled/);

  const systemPage = await fs.readFile(path.join(outputDir, "systems/uswds/index.html"), "utf8");
  assert.match(systemPage, /U\.S\. Web Design System/);
  assert.match(systemPage, /Latest report/);
  assert.match(systemPage, /href="#indexed-components"/);
  assert.match(systemPage, /id="component-accordion"/);
  assert.match(systemPage, /Indexed components/);
  assert.match(systemPage, /Scanner support/);
  assert.match(systemPage, /What it does/);
  assert.match(systemPage, /Accordion/);
  assert.match(systemPage, /https:\/\/designsystem\.digital\.gov\/components\/accordion\//);

  const comparisonPage = await fs.readFile(path.join(outputDir, "comparison/index.html"), "utf8");
  assert.match(comparisonPage, /Design system comparison/);
  assert.match(comparisonPage, /Example: Breadcrumbs/);
  assert.match(comparisonPage, /Breadcrumbs/);
  assert.match(comparisonPage, /U\.S\. Web Design System/);
  assert.match(comparisonPage, /VA\.gov Design System/);
  assert.match(comparisonPage, /CMS Design System/);
  assert.match(comparisonPage, /GOV\.UK Design System/);
  assert.match(comparisonPage, /Latest report/);
  assert.match(comparisonPage, /href="#component-family-matrix"/);
  assert.match(comparisonPage, /Mostly converged/);
  assert.match(comparisonPage, /Direct match: breadcrumb/);
});

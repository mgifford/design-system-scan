import fs from "node:fs/promises";
import path from "node:path";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function formatPercent(value) {
  return `${Math.round((value ?? 0) * 100)}%`;
}

function statusBadge(status) {
  const tone = {
    full: "full",
    partial: "partial",
    absent: "absent",
    error: "absent",
  }[status] ?? "absent";

  return `<span class="badge badge--${tone}">${escapeHtml(status)}</span>`;
}

function topEvidence(items, limit = 6) {
  return (items ?? [])
    .filter((item) => item.status !== "absent")
    .sort((left, right) => right.coverage - left.coverage)
    .slice(0, limit)
    .map((item) => ({
      name: item.name,
      status: item.status,
      coverage: item.coverage,
      matched: (item.matchedSignals ?? []).slice(0, 2).map((signal) => signal.value),
      missing: (item.missingSignals ?? []).slice(0, 3).map((signal) => signal.label),
    }));
}

function summarizePage(page) {
  if (page.error) {
    return {
      url: page.url,
      error: page.error,
      fingerprint: {
        status: "error",
        coverage: 0,
      },
      summary: {
        fullComponentCount: 0,
        partialComponentCount: 0,
        matchedTemplateCount: 0,
        overallCoverage: 0,
      },
      versions: [],
      components: [],
      templates: [],
      assetErrors: [],
    };
  }

  return {
    url: page.url,
    error: null,
    fingerprint: {
      status: page.siteFingerprint.status,
      coverage: page.siteFingerprint.coverage,
    },
    summary: {
      fullComponentCount: page.summary.fullComponentCount,
      partialComponentCount: page.summary.partialComponentCount,
      matchedTemplateCount: page.summary.matchedTemplateCount,
      overallCoverage: page.summary.overallCoverage,
    },
    versions: page.versions ?? [],
    components: topEvidence(page.components),
    templates: topEvidence(page.templates),
    assetErrors: (page.assetInventory?.assetErrors ?? []).slice(0, 5),
  };
}

export function createArchiveEntry(report, metadata) {
  return {
    id: String(metadata.runId),
    repository: metadata.repository,
    runId: String(metadata.runId),
    runNumber: String(metadata.runNumber),
    runUrl: metadata.runUrl,
    scannedAt: report.pages[0]?.scannedAt ?? new Date().toISOString(),
    trigger: metadata.trigger,
    seedUrl: metadata.url,
    system: metadata.system,
    crawl: metadata.crawl,
    maxPages: Number(metadata.maxPages),
    sha: metadata.sha,
    systemInfo: report.system,
    siteSummary: report.siteSummary,
    pages: report.pages.map(summarizePage),
  };
}

export function mergeArchiveHistory(history, entry) {
  const previous = Array.isArray(history?.scans) ? history.scans : [];
  const merged = previous.filter((item) => item.id !== entry.id);
  merged.push(entry);
  merged.sort((left, right) => String(right.scannedAt).localeCompare(String(left.scannedAt)));

  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    scans: merged,
  };
}

function renderEvidenceTable(title, items) {
  if (!items?.length) {
    return `<section><h4>${escapeHtml(title)}</h4><p class="muted">No strong matches detected.</p></section>`;
  }

  const rows = items
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.name)}</td>
          <td>${statusBadge(item.status)}</td>
          <td>${formatPercent(item.coverage)}</td>
          <td>${item.matched.map(escapeHtml).join(" | ") || '<span class="muted">None</span>'}</td>
          <td>${item.missing.map(escapeHtml).join(" | ") || '<span class="muted">None</span>'}</td>
        </tr>
      `
    )
    .join("");

  return `
    <section>
      <h4>${escapeHtml(title)}</h4>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Coverage</th>
              <th>Matched</th>
              <th>Missing</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </section>
  `;
}

function renderPageTable(pages) {
  const rows = pages
    .map((page) => {
      const versions = page.versions.length ? page.versions.join(", ") : "none";
      const assetErrors = page.assetErrors
        .map((item) => `<li>${escapeHtml(item)}</li>`)
        .join("");

      return `
        <tr>
          <td><a href="${escapeHtml(page.url)}">${escapeHtml(page.url)}</a></td>
          <td>${statusBadge(page.fingerprint.status)}</td>
          <td>${formatPercent(page.fingerprint.coverage)}</td>
          <td>${page.summary.fullComponentCount}</td>
          <td>${page.summary.partialComponentCount}</td>
          <td>${page.summary.matchedTemplateCount}</td>
          <td>${escapeHtml(versions)}</td>
          <td>
            <details>
              <summary>Page details</summary>
              ${
                page.error
                  ? `<p class="error">${escapeHtml(page.error)}</p>`
                  : `
                    <p><strong>Adoption:</strong> ${page.summary.fullComponentCount} full, ${page.summary.partialComponentCount} partial, ${formatPercent(page.summary.overallCoverage)} overall</p>
                    ${renderEvidenceTable("Components", page.components)}
                    ${renderEvidenceTable("Templates", page.templates)}
                    ${assetErrors ? `<section><h4>Asset fetch issues</h4><ul>${assetErrors}</ul></section>` : ""}
                  `
              }
            </details>
          </td>
        </tr>
      `;
    })
    .join("");

  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Page</th>
            <th>Fingerprint</th>
            <th>Coverage</th>
            <th>Full components</th>
            <th>Partial components</th>
            <th>Templates</th>
            <th>Version clues</th>
            <th>Expand</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function renderArchiveRows(scans) {
  return scans
    .map((scan) => {
      const componentSnapshot = (scan.siteSummary?.components ?? [])
        .slice(0, 6)
        .map((item) => `${item.name} (${item.full}/${item.partial})`)
        .join("; ");
      const templateSnapshot = (scan.siteSummary?.templates ?? [])
        .slice(0, 4)
        .map((item) => `${item.name} (${item.full}/${item.partial})`)
        .join("; ");

      return `
        <tr data-filter="${escapeHtml([scan.seedUrl, scan.system, scan.trigger].join(" ").toLowerCase())}" id="scan-${escapeHtml(scan.id)}">
          <td>${escapeHtml(scan.scannedAt)}</td>
          <td><a href="${escapeHtml(scan.seedUrl)}">${escapeHtml(scan.seedUrl)}</a></td>
          <td>${escapeHtml(scan.system)}</td>
          <td>${escapeHtml(scan.trigger)}</td>
          <td>${scan.siteSummary?.successfulPageCount ?? 0}/${scan.siteSummary?.pageCount ?? 0}</td>
          <td>${scan.siteSummary?.fingerprintedPageCount ?? 0}</td>
          <td>${componentSnapshot ? escapeHtml(componentSnapshot) : '<span class="muted">None</span>'}</td>
          <td>${templateSnapshot ? escapeHtml(templateSnapshot) : '<span class="muted">None</span>'}</td>
          <td>
            <details>
              <summary>Scan details</summary>
              <p><strong>Run:</strong> <a href="${escapeHtml(scan.runUrl)}">${escapeHtml(scan.runNumber)}</a></p>
              <p><strong>Commit:</strong> ${escapeHtml(scan.sha)}</p>
              <p><strong>Crawl:</strong> ${escapeHtml(scan.crawl)} | <strong>Max pages:</strong> ${escapeHtml(scan.maxPages)}</p>
              ${renderPageTable(scan.pages)}
            </details>
          </td>
        </tr>
      `;
    })
    .join("");
}

export function buildArchiveIndexHtml(history) {
  const scans = history.scans ?? [];
  const uniqueSites = new Set(scans.map((scan) => {
    try {
      return new URL(scan.seedUrl).hostname;
    } catch {
      return scan.seedUrl;
    }
  })).size;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Design System Scan Archive</title>
    <style>
      :root { color-scheme: light; }
      body { margin: 0; font-family: ui-sans-serif, system-ui, sans-serif; color: #112e51; background: linear-gradient(180deg, #eef5fb 0%, #f7f7f2 100%); }
      main { max-width: 96rem; margin: 0 auto; padding: 2rem 1rem 4rem; }
      .hero, section { background: white; border: 1px solid #dfe1e2; box-shadow: 0 12px 32px rgba(0,0,0,.05); padding: 1rem 1.25rem; margin-bottom: 1rem; }
      .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr)); gap: .75rem; margin-top: 1rem; }
      .stat { background: #f8fbff; border: 1px solid #d9e8f6; padding: .85rem; }
      .stat strong { display: block; color: #5c6f82; font-size: .8rem; text-transform: uppercase; letter-spacing: .04em; margin-bottom: .25rem; }
      .table-wrap { overflow-x: auto; }
      table { width: 100%; border-collapse: collapse; }
      th, td { text-align: left; vertical-align: top; padding: .65rem .5rem; border-bottom: 1px solid #e6e6e6; }
      th { font-size: .8rem; text-transform: uppercase; letter-spacing: .04em; color: #5c6f82; }
      .badge { display: inline-block; padding: .15rem .45rem; border-radius: 999px; font-size: .8rem; font-weight: 700; text-transform: uppercase; }
      .badge--full { background: #dff6dd; color: #17603a; }
      .badge--partial { background: #fff4cc; color: #7a5300; }
      .badge--absent { background: #f4dfe2; color: #8b1e2d; }
      .muted { color: #5c6f82; }
      .error { color: #b50909; font-weight: 700; }
      details { margin-top: .35rem; }
      details summary { cursor: pointer; font-weight: 700; }
      input { width: min(30rem, 100%); padding: .65rem .8rem; border: 1px solid #a9bcd0; border-radius: .3rem; font: inherit; }
      a { color: #005ea2; }
    </style>
  </head>
  <body>
    <main>
      <section class="hero">
        <h1>Design System Scan Archive</h1>
        <p>Compact history of scans across sites, with expandable details for each run and each scanned page.</p>
        <div class="stats">
          <div class="stat"><strong>Total scans</strong>${scans.length}</div>
          <div class="stat"><strong>Unique sites</strong>${uniqueSites}</div>
          <div class="stat"><strong>Latest update</strong>${escapeHtml(history.updatedAt ?? "unknown")}</div>
        </div>
      </section>

      <section>
        <h2>Scans</h2>
        <p class="muted">Filter by URL, system, or trigger.</p>
        <input id="scan-filter" type="search" placeholder="Filter scans">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Scanned at</th>
                <th>Seed URL</th>
                <th>System</th>
                <th>Trigger</th>
                <th>Pages</th>
                <th>Fingerprint pages</th>
                <th>Top components</th>
                <th>Top templates</th>
                <th>Expand</th>
              </tr>
            </thead>
            <tbody id="scan-table-body">
              ${renderArchiveRows(scans)}
            </tbody>
          </table>
        </div>
      </section>
    </main>
    <script>
      const input = document.getElementById('scan-filter');
      const rows = Array.from(document.querySelectorAll('#scan-table-body tr[data-filter]'));
      input?.addEventListener('input', () => {
        const query = input.value.trim().toLowerCase();
        rows.forEach((row) => {
          row.style.display = !query || row.dataset.filter.includes(query) ? '' : 'none';
        });
      });
    </script>
  </body>
</html>`;
}

export async function loadArchiveHistory(pathname) {
  try {
    const content = await fs.readFile(pathname, "utf8");
    return JSON.parse(content);
  } catch {
    return { version: 1, updatedAt: null, scans: [] };
  }
}

export async function writeArchiveSite(outputDir, history) {
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(path.join(outputDir, "index.html"), buildArchiveIndexHtml(history), "utf8");
  await fs.writeFile(path.join(outputDir, "history.json"), JSON.stringify(history, null, 2), "utf8");
}

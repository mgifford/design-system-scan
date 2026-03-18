import fs from "node:fs/promises";
import path from "node:path";

function escapeHtml(value) {
  return String(value)
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
  }[status] ?? "absent";

  return `<span class="badge badge--${tone}">${escapeHtml(status)}</span>`;
}

function topMatches(items, limit = 8) {
  return (items ?? [])
    .filter((item) => item.status !== "absent")
    .sort((left, right) => right.coverage - left.coverage)
    .slice(0, limit);
}

function renderMatchList(title, items) {
  const matches = topMatches(items);

  if (matches.length === 0) {
    return `<section><h4>${escapeHtml(title)}</h4><p class="muted">No strong matches detected.</p></section>`;
  }

  const rows = matches
    .map((item) => {
      const evidence = item.matchedSignals
        .slice(0, 2)
        .map((signal) => escapeHtml(signal.value))
        .join(" | ");
      const missing = (item.missingSignals ?? [])
        .slice(0, 3)
        .map((signal) => escapeHtml(signal.label))
        .join(" | ");

      return `
        <tr>
          <td>${escapeHtml(item.name)}</td>
          <td>${statusBadge(item.status)}</td>
          <td>${formatPercent(item.coverage)}</td>
          <td>${evidence || "<span class=\"muted\">None</span>"}</td>
          <td>${missing || "<span class=\"muted\">None</span>"}</td>
        </tr>
      `;
    })
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

function renderPageRow(page) {
  const pageUrl = escapeHtml(page.url);
  const versions = page.versions?.length ? page.versions.join(", ") : "none";
  const error = page.error ? `<p class="error">${escapeHtml(page.error)}</p>` : "";
  const assetErrors = (page.assetInventory?.assetErrors ?? [])
    .slice(0, 5)
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");

  return `
    <tr>
      <td><a href="${pageUrl}">${pageUrl}</a></td>
      <td>${page.error ? '<span class="badge badge--absent">error</span>' : statusBadge(page.siteFingerprint.status)}</td>
      <td>${page.error ? "0%" : formatPercent(page.siteFingerprint.coverage)}</td>
      <td>${page.error ? "0" : page.summary.fullComponentCount}</td>
      <td>${page.error ? "0" : page.summary.partialComponentCount}</td>
      <td>${page.error ? "0" : page.summary.matchedTemplateCount}</td>
      <td>${escapeHtml(versions)}</td>
      <td>
        <details>
          <summary>Details</summary>
          ${error}
          ${
            page.error
              ? ""
              : `
                <p><strong>Adoption:</strong> ${page.summary.fullComponentCount} full, ${page.summary.partialComponentCount} partial, ${formatPercent(page.summary.overallCoverage)} overall</p>
                ${renderMatchList("Components", page.components)}
                ${renderMatchList("Templates", page.templates)}
                ${
                  assetErrors
                    ? `<section><h4>Asset fetch issues</h4><ul>${assetErrors}</ul></section>`
                    : ""
                }
              `
          }
        </details>
      </td>
    </tr>
  `;
}

function renderSummaryTable(title, items, countLabel) {
  if (!items?.length) {
    return "";
  }

  const rows = items
    .slice(0, 20)
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.name)}</td>
          <td>${item.full}</td>
          <td>${item.partial}</td>
        </tr>
      `
    )
    .join("");

  return `
    <section>
      <h3>${escapeHtml(title)}</h3>
      <p class="muted">${escapeHtml(countLabel)}</p>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Full</th>
              <th>Partial</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </section>
  `;
}

export function buildDashboardHtml(report, metadata) {
  const pageRows = report.pages.map(renderPageRow).join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Design System Scan Dashboard</title>
    <style>
      :root { color-scheme: light; }
      body { margin: 0; font-family: ui-sans-serif, system-ui, sans-serif; color: #112e51; background: linear-gradient(180deg, #f3f7fb 0%, #f7f7f2 100%); }
      main { max-width: 92rem; margin: 0 auto; padding: 2rem 1rem 4rem; }
      .hero { background: white; border: 1px solid #dfe1e2; box-shadow: 0 12px 32px rgba(0,0,0,.06); padding: 1.5rem; margin-bottom: 1.5rem; }
      .hero h1 { margin-top: 0; margin-bottom: .5rem; font-size: 2rem; }
      .hero p { margin-top: 0; }
      .meta { display: grid; grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr)); gap: 1rem; margin-top: 1rem; }
      .meta-card { background: #f8fbff; border: 1px solid #d9e8f6; padding: .9rem; }
      .meta-card strong { display: block; font-size: .8rem; text-transform: uppercase; letter-spacing: .04em; color: #5c6f82; margin-bottom: .35rem; }
      section { background: white; border: 1px solid #dfe1e2; box-shadow: 0 12px 32px rgba(0,0,0,.04); padding: 1rem; margin-bottom: 1rem; }
      h2, h3, h4 { margin-top: 0; }
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
      details { margin-top: .5rem; }
      details summary { cursor: pointer; font-weight: 700; }
      a { color: #005ea2; }
      pre { white-space: pre-wrap; overflow-wrap: anywhere; background: #112e51; color: #f0f7ff; padding: 1rem; border-radius: .25rem; }
    </style>
  </head>
  <body>
    <main>
      <section class="hero">
        <h1>Design System Scan Dashboard</h1>
        <p>Compact view for scan results, with expandable details for component and template evidence.</p>
        <p><a href="${escapeHtml(metadata.runUrl)}">View workflow run</a> · <a href="./report.txt">Plain text report</a> · <a href="./scan.json">JSON report</a></p>
        <div class="meta">
          <div class="meta-card"><strong>Trigger</strong>${escapeHtml(metadata.trigger)}</div>
          <div class="meta-card"><strong>Seed URL</strong>${escapeHtml(metadata.url)}</div>
          <div class="meta-card"><strong>System</strong>${escapeHtml(metadata.system)}</div>
          <div class="meta-card"><strong>Pages scanned</strong>${report.siteSummary.successfulPageCount}/${report.siteSummary.pageCount}</div>
          <div class="meta-card"><strong>Fingerprint pages</strong>${report.siteSummary.fingerprintedPageCount}</div>
          <div class="meta-card"><strong>Max pages</strong>${escapeHtml(metadata.maxPages)}</div>
        </div>
      </section>

      ${renderSummaryTable("Site-wide component tells", report.siteSummary.components, "Top signals across all scanned pages.")}
      ${renderSummaryTable("Site-wide template tells", report.siteSummary.templates, "Top template matches across all scanned pages.")}

      <section>
        <h3>Scanned pages</h3>
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
            <tbody>${pageRows}</tbody>
          </table>
        </div>
      </section>
    </main>
  </body>
</html>`;
}

export async function writeDashboardSite(outputDir, report, metadata) {
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(path.join(outputDir, "index.html"), buildDashboardHtml(report, metadata), "utf8");
  await fs.writeFile(path.join(outputDir, "report.txt"), metadata.reportText, "utf8");
  await fs.writeFile(path.join(outputDir, "scan.json"), JSON.stringify(report, null, 2), "utf8");
}

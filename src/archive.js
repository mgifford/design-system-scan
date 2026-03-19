import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPORTS_ROOT_DIR = "reports";
const ARCHIVES_ROOT_DIR = "archives";
const CURRENT_REPORT_WINDOW_DAYS = 31;
const DESIGN_SYSTEMS_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "data",
  "design-systems"
);
const DESIGN_SYSTEM_MATRIX_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "data",
  "design-system-component-matrix.json"
);

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function formatPercent(value) {
  return `${Math.round((value ?? 0) * 100)}%`;
}

function slugify(value) {
  return String(value ?? "unknown")
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "") || "unknown";
}

function extractIssueNumber(scan) {
  if (scan.issueNumber) {
    return String(scan.issueNumber);
  }

  const match = /^issue-(\d+)$/iu.exec(String(scan.trigger ?? ""));
  return match?.[1] ?? null;
}

function formatScanDateSlug(value) {
  const parsed = new Date(value ?? "");
  if (Number.isNaN(parsed.getTime())) {
    return slugify(value ?? "unknown-date");
  }

  return parsed.toISOString().replaceAll(":", "-").replaceAll(".", "-");
}

export function getScanReportRelativeDir(scan) {
  const issueNumber = extractIssueNumber(scan);

  if (issueNumber) {
    return `${REPORTS_ROOT_DIR}/issues/issue-${issueNumber}/run-${scan.runId}`;
  }

  return `${REPORTS_ROOT_DIR}/triggers/${slugify(scan.trigger)}/run-${scan.runId}`;
}

export function getScanReportPaths(scan) {
  const relativeDir = getScanReportRelativeDir(scan);

  return {
    relativeDir,
    html: `${relativeDir}/report.html`,
    markdown: `${relativeDir}/report.md`,
    csv: `${relativeDir}/report.csv`,
    json: `${relativeDir}/report.json`,
    latestAlias: scan.runId ? `${REPORTS_ROOT_DIR}/runs/${scan.runId}/index.html` : null,
  };
}

export function getScanArchiveRelativeDir(scan) {
  const issueNumber = extractIssueNumber(scan);
  const dateSlug = formatScanDateSlug(scan.scannedAt);

  if (issueNumber) {
    return `${ARCHIVES_ROOT_DIR}/issues/issue-${issueNumber}/${dateSlug}`;
  }

  return `${ARCHIVES_ROOT_DIR}/triggers/${slugify(scan.trigger)}/${dateSlug}`;
}

export function getScanArchivePaths(scan) {
  const relativeDir = getScanArchiveRelativeDir(scan);

  return {
    relativeDir,
    zip: `${relativeDir}/report-package.zip`,
  };
}

function toArchiveRelativePath(value) {
  const pathname = String(value ?? "");
  const prefix = `${REPORTS_ROOT_DIR}/`;
  return pathname.startsWith(prefix) ? pathname.slice(prefix.length) : pathname;
}

function renderSiteNav(homeHref, reportsHref, latestHref, archivesHref = null, navClass = "site-nav") {
  return `
    <nav class="${escapeHtml(navClass)}" aria-label="Site">
      <ul>
        <li><a href="${escapeHtml(homeHref)}">Project home</a></li>
        <li><a href="${escapeHtml(reportsHref)}">Reports</a></li>
        <li><a href="${escapeHtml(latestHref)}">Latest report</a></li>
        ${archivesHref ? `<li><a href="${escapeHtml(archivesHref)}">Archives</a></li>` : ""}
      </ul>
    </nav>
  `;
}

function renderProjectFooter() {
  return `
      <section>
        <h2>Project</h2>
        <p class="footer-note">This site is part of the open source <a href="https://github.com/mgifford/design-system-scan">design-system-scan</a> project. Join the community on GitHub to improve scanner coverage, review results, and help grow the shared public-sector design system knowledge base.</p>
      </section>
  `;
}

function renderAnchoredHeading(level, text, id) {
  return `
    <div class="heading-anchor-group">
      <h${level} id="${escapeHtml(id)}">${escapeHtml(text)}</h${level}>
      <a class="heading-anchor" href="#${escapeHtml(id)}" aria-label="Copy link to ${escapeHtml(text)} section">#</a>
    </div>
  `;
}

function buildReportsLandingHtml() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Design System Scan Reports</title>
    <style>
      body { margin: 0; font-family: ui-sans-serif, system-ui, sans-serif; color: #112e51; background: linear-gradient(180deg, #eef5fb 0%, #f7f7f2 100%); }
      .landing-nav { max-width: 60rem; margin: 0 auto; padding: 1rem 1rem 0; }
      .landing-nav ul { list-style: none; padding: 0; margin: 0; display: flex; gap: 1rem; flex-wrap: wrap; }
      main { max-width: 60rem; margin: 0 auto; padding: 3rem 1rem 4rem; }
      section { background: #fff; border: 1px solid #d0d7de; box-shadow: 0 12px 32px rgba(17, 46, 81, .08); padding: 1.25rem 1.5rem; margin-bottom: 1rem; }
      .heading-anchor-group { display: flex; align-items: baseline; gap: .5rem; }
      .heading-anchor { opacity: 0; text-decoration: none; }
      .heading-anchor-group:hover .heading-anchor, .heading-anchor:focus { opacity: 1; }
      .actions { display: flex; gap: .75rem; flex-wrap: wrap; margin-top: 1rem; }
      .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr)); gap: 1rem; }
      .card-link { color: inherit; text-decoration: none; }
      .card { background: #f8fbff; border: 1px solid #d0d7de; padding: 1rem; height: 100%; }
      .card-link:hover .card, .card-link:focus-visible .card { border-color: #005ea2; box-shadow: 0 0 0 3px rgba(0, 94, 162, .16); }
      .card h3, section h2 { margin-top: 0; }
      ul { padding-left: 1.25rem; }
      li { margin-bottom: .4rem; }
      p, li { line-height: 1.55; }
      code { background: #f0f4f8; padding: .1rem .3rem; border-radius: .2rem; }
      a.button { display: inline-block; padding: .6rem .9rem; border-radius: .35rem; background: #005ea2; color: #fff; text-decoration: none; }
      a.button.secondary { background: #fff; color: #005ea2; border: 1px solid #005ea2; }
    </style>
  </head>
  <body>
    ${renderSiteNav("./", "./reports/", "./reports/latest/", "./archives/", "landing-nav")}
    <main>
      <section>
        ${renderAnchoredHeading(1, "Design System Scan Reports", "top")}
        <p>This project helps track where public-sector design systems are actually being used, and how faithfully their patterns are being implemented across real sites.</p>
        <div class="actions">
          <a class="button" href="./reports/">Open reports</a>
          <a class="button secondary" href="./archives/">Open archives</a>
          <a class="button secondary" href="./reports/latest/">Open latest scan</a>
        </div>
      </section>

      <section>
        ${renderAnchoredHeading(2, "Why This Matters", "why-this-matters")}
        <p>Design systems are hard-coded organizational good practices. They package accessibility, consistency, usability, and maintainability into reusable patterns so teams do not need to solve the same problems from scratch on every page.</p>
        <p>From an accessibility point of view, this matters because tested components can encode better semantics, keyboard support, focus management, color contrast expectations, error handling, and naming patterns. But having a design system is not enough on its own. The open question is where those patterns are actually implemented, and how faithfully they are implemented in production.</p>
        <p>This scanner is meant to help answer that question. It creates a feedback loop between documented patterns and real-world adoption by surfacing which design-system tells appear on a site, which components look fully or partially aligned, and where adoption appears to be missing or drifting.</p>
      </section>

      <section>
        ${renderAnchoredHeading(2, "Currently Supported", "currently-supported")}
        <p>Each card links to a reference page with the official docs, indexed component inventory, and current scanner support. You can also compare systems side by side to see which ones define similar components and where semantic patterns appear to be converging.</p>
        <div class="grid">
          <a class="card-link" href="./systems/uswds/">
            <div class="card">
              <h3>USWDS</h3>
              <p>U.S. Web Design System support is the most mature and includes broad component coverage plus full/partial detection.</p>
            </div>
          </a>
          <a class="card-link" href="./systems/va/">
            <div class="card">
              <h3>VA.gov</h3>
              <p>VA detection focuses on the VA Design System and its Web Components-based patterns.</p>
            </div>
          </a>
          <a class="card-link" href="./systems/cms/">
            <div class="card">
              <h3>CMS Design System</h3>
              <p>CMS detection includes the shared CMS design-system family and theme identification for Core, CMS.gov, HealthCare.gov, and Medicare.gov.</p>
            </div>
          </a>
          <a class="card-link" href="./systems/govuk/">
            <div class="card">
              <h3>GOV.UK</h3>
              <p>GOV.UK detection provides a starter footprint for the GOV.UK Design System and its frontend conventions.</p>
            </div>
          </a>
          <a class="card-link" href="./systems/nlds/">
            <div class="card">
              <h3>NL Design System</h3>
              <p>NL Design System detection provides starter support for the Netherlands government design-system family and its official component inventory.</p>
            </div>
          </a>
          <a class="card-link" href="./systems/gcds/">
            <div class="card">
              <h3>GC Design System</h3>
              <p>GC Design System detection provides starter support for the Government of Canada web components and the official GC component inventory.</p>
            </div>
          </a>
          <a class="card-link" href="./comparison/">
            <div class="card">
              <h3>Design System Comparison</h3>
              <p>Compare component families across all tracked systems, including where Breadcrumbs and other patterns appear to be semantically aligned.</p>
            </div>
          </a>
        </div>
      </section>

      <section>
        ${renderAnchoredHeading(2, "How To Read A Report", "how-to-read-a-report")}
        <ul>
          <li><strong>Reports:</strong> The reports index at <code>/reports/</code> shows the latest report for each trigger from the last month.</li>
          <li><strong>Archives:</strong> The archive at <code>/archives/</code> keeps older runs available as downloadable packages organized by trigger and date.</li>
          <li><strong>Latest:</strong> The latest dashboard shows the newest run in a more focused single-run view.</li>
          <li><strong>Detected system:</strong> This is the design system the scanner thinks best matches the submitted site.</li>
          <li><strong>Pages with design system fingerprint:</strong> These are pages where the scanner found enough evidence to treat the design system as present.</li>
          <li><strong>Components identified:</strong> This shows how many distinct component types were found, including whether the strongest evidence was full or partial.</li>
          <li><strong>Stable report links:</strong> Each issue-triggered scan publishes HTML, Markdown, CSV, and JSON outputs so the exact result of a run can be reviewed later.</li>
        </ul>
      </section>

      <section>
        ${renderAnchoredHeading(2, "What This Project Is Trying To Track", "what-this-project-tracks")}
        <p>Organizations are developing and publishing design patterns to solve real internal needs, but it is often unclear how broadly those patterns have been adopted, whether teams are using the official components or local variations, and whether there is a feedback loop between documented guidance and production use.</p>
        <p>This project is an attempt to make that visible. It is not a conformance checker or an accessibility certification tool. It is a way to observe adoption, compare implementations, and create better evidence about how design systems are being used in practice.</p>
      </section>
      ${renderProjectFooter()}
    </main>
  </body>
</html>`;
}

function buildIssueAliasPath(scan) {
  const issueNumber = extractIssueNumber(scan);
  if (!issueNumber) {
    return null;
  }

  return `${REPORTS_ROOT_DIR}/${issueNumber}/index.html`;
}

function buildIssueDateAliasPath(scan) {
  const issueNumber = extractIssueNumber(scan);
  if (!issueNumber) {
    return null;
  }

  return `${REPORTS_ROOT_DIR}/${issueNumber}/${formatScanDateSlug(scan.scannedAt)}/index.html`;
}

function getProposedVersion(scan) {
  for (const page of scan.pages ?? []) {
    if (page?.versions?.length) {
      return page.versions[0];
    }
  }

  return null;
}

function buildComponentDocUrl(systemId, componentId, inventory) {
  const primaryDocsUrl = inventory.docs?.[0] ?? inventory.homepage;

  if (systemId === "uswds") {
    return `https://designsystem.digital.gov/components/${componentId}/`;
  }

  if (systemId === "govuk") {
    return `https://design-system.service.gov.uk/components/${componentId}/`;
  }

  if (systemId === "cms") {
    return `https://design.cms.gov/components/${componentId}/`;
  }

  if (systemId === "va") {
    return `https://design.va.gov/components/${componentId}`;
  }

  if (systemId === "gcds") {
    return `https://design-system.canada.ca/en/components/${componentId}/`;
  }

  return primaryDocsUrl;
}

function buildComponentSummary(name) {
  const value = String(name ?? "").toLowerCase();

  if (value.includes("accordion")) return "Expandable and collapsible content sections.";
  if (value.includes("alert")) return "Prominent status, warning, or success messaging.";
  if (value.includes("banner")) return "High-visibility site or service messaging and identity.";
  if (value.includes("breadcrumb")) return "Hierarchical navigation trail for page location.";
  if (value.includes("button")) return "Primary user action trigger.";
  if (value.includes("card")) return "Grouped content container or summary block.";
  if (value.includes("checkbox")) return "Multiple-choice form selection control.";
  if (value.includes("date")) return "Date entry or date selection control.";
  if (value.includes("details")) return "Progressively disclosed supporting content.";
  if (value.includes("dialog") || value.includes("modal")) return "Overlay dialog for focused interaction.";
  if (value.includes("dropdown") || value.includes("select")) return "Single-select form control.";
  if (value.includes("error")) return "Validation or problem feedback for users.";
  if (value.includes("fieldset")) return "Structural grouping for related form fields.";
  if (value.includes("file")) return "File upload control.";
  if (value.includes("footer")) return "Global page footer content and navigation.";
  if (value.includes("header")) return "Global site header and top-level navigation.";
  if (value.includes("hint") || value.includes("tooltip")) return "Supporting explanatory guidance.";
  if (value.includes("icon")) return "Decorative or semantic iconography.";
  if (value.includes("input") || value.includes("text field") || value.includes("textarea")) return "Freeform user input control.";
  if (value.includes("link")) return "Navigational link or action link pattern.";
  if (value.includes("list")) return "Structured list, steps, or grouped items.";
  if (value.includes("navigation") || value.includes("nav")) return "Navigation within a site, section, or page.";
  if (value.includes("pagination")) return "Navigation between result or content pages.";
  if (value.includes("panel") || value.includes("summary box") || value.includes("summary")) return "Grouped summary or emphasis container.";
  if (value.includes("progress")) return "Progress indicator for steps or activity.";
  if (value.includes("radio")) return "Single-choice form selection control.";
  if (value.includes("search")) return "Search input and query submission pattern.";
  if (value.includes("skip")) return "Keyboard shortcut to bypass repeated blocks.";
  if (value.includes("snackbar") || value.includes("notification")) return "Short-lived or contextual notification message.";
  if (value.includes("table")) return "Tabular data presentation.";
  if (value.includes("tabs")) return "Switching between related interface panels.";
  if (value.includes("tag") || value.includes("badge")) return "Compact label for status or categorization.";
  if (value.includes("telephone")) return "Phone number display or entry pattern.";

  return "See upstream docs for the official definition and usage guidance.";
}

function getInventoryComponents(inventory) {
  return inventory.officialComponents ?? inventory.currentComponents ?? [];
}

function renderDesignSystemPage(inventory) {
  const components = getInventoryComponents(inventory);
  const indexedIds = new Set(inventory.scannerCoverage?.indexedComponentIds ?? []);
  const componentRows = components
    .map((component) => {
      const docUrl = buildComponentDocUrl(inventory.id, component.id, inventory);
      return `
        <tr id="component-${escapeHtml(component.id)}">
          <td>${escapeHtml(component.name)}</td>
          <td>${escapeHtml(component.id)}</td>
          <td>${indexedIds.has(component.id) ? "Yes" : "Not yet"}</td>
          <td>${escapeHtml(buildComponentSummary(component.name))}</td>
          <td><a href="${escapeHtml(docUrl)}">Upstream docs</a></td>
        </tr>
      `;
    })
    .join("");

  const docsLinks = (inventory.docs ?? [])
    .map((url) => `<li><a href="${escapeHtml(url)}">${escapeHtml(url)}</a></li>`)
    .join("");

  const notes = (inventory.notes ?? [])
    .map((note) => `<li>${escapeHtml(note)}</li>`)
    .join("");

  const themes = (inventory.themes ?? [])
    .map((theme) => `<li>${escapeHtml(theme.name)}</li>`)
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(inventory.name)}</title>
    <style>
      body { margin: 0; font-family: ui-sans-serif, system-ui, sans-serif; color: #112e51; background: #eef5fb; }
      .system-nav { max-width: 88rem; margin: 0 auto; padding: 1rem 1rem 0; }
      .system-nav ul { list-style: none; padding: 0; margin: 0; display: flex; gap: 1rem; flex-wrap: wrap; }
      main { max-width: 88rem; margin: 0 auto; padding: 1rem 1rem 4rem; }
      section { background: #fff; border: 1px solid #d0d7de; box-shadow: 0 12px 32px rgba(17, 46, 81, .08); padding: 1rem 1.25rem; margin-bottom: 1rem; }
      .heading-anchor-group { display: flex; align-items: baseline; gap: .5rem; }
      .heading-anchor { opacity: 0; text-decoration: none; }
      .heading-anchor-group:hover .heading-anchor, .heading-anchor:focus { opacity: 1; }
      .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr)); gap: .75rem; }
      .stat { background: #f8fbff; border: 1px solid #d0d7de; padding: .85rem; }
      .stat strong { display: block; color: #5c6f82; font-size: .8rem; text-transform: uppercase; letter-spacing: .04em; margin-bottom: .25rem; }
      table { width: 100%; border-collapse: collapse; }
      th, td { text-align: left; vertical-align: top; padding: .65rem .5rem; border-bottom: 1px solid #d0d7de; }
      th { font-size: .8rem; text-transform: uppercase; letter-spacing: .04em; color: #5c6f82; }
      .table-wrap { overflow-x: auto; }
      a { color: #005ea2; }
      ul { margin: .25rem 0 0 1.25rem; }
      .footer-note { font-size: .95rem; }
    </style>
  </head>
  <body>
    ${renderSiteNav("../../", "../../reports/", "../../reports/latest/", "../../archives/", "system-nav")}
    <main>
      <section>
        ${renderAnchoredHeading(1, inventory.name, `${inventory.id}-top`)}
        <p><strong>Homepage:</strong> <a href="${escapeHtml(inventory.homepage)}">${escapeHtml(inventory.homepage)}</a></p>
        <p><strong>Scanner coverage:</strong> ${escapeHtml(inventory.scannerCoverage?.status ?? "unknown")}</p>
        <p><strong>Inventory date:</strong> ${escapeHtml(inventory.inventoryDate ?? "unknown")}</p>
      </section>

      <section>
        <div class="stats">
          <div class="stat"><strong>Defined components</strong>${components.length}</div>
          <div class="stat"><strong>Indexed for scanning</strong>${indexedIds.size}</div>
          <div class="stat"><strong>Coverage status</strong>${escapeHtml(inventory.scannerCoverage?.status ?? "unknown")}</div>
        </div>
      </section>

      <section>
        ${renderAnchoredHeading(2, "Official documentation", "official-documentation")}
        <ul>${docsLinks}</ul>
        ${themes ? `<h3>Themes</h3><ul>${themes}</ul>` : ""}
        ${notes ? `<h3>Notes</h3><ul>${notes}</ul>` : ""}
      </section>

      <section>
        ${renderAnchoredHeading(2, "Indexed components", "indexed-components")}
        <p>This list shows the components defined for this design system, whether the current scanner can search for them yet, where they are defined upstream, and a short explanation of what each component is for.</p>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Component</th>
                <th>ID</th>
                <th>Scanner support</th>
                <th>What it does</th>
                <th>Defined at</th>
              </tr>
            </thead>
            <tbody>${componentRows}</tbody>
          </table>
        </div>
      </section>

      ${renderProjectFooter()}
    </main>
  </body>
</html>`;
}

async function loadDesignSystemInventories() {
  const entries = await fs.readdir(DESIGN_SYSTEMS_DIR);
  const jsonEntries = entries.filter((entry) => entry.endsWith(".json")).sort();
  const inventories = [];

  for (const entry of jsonEntries) {
    const content = await fs.readFile(path.join(DESIGN_SYSTEMS_DIR, entry), "utf8");
    inventories.push(JSON.parse(content));
  }

  return inventories;
}

async function loadDesignSystemComparisonMatrix() {
  const content = await fs.readFile(DESIGN_SYSTEM_MATRIX_PATH, "utf8");
  return JSON.parse(content);
}

function summarizeStatus(status, components) {
  const values = components?.length ? components.join(", ") : "none";

  if (status === "direct") {
    return `Direct match: ${values}`;
  }

  if (status === "semantic") {
    return `Semantic equivalent: ${values}`;
  }

  return "Not currently mapped";
}

function renderComparisonStatusCell(entry) {
  if (!entry || entry.status === "none") {
    return `<span class="muted">No mapped component</span>`;
  }

  const badgeTone = entry.status === "semantic" ? "partial" : "full";
  const label = entry.status === "semantic" ? "semantic" : "direct";
  const componentList = entry.components.map(escapeHtml).join(", ");

  return `
    <span class="badge badge--${badgeTone}">${escapeHtml(label)}</span>
    <div>${componentList}</div>
  `;
}

function renderCmsThemeSummary(themes) {
  const labels = Object.entries(themes ?? {})
    .filter(([, value]) => value === "Y")
    .map(([key]) => key);

  if (!labels.length) {
    return '<span class="muted">No current theme match</span>';
  }

  return escapeHtml(labels.join(", "));
}

function renderComparisonPage(matrix) {
  const systems = matrix.systems ?? [];
  const semanticFamilies = matrix.semanticFamilies ?? [];
  const defaultSelectedIds = systems.slice(0, Math.min(5, systems.length)).map((system) => system.id);
  const systemSelector = systems
    .map((system) => {
      const checked = defaultSelectedIds.includes(system.id) ? " checked" : "";
      return `
        <label class="system-filter-option">
          <input
            type="checkbox"
            class="system-filter-checkbox"
            data-system-checkbox
            value="${escapeHtml(system.id)}"${checked}
          >
          <span>${escapeHtml(system.name)}</span>
        </label>
      `;
    })
    .join("");
  const systemHeaderCells = systems
    .map(
      (system) => `<th data-system-column="${escapeHtml(system.id)}">${escapeHtml(system.name)}</th>`
    )
    .join("");
  const familyRows = semanticFamilies
    .map((family) => {
      const systemCells = systems
        .map(
          (system) =>
            `<td data-system-cell="${escapeHtml(system.id)}">${renderComparisonStatusCell(family.systems?.[system.id])}</td>`
        )
        .join("");

      return `
        <tr id="family-${escapeHtml(family.id)}">
          <td>
            <strong>${escapeHtml(family.name)}</strong>
            <div class="muted">${escapeHtml(family.id)}</div>
          </td>
          <td>${escapeHtml(family.pattern ?? "Unknown")}</td>
          ${systemCells}
          <td>${renderCmsThemeSummary(family.cmsThemes)}</td>
        </tr>
      `;
    })
    .join("");

  const notes = (matrix.notes ?? [])
    .map((note) => `<li>${escapeHtml(note)}</li>`)
    .join("");

  const semanticSummaryRows = semanticFamilies
    .map((family) => {
      const directCount = systems.filter((system) => family.systems?.[system.id]?.status === "direct").length;
      const semanticCount = systems.filter((system) => family.systems?.[system.id]?.status === "semantic").length;

      return `
        <tr>
          <td>${escapeHtml(family.name)}</td>
          <td>${escapeHtml(family.pattern ?? "Unknown")}</td>
          <td>${directCount}</td>
          <td>${semanticCount}</td>
        </tr>
      `;
    })
    .join("");

  const systemSummaryRows = systems
    .map((system) => {
      const directFamilies = semanticFamilies.filter((family) => family.systems?.[system.id]?.status === "direct");
      const semanticFamiliesForSystem = semanticFamilies.filter(
        (family) => family.systems?.[system.id]?.status === "semantic"
      );

      return `
        <tr data-system-row="${escapeHtml(system.id)}">
          <td>${escapeHtml(system.name)}</td>
          <td>${directFamilies.length}</td>
          <td>${semanticFamiliesForSystem.length}</td>
          <td>${escapeHtml(directFamilies.map((family) => family.name).join(", ") || "None")}</td>
        </tr>
      `;
    })
    .join("");

  const breadcrumbFamily = semanticFamilies.find((family) => family.id === "breadcrumb");
  const breadcrumbSummary = systems
    .map((system) => {
      const entry = breadcrumbFamily?.systems?.[system.id];
      return `<li data-system-item="${escapeHtml(system.id)}"><strong>${escapeHtml(system.name)}:</strong> ${escapeHtml(summarizeStatus(entry?.status, entry?.components))}</li>`;
    })
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Design System Comparison</title>
    <style>
      body { margin: 0; font-family: ui-sans-serif, system-ui, sans-serif; color: #112e51; background: #eef5fb; }
      .comparison-nav { max-width: 96rem; margin: 0 auto; padding: 1rem 1rem 0; }
      .comparison-nav ul { list-style: none; padding: 0; margin: 0; display: flex; gap: 1rem; flex-wrap: wrap; }
      main { max-width: 96rem; margin: 0 auto; padding: 1rem 1rem 4rem; }
      section { background: #fff; border: 1px solid #d0d7de; box-shadow: 0 12px 32px rgba(17, 46, 81, .08); padding: 1rem 1.25rem; margin-bottom: 1rem; }
      .heading-anchor-group { display: flex; align-items: baseline; gap: .5rem; }
      .heading-anchor { opacity: 0; text-decoration: none; }
      .heading-anchor-group:hover .heading-anchor, .heading-anchor:focus { opacity: 1; }
      .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr)); gap: .75rem; }
      .stat { background: #f8fbff; border: 1px solid #d0d7de; padding: .85rem; }
      .stat strong { display: block; color: #5c6f82; font-size: .8rem; text-transform: uppercase; letter-spacing: .04em; margin-bottom: .25rem; }
      table { width: 100%; border-collapse: collapse; }
      th, td { text-align: left; vertical-align: top; padding: .65rem .5rem; border-bottom: 1px solid #d0d7de; }
      th { font-size: .8rem; text-transform: uppercase; letter-spacing: .04em; color: #5c6f82; }
      .table-wrap { overflow-x: auto; }
      a { color: #005ea2; }
      ul { margin: .25rem 0 0 1.25rem; }
      .badge { display: inline-block; padding: .15rem .45rem; border-radius: 999px; font-size: .8rem; font-weight: 700; text-transform: uppercase; margin-bottom: .3rem; }
      .badge--full { background: #dff6dd; color: #17603a; }
      .badge--partial { background: #fff4cc; color: #7a5300; }
      .muted { color: #5c6f82; }
      .system-filter-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr)); gap: .75rem; }
      .system-filter-option { display: flex; align-items: center; gap: .6rem; border: 1px solid #d0d7de; background: #f8fbff; padding: .75rem .9rem; border-radius: .5rem; }
      .system-filter-checkbox { width: 1rem; height: 1rem; }
      .filter-status { margin-top: .75rem; color: #5c6f82; }
      .footer-note { font-size: .95rem; }
    </style>
  </head>
  <body>
    ${renderSiteNav("../", "../reports/", "../reports/latest/", "../archives/", "comparison-nav")}
    <main>
      <section>
        ${renderAnchoredHeading(1, "Design system comparison", "top")}
        <p>This page compares the design systems currently modeled by the scanner. It is meant to answer practical questions like “Which systems define Breadcrumbs?” and “Where are different organizations settling on the same semantic pattern?”</p>
        <p>The comparison is organized around semantic component families rather than product-specific naming. That makes it easier to see when systems use different component IDs for essentially the same thing, and where they still diverge.</p>
      </section>

      <section>
        <div class="stats">
          <div class="stat"><strong>Tracked systems</strong><span id="tracked-system-count">${systems.length}</span></div>
          <div class="stat"><strong>Semantic families</strong>${semanticFamilies.length}</div>
          <div class="stat"><strong>Matrix version</strong>${escapeHtml(matrix.version ?? "unknown")}</div>
        </div>
      </section>

      <section>
        ${renderAnchoredHeading(2, "Choose systems to compare", "choose-systems-to-compare")}
        <p>Select between 2 and 5 systems. The comparison tables below will update immediately so it is easier to focus on the systems you care about.</p>
        <fieldset>
          <legend class="muted">Design systems included in this comparison</legend>
          <div class="system-filter-grid">
            ${systemSelector}
          </div>
        </fieldset>
        <p id="comparison-filter-status" class="filter-status" aria-live="polite">Showing ${defaultSelectedIds.length} systems.</p>
      </section>

      <section>
        ${renderAnchoredHeading(2, "Example: Breadcrumbs", "breadcrumbs-example")}
        <p>Breadcrumbs are a good example of broad semantic convergence. The scanner currently maps them like this:</p>
        <ul>${breadcrumbSummary}</ul>
      </section>

      <section>
        ${renderAnchoredHeading(2, "Semantic convergence summary", "semantic-convergence-summary")}
        <p>This table shows how many systems have a direct component mapping for each family, and how many only have a semantic equivalent. Families with more direct mappings are stronger candidates for shared pattern expectations across systems.</p>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Component family</th>
                <th>Pattern</th>
                <th>Direct mappings</th>
                <th>Semantic equivalents</th>
              </tr>
            </thead>
            <tbody>${semanticSummaryRows}</tbody>
          </table>
        </div>
      </section>

      <section>
        ${renderAnchoredHeading(2, "Systems at a glance", "systems-at-a-glance")}
        <p>This summarizes how many semantic families each design system currently maps directly or semantically in the scanner.</p>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>System</th>
                <th>Direct families</th>
                <th>Semantic-only families</th>
                <th>Directly mapped families</th>
              </tr>
            </thead>
            <tbody>${systemSummaryRows}</tbody>
          </table>
        </div>
      </section>

      <section>
        ${renderAnchoredHeading(2, "Component family matrix", "component-family-matrix")}
        <p>Each row is a semantic family. “Direct” means the system defines a closely matching component. “Semantic” means the system appears to cover the same need with a different pattern or naming convention. The CMS theme column shows whether the family is present across Core, CMS.gov, HealthCare.gov, and Medicare.gov.</p>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Component family</th>
                <th>Convergence</th>
                ${systemHeaderCells}
                <th>CMS themes</th>
              </tr>
            </thead>
            <tbody>${familyRows}</tbody>
          </table>
        </div>
      </section>

      <section>
        ${renderAnchoredHeading(2, "Notes", "notes")}
        <ul>${notes}</ul>
      </section>

      ${renderProjectFooter()}
    </main>
    <script>
      (() => {
        const checkboxes = Array.from(document.querySelectorAll('[data-system-checkbox]'));
        const minSelected = Math.min(2, checkboxes.length);
        const maxSelected = Math.min(5, checkboxes.length);
        const status = document.getElementById('comparison-filter-status');
        const trackedCount = document.getElementById('tracked-system-count');
        const columnCells = Array.from(document.querySelectorAll('[data-system-column], [data-system-cell]'));
        const systemRows = Array.from(document.querySelectorAll('[data-system-row]'));
        const systemItems = Array.from(document.querySelectorAll('[data-system-item]'));

        function getSelectedIds() {
          return checkboxes.filter((checkbox) => checkbox.checked).map((checkbox) => checkbox.value);
        }

        function applySelection() {
          const selectedIds = new Set(getSelectedIds());

          for (const cell of columnCells) {
            const systemId = cell.getAttribute('data-system-column') || cell.getAttribute('data-system-cell');
            cell.hidden = !selectedIds.has(systemId);
          }

          for (const row of systemRows) {
            row.hidden = !selectedIds.has(row.getAttribute('data-system-row'));
          }

          for (const item of systemItems) {
            item.hidden = !selectedIds.has(item.getAttribute('data-system-item'));
          }

          if (trackedCount) {
            trackedCount.textContent = String(selectedIds.size);
          }

          if (status) {
            status.textContent = 'Showing ' + selectedIds.size + ' systems. Select between ' + minSelected + ' and ' + maxSelected + ' systems.';
          }
        }

        for (const checkbox of checkboxes) {
          checkbox.addEventListener('change', () => {
            const selectedCount = getSelectedIds().length;

            if (selectedCount < minSelected || selectedCount > maxSelected) {
              checkbox.checked = !checkbox.checked;
              if (status) {
                status.textContent = 'Please keep between ' + minSelected + ' and ' + maxSelected + ' systems selected.';
              }
              return;
            }

            applySelection();
          });
        }

        applySelection();
      })();
    </script>
  </body>
</html>`;
}

function renderDateCell(value, id) {
  const iso = String(value ?? "");
  const tooltipId = `tooltip-${id}`;

  return `
    <span class="tooltip-wrap" data-tooltip-wrap>
      <button
        type="button"
        class="tooltip-trigger tooltip-trigger--date"
        data-tooltip-trigger
        data-date="${escapeHtml(iso)}"
        aria-describedby="${escapeHtml(tooltipId)}"
        aria-expanded="false"
      >${escapeHtml(iso)}</button>
      <span
        id="${escapeHtml(tooltipId)}"
        role="tooltip"
        class="tooltip-bubble"
        data-tooltip
        data-tooltip-date="${escapeHtml(iso)}"
        hidden
      >${escapeHtml(iso)}</span>
    </span>
  `;
}

function renderTrigger(trigger, repository) {
  const value = String(trigger ?? "");
  const issueMatch = /^issue-(\d+)$/i.exec(value);

  if (issueMatch && repository) {
    const issueNumber = issueMatch[1];
    const issueUrl = `https://github.com/${repository}/issues/${issueNumber}`;
    return `<a href="${escapeHtml(issueUrl)}">Issue ${escapeHtml(issueNumber)}</a>`;
  }

  return escapeHtml(value);
}

function summarizeTopItems(items, limit = 6) {
  return (items ?? [])
    .slice(0, limit)
    .map((item) => {
      const segments = [];

      if (item.full) {
        segments.push(`${item.full} full`);
      }

      if (item.partial) {
        segments.push(`${item.partial} partial`);
      }

      const summary = segments.length ? segments.join(", ") : "0 matches";
      return `${item.name} (${summary})`;
    })
    .join("; ");
}

function getDetectedSystemName(scan) {
  return scan.systemInfo?.name ?? scan.system;
}

function renderDetectedSystemCell(scan) {
  const systemName = getDetectedSystemName(scan);
  const proposedVersion = getProposedVersion(scan);

  if (!proposedVersion) {
    return escapeHtml(systemName);
  }

  return `
    <div>${escapeHtml(systemName)}</div>
    <div class="muted">v${escapeHtml(proposedVersion)}</div>
  `;
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
    scannedAt: page.scannedAt ?? null,
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
  const baseEntry = {
    id: String(metadata.runId),
    repository: metadata.repository,
    runId: String(metadata.runId),
    runNumber: String(metadata.runNumber),
    runUrl: metadata.runUrl,
    scannedAt: report.pages[0]?.scannedAt ?? new Date().toISOString(),
    trigger: metadata.trigger,
    issueNumber: metadata.issueNumber ? String(metadata.issueNumber) : null,
    seedUrl: metadata.url,
    system: metadata.system,
    crawl: metadata.crawl,
    maxPages: Number(metadata.maxPages),
    acceptedUrls: Number(metadata.urlCount ?? 1),
    sha: metadata.sha,
    systemInfo: report.system,
    siteSummary: report.siteSummary,
    pages: report.pages.map(summarizePage),
  };

  return {
    ...baseEntry,
    reportPaths: getScanReportPaths(baseEntry),
    archivePaths: getScanArchivePaths(baseEntry),
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

function parseAssetError(item) {
  const value = String(item ?? "");
  const match = /^(https?:\/\/\S+):\s*(.+)$/u.exec(value);
  const url = match ? match[1] : "";
  const message = match ? match[2] : value;

  let filename = value;
  if (url) {
    try {
      const parsed = new URL(url);
      const segments = parsed.pathname.split("/").filter(Boolean);
      filename = segments.at(-1) ?? parsed.hostname;
    } catch {
      filename = url;
    }
  }

  return {
    url,
    filename,
    message,
  };
}

function renderAssetErrorTable(items) {
  if (!items?.length) {
    return "";
  }

  const rows = items
    .map((item) => {
      const asset = parseAssetError(item);
      const fileCell = asset.url
        ? `<a href="${escapeHtml(asset.url)}">${escapeHtml(asset.filename)}</a>`
        : escapeHtml(asset.filename);

      return `
        <tr>
          <td>${fileCell}</td>
          <td>${escapeHtml(asset.message)}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <section>
      <h4>Asset fetch issues</h4>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Asset</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </section>
  `;
}

function renderPageSections(pages) {
  return (pages ?? [])
    .map((page) => {
      const versions = (page.versions ?? []).length ? page.versions.join(", ") : "none";
      const assetErrors = renderAssetErrorTable(page.assetErrors ?? []);

      return `
        <section class="page-section">
          <h3><a href="${escapeHtml(page.url)}">${escapeHtml(page.url)}</a></h3>
          ${
            page.error
              ? `<p class="error">${escapeHtml(page.error)}</p>`
              : `
                <p><strong>Fingerprint:</strong> ${statusBadge(page.fingerprint.status)} ${formatPercent(page.fingerprint.coverage)}</p>
                <p><strong>Adoption:</strong> ${page.summary.fullComponentCount} full, ${page.summary.partialComponentCount} partial, ${page.summary.matchedTemplateCount} templates, ${formatPercent(page.summary.overallCoverage)} overall</p>
                <p><strong>Version clues:</strong> ${escapeHtml(versions)}</p>
                ${renderEvidenceTable("Components", page.components ?? [])}
                ${renderEvidenceTable("Templates", page.templates ?? [])}
                ${assetErrors}
              `
          }
        </section>
      `;
    })
    .join("");
}

function renderArchiveRows(scans) {
  return scans
    .map((scan) => {
      const componentSnapshot = summarizeTopItems(scan.siteSummary?.components, 6);
      const templateSnapshot = summarizeTopItems(scan.siteSummary?.templates, 4);
      const reportPaths = scan.reportPaths ?? getScanReportPaths(scan);
      const dateId = `scan-date-${escapeHtml(scan.id)}`;
      const systemFilterText = [getDetectedSystemName(scan), getProposedVersion(scan) ?? ""]
        .join(" ")
        .trim()
        .toLowerCase();

      return `
        <tr data-filter="${escapeHtml([scan.seedUrl, systemFilterText, scan.trigger].join(" ").toLowerCase())}" id="scan-${escapeHtml(scan.id)}">
          <td>${renderDateCell(scan.scannedAt, dateId)}</td>
          <td><a href="${escapeHtml(scan.seedUrl)}">${escapeHtml(scan.seedUrl)}</a></td>
          <td>${renderDetectedSystemCell(scan)}</td>
          <td>${renderTrigger(scan.trigger, scan.repository)}</td>
          <td>${scan.siteSummary?.successfulPageCount ?? 0}/${scan.siteSummary?.pageCount ?? 0}</td>
          <td>${scan.siteSummary?.fingerprintedPageCount ?? 0}</td>
          <td>${componentSnapshot ? escapeHtml(componentSnapshot) : '<span class="muted">None</span>'}</td>
          <td>${templateSnapshot ? escapeHtml(templateSnapshot) : '<span class="muted">None</span>'}</td>
          <td>
            <a class="button-link" href="${escapeHtml(toArchiveRelativePath(reportPaths.html))}">Details</a>
          </td>
        </tr>
      `;
    })
    .join("");
}

function getCurrentReportScans(history) {
  const scans = [...(history.scans ?? [])];
  const now = new Date(history.updatedAt ?? Date.now());
  const threshold = new Date(now.getTime() - CURRENT_REPORT_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const latestByTrigger = new Map();

  for (const scan of scans) {
    const scannedAt = new Date(scan.scannedAt ?? 0);
    if (Number.isNaN(scannedAt.getTime()) || scannedAt < threshold) {
      continue;
    }

    const issueNumber = extractIssueNumber(scan);
    const key = issueNumber ? `issue-${issueNumber}` : String(scan.trigger ?? "unknown");
    const current = latestByTrigger.get(key);

    if (!current || String(scan.scannedAt).localeCompare(String(current.scannedAt)) > 0) {
      latestByTrigger.set(key, scan);
    }
  }

  return [...latestByTrigger.values()].sort((left, right) =>
    String(right.scannedAt).localeCompare(String(left.scannedAt))
  );
}

export function buildArchiveIndexHtml(history) {
  const scans = getCurrentReportScans(history);
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
    <title>Design System Scan Reports</title>
    <script>
      (() => {
        try {
          const savedTheme = window.localStorage.getItem('theme');
          const theme = savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
          document.documentElement.setAttribute('data-theme', theme);
        } catch {}
      })();
    </script>
    <style>
      :root {
        color-scheme: light dark;
        --color-text: #112e51;
        --color-background: #eef5fb;
        --color-background-accent: #f7f7f2;
        --color-surface: #ffffff;
        --color-surface-muted: #f8fbff;
        --color-border: #d0d7de;
        --color-border-strong: #a9bcd0;
        --color-shadow: rgba(17, 46, 81, .08);
        --color-link: #005ea2;
        --color-link-hover: #1a4480;
        --color-muted: #5c6f82;
        --color-focus: #0050d8;
        --color-table-row-even: #eef4fb;
        --color-table-row-odd: #e6eef7;
        --color-badge-full-bg: #dff6dd;
        --color-badge-full-text: #17603a;
        --color-badge-partial-bg: #fff4cc;
        --color-badge-partial-text: #7a5300;
        --color-badge-absent-bg: #f4dfe2;
        --color-badge-absent-text: #8b1e2d;
        --color-error: #b50909;
        --color-button-bg: #005ea2;
        --color-button-text: #ffffff;
        --color-button-hover: #1a4480;
        --color-tooltip-bg: #1b1b1b;
        --color-tooltip-text: #ffffff;
      }

      @media (prefers-color-scheme: dark) {
        :root {
          --color-text: #edf4ff;
          --color-background: #0b1725;
          --color-background-accent: #132235;
          --color-surface: #102235;
          --color-surface-muted: #16304a;
          --color-border: #38506a;
          --color-border-strong: #54708d;
          --color-shadow: rgba(0, 0, 0, .28);
          --color-link: #8ec5ff;
          --color-link-hover: #bfdeff;
          --color-muted: #b8c7d9;
          --color-focus: #99ccff;
          --color-table-row-even: #172c42;
          --color-table-row-odd: #20364d;
          --color-badge-full-bg: #183c2d;
          --color-badge-full-text: #b8f0cf;
          --color-badge-partial-bg: #4a3910;
          --color-badge-partial-text: #ffe39c;
          --color-badge-absent-bg: #4a1f26;
          --color-badge-absent-text: #ffc6cf;
          --color-error: #ffb3be;
          --color-button-bg: #8ec5ff;
          --color-button-text: #07111d;
          --color-button-hover: #bfdeff;
          --color-tooltip-bg: #edf4ff;
          --color-tooltip-text: #07111d;
        }
      }

      [data-theme="light"] {
        --color-text: #112e51;
        --color-background: #eef5fb;
        --color-background-accent: #f7f7f2;
        --color-surface: #ffffff;
        --color-surface-muted: #f8fbff;
        --color-border: #d0d7de;
        --color-border-strong: #a9bcd0;
        --color-shadow: rgba(17, 46, 81, .08);
        --color-link: #005ea2;
        --color-link-hover: #1a4480;
        --color-muted: #5c6f82;
        --color-focus: #0050d8;
        --color-table-row-even: #eef4fb;
        --color-table-row-odd: #e6eef7;
        --color-badge-full-bg: #dff6dd;
        --color-badge-full-text: #17603a;
        --color-badge-partial-bg: #fff4cc;
        --color-badge-partial-text: #7a5300;
        --color-badge-absent-bg: #f4dfe2;
        --color-badge-absent-text: #8b1e2d;
        --color-error: #b50909;
        --color-button-bg: #005ea2;
        --color-button-text: #ffffff;
        --color-button-hover: #1a4480;
        --color-tooltip-bg: #1b1b1b;
        --color-tooltip-text: #ffffff;
      }

      [data-theme="dark"] {
        --color-text: #edf4ff;
        --color-background: #0b1725;
        --color-background-accent: #132235;
        --color-surface: #102235;
        --color-surface-muted: #16304a;
        --color-border: #38506a;
        --color-border-strong: #54708d;
        --color-shadow: rgba(0, 0, 0, .28);
        --color-link: #8ec5ff;
        --color-link-hover: #bfdeff;
        --color-muted: #b8c7d9;
        --color-focus: #99ccff;
        --color-table-row-even: #172c42;
        --color-table-row-odd: #20364d;
        --color-badge-full-bg: #183c2d;
        --color-badge-full-text: #b8f0cf;
        --color-badge-partial-bg: #4a3910;
        --color-badge-partial-text: #ffe39c;
        --color-badge-absent-bg: #4a1f26;
        --color-badge-absent-text: #ffc6cf;
        --color-error: #ffb3be;
        --color-button-bg: #8ec5ff;
        --color-button-text: #07111d;
        --color-button-hover: #bfdeff;
        --color-tooltip-bg: #edf4ff;
        --color-tooltip-text: #07111d;
      }

      html, body, main, section, .hero, .stat, table, th, td, a, button, input, dialog {
        transition: background-color .2s ease, color .2s ease, border-color .2s ease, box-shadow .2s ease;
      }

      @media (prefers-reduced-motion: reduce) {
        html, body, main, section, .hero, .stat, table, th, td, a, button, input, dialog {
          transition: none;
        }
      }

      body { margin: 0; font-family: ui-sans-serif, system-ui, sans-serif; color: var(--color-text); background: linear-gradient(180deg, var(--color-background) 0%, var(--color-background-accent) 100%); }
      main { max-width: 96rem; margin: 0 auto; padding: 2rem 1rem 4rem; }
      .hero, section { background: var(--color-surface); border: 1px solid var(--color-border); box-shadow: 0 12px 32px var(--color-shadow); padding: 1rem 1.25rem; margin-bottom: 1rem; }
      .heading-anchor-group { display: flex; align-items: baseline; gap: .5rem; }
      .heading-anchor { opacity: 0; text-decoration: none; }
      .heading-anchor-group:hover .heading-anchor, .heading-anchor:focus { opacity: 1; }
      .hero-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
      .hero-copy { min-width: min(22rem, 100%); flex: 1 1 28rem; }
      .hero-actions { display: flex; align-items: center; gap: .75rem; flex-wrap: wrap; }
      .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr)); gap: .75rem; margin-top: 1rem; }
      .stat { background: var(--color-surface-muted); border: 1px solid var(--color-border); padding: .85rem; }
      .stat strong { display: block; color: var(--color-muted); font-size: .8rem; text-transform: uppercase; letter-spacing: .04em; margin-bottom: .25rem; }
      .table-wrap { overflow-x: auto; }
      table { width: 100%; border-collapse: collapse; background: var(--color-surface); }
      tbody tr:nth-child(even) { background: var(--color-table-row-even); }
      tbody tr:nth-child(odd) { background: var(--color-table-row-odd); }
      th, td { text-align: left; vertical-align: top; padding: .65rem .5rem; border-bottom: 1px solid var(--color-border); }
      th { font-size: .8rem; text-transform: uppercase; letter-spacing: .04em; color: var(--color-muted); background: var(--color-surface); }
      .badge { display: inline-block; padding: .15rem .45rem; border-radius: 999px; font-size: .8rem; font-weight: 700; text-transform: uppercase; }
      .badge--full { background: var(--color-badge-full-bg); color: var(--color-badge-full-text); }
      .badge--partial { background: var(--color-badge-partial-bg); color: var(--color-badge-partial-text); }
      .badge--absent { background: var(--color-badge-absent-bg); color: var(--color-badge-absent-text); }
      .muted { color: var(--color-muted); }
      .error { color: var(--color-error); font-weight: 700; }
      input { width: min(30rem, 100%); padding: .65rem .8rem; border: 1px solid var(--color-border-strong); border-radius: .3rem; font: inherit; background: var(--color-surface); color: var(--color-text); }
      a { color: var(--color-link); }
      a:hover { color: var(--color-link-hover); }
      a:focus-visible, button:focus-visible, input:focus-visible, summary:focus-visible {
        outline: 3px solid var(--color-focus);
        outline-offset: 2px;
      }
      .button-link { appearance: none; border: 1px solid var(--color-button-bg); background: var(--color-button-bg); color: var(--color-button-text); border-radius: .3rem; padding: .45rem .75rem; font: inherit; cursor: pointer; }
      .button-link:hover { background: var(--color-button-hover); border-color: var(--color-button-hover); }
      .theme-toggle {
        margin-left: auto;
        padding: .55rem;
        border: 1px solid var(--color-border-strong);
        background: var(--color-surface);
        color: var(--color-text);
        border-radius: .35rem;
        cursor: pointer;
      }
      .theme-toggle:hover { background: var(--color-surface-muted); }
      .theme-icon { display: block; width: 1.25rem; height: 1.25rem; }
      .sun-icon { display: none; }
      .moon-icon { display: block; }
      @media (prefers-color-scheme: dark) {
        .sun-icon { display: block; }
        .moon-icon { display: none; }
      }
      [data-theme="dark"] .sun-icon { display: block; }
      [data-theme="dark"] .moon-icon { display: none; }
      [data-theme="light"] .sun-icon { display: none; }
      [data-theme="light"] .moon-icon { display: block; }
      .tooltip-wrap { position: relative; display: inline-flex; align-items: center; }
      .tooltip-trigger { appearance: none; border: 0; background: transparent; color: inherit; padding: 0; font: inherit; }
      .tooltip-trigger--date { text-decoration: underline dotted; text-underline-offset: .16em; cursor: help; }
      .tooltip-trigger:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 2px; border-radius: .1rem; }
      .tooltip-bubble { position: absolute; left: 50%; top: calc(100% + .45rem); transform: translateX(-50%); z-index: 5; min-width: max-content; max-width: min(18rem, 70vw); padding: .5rem .65rem; border: 1px solid var(--color-tooltip-bg); border-radius: .3rem; background: var(--color-tooltip-bg); color: var(--color-tooltip-text); box-shadow: 0 6px 20px rgba(0,0,0,.2); }
      .tooltip-bubble::before { content: ""; position: absolute; left: 50%; top: -.35rem; width: .7rem; height: .7rem; background: var(--color-tooltip-bg); border-left: 1px solid var(--color-tooltip-bg); border-top: 1px solid var(--color-tooltip-bg); transform: translateX(-50%) rotate(45deg); }
      @media (pointer: coarse) {
        .tooltip-bubble { max-width: min(16rem, 80vw); }
      }
      @media (forced-colors: active) {
        .hero, section, .stat, table, th, td, .button-link, .theme-toggle {
          border-color: CanvasText;
          box-shadow: none;
        }
        body, .hero, section, .stat, table, th, td {
          background: Canvas;
          color: CanvasText;
        }
        a { color: LinkText; }
        .button-link, .theme-toggle {
          background: ButtonFace;
          color: ButtonText;
        }
        .badge, .tooltip-bubble {
          border: 1px solid CanvasText;
        }
        .tooltip-bubble, .tooltip-bubble::before {
          background: Canvas;
          color: CanvasText;
        }
        tbody tr {
          border-bottom: 1px solid CanvasText;
        }
      }
    </style>
  </head>
  <body>
    ${renderSiteNav("../", "./", "./latest/", "../archives/")}
    <main>
      <section class="hero">
        <div class="hero-header">
          <div class="hero-copy">
            ${renderAnchoredHeading(1, "Design System Scan Reports", "top")}
            <p>Current reports from the last month, showing only the latest published scan for each trigger issue or workflow source.</p>
          </div>
          <div class="hero-actions">
            <button id="theme-toggle" class="theme-toggle" type="button" aria-label="Switch to dark mode">
              <svg aria-hidden="true" class="theme-icon sun-icon" viewBox="0 0 24 24" width="20" height="20">
                <circle cx="12" cy="12" r="5" fill="currentColor"></circle>
                <g stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
                  <path d="M12 1.8v3.1"></path>
                  <path d="M12 19.1v3.1"></path>
                  <path d="M4.2 4.2l2.2 2.2"></path>
                  <path d="M17.6 17.6l2.2 2.2"></path>
                  <path d="M1.8 12h3.1"></path>
                  <path d="M19.1 12h3.1"></path>
                  <path d="M4.2 19.8l2.2-2.2"></path>
                  <path d="M17.6 6.4l2.2-2.2"></path>
                </g>
              </svg>
              <svg aria-hidden="true" class="theme-icon moon-icon" viewBox="0 0 24 24" width="20" height="20">
                <path fill="currentColor" d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"></path>
              </svg>
            </button>
          </div>
        </div>
        <div class="stats">
          <div class="stat"><strong>Current reports</strong>${scans.length}</div>
          <div class="stat"><strong>Unique sites</strong>${uniqueSites}</div>
          <div class="stat"><strong>Latest update</strong>${renderDateCell(history.updatedAt ?? "unknown", "latest-update")}</div>
        </div>
      </section>

      <section>
        ${renderAnchoredHeading(2, "Reports", "reports")}
        <p class="muted">Filter by URL, system, or trigger. This view keeps only the newest report for each trigger from the last month. “Pages with DS fingerprint” counts pages where the scanner found enough design-system evidence to classify the page as using the selected system. Use “Details” to open the stable per-run report page.</p>
        <input id="scan-filter" type="search" placeholder="Filter scans">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Seed URL</th>
                <th>System</th>
                <th>Trigger</th>
                <th>Pages</th>
                <th>Pages with DS fingerprint</th>
                <th>Top components</th>
                <th>Top templates</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody id="scan-table-body">
              ${renderArchiveRows(scans)}
            </tbody>
          </table>
        </div>
      </section>
      ${renderProjectFooter()}
    </main>
    <script>
      const themeToggle = document.getElementById('theme-toggle');
      const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
      const savedTheme = window.localStorage.getItem('theme');
      let currentTheme = savedTheme || (prefersDarkScheme.matches ? 'dark' : 'light');
      let userHasOverride = Boolean(savedTheme);

      const applyTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        if (!themeToggle) {
          return;
        }
        themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
        themeToggle.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
      };

      themeToggle?.addEventListener('click', () => {
        currentTheme = currentTheme === 'light' ? 'dark' : 'light';
        userHasOverride = true;
        window.localStorage.setItem('theme', currentTheme);
        applyTheme(currentTheme);
      });

      prefersDarkScheme.addEventListener('change', (event) => {
        if (!userHasOverride) {
          currentTheme = event.matches ? 'dark' : 'light';
          applyTheme(currentTheme);
        }
      });

      applyTheme(currentTheme);

      const input = document.getElementById('scan-filter');
      const rows = Array.from(document.querySelectorAll('#scan-table-body tr[data-filter]'));
      input?.addEventListener('input', () => {
        const query = input.value.trim().toLowerCase();
        rows.forEach((row) => {
          row.style.display = !query || row.dataset.filter.includes(query) ? '' : 'none';
        });
      });

      const formatDate = (value, options) => {
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) {
          return value;
        }

        return new Intl.DateTimeFormat(undefined, options).format(parsed);
      };

      document.querySelectorAll('[data-tooltip-trigger][data-date]').forEach((element) => {
        const value = element.dataset.date;
        element.textContent = formatDate(value, { dateStyle: 'medium' });
      });

      document.querySelectorAll('[data-tooltip][data-tooltip-date]').forEach((element) => {
        const value = element.dataset.tooltipDate;
        element.textContent = formatDate(value, { timeStyle: 'medium' });
      });

      const tooltipWraps = Array.from(document.querySelectorAll('[data-tooltip-wrap]'));

      const hideTooltip = (wrap) => {
        const trigger = wrap.querySelector('[data-tooltip-trigger]');
        const tooltip = wrap.querySelector('[data-tooltip]');
        if (!trigger || !tooltip) {
          return;
        }

        tooltip.hidden = true;
        trigger.setAttribute('aria-expanded', 'false');
      };

      const showTooltip = (wrap) => {
        const trigger = wrap.querySelector('[data-tooltip-trigger]');
        const tooltip = wrap.querySelector('[data-tooltip]');
        if (!trigger || !tooltip) {
          return;
        }

        tooltip.hidden = false;
        trigger.setAttribute('aria-expanded', 'true');
      };

      tooltipWraps.forEach((wrap) => {
        const trigger = wrap.querySelector('[data-tooltip-trigger]');
        const tooltip = wrap.querySelector('[data-tooltip]');

        if (!trigger || !tooltip) {
          return;
        }

        const hideIfOutside = (event) => {
          const nextTarget = event.relatedTarget;
          if (nextTarget && wrap.contains(nextTarget)) {
            return;
          }
          hideTooltip(wrap);
        };

        trigger.addEventListener('mouseenter', () => showTooltip(wrap));
        trigger.addEventListener('mouseleave', hideIfOutside);
        trigger.addEventListener('focusin', () => showTooltip(wrap));
        trigger.addEventListener('focusout', hideIfOutside);
        trigger.addEventListener('click', () => {
          const expanded = trigger.getAttribute('aria-expanded') === 'true';
          if (expanded) {
            hideTooltip(wrap);
            return;
          }
          showTooltip(wrap);
        });
        trigger.addEventListener('keydown', (event) => {
          if (event.key === 'Escape') {
            hideTooltip(wrap);
          }
        });

        tooltip.addEventListener('mouseenter', () => showTooltip(wrap));
        tooltip.addEventListener('mouseleave', hideIfOutside);
      });

      document.addEventListener('click', (event) => {
        tooltipWraps.forEach((wrap) => {
          if (!wrap.contains(event.target)) {
            hideTooltip(wrap);
          }
        });
      });

    </script>
  </body>
</html>`;
}

export function buildArchivesIndexHtml(history, archivePackages = {}) {
  const scans = [...(history.scans ?? [])].sort((left, right) =>
    String(right.scannedAt).localeCompare(String(left.scannedAt))
  );

  const rows = scans
    .map((scan) => {
      const archivePaths = scan.archivePaths ?? getScanArchivePaths(scan);
      const packageMeta = archivePackages[archivePaths.zip] ?? {};
      const sizeLabel = packageMeta.sizeBytes
        ? `${(packageMeta.sizeBytes / 1024).toFixed(1)} KB`
        : "Pending";

      return `
        <tr>
          <td>${renderDateCell(scan.scannedAt, `archive-date-${escapeHtml(scan.id)}`)}</td>
          <td>${renderTrigger(scan.trigger, scan.repository)}</td>
          <td><a href="${escapeHtml(scan.seedUrl)}">${escapeHtml(scan.seedUrl)}</a></td>
          <td>${escapeHtml(scan.systemInfo?.name ?? scan.system)}</td>
          <td>${scan.siteSummary?.pageCount ?? 0}</td>
          <td>${escapeHtml(sizeLabel)}</td>
          <td><a class="button-link" href="../${escapeHtml(archivePaths.zip)}">ZIP package</a></td>
        </tr>
      `;
    })
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Design System Scan Archives</title>
    <style>
      body { margin: 0; font-family: ui-sans-serif, system-ui, sans-serif; color: #112e51; background: #eef5fb; }
      main { max-width: 96rem; margin: 0 auto; padding: 2rem 1rem 4rem; }
      section { background: #fff; border: 1px solid #d0d7de; box-shadow: 0 12px 32px rgba(17, 46, 81, .08); padding: 1rem 1.25rem; margin-bottom: 1rem; }
      .archive-nav { max-width: 96rem; margin: 0 auto; padding: 1rem 1rem 0; }
      .archive-nav ul { list-style: none; padding: 0; margin: 0; display: flex; gap: 1rem; flex-wrap: wrap; }
      .heading-anchor-group { display: flex; align-items: baseline; gap: .5rem; }
      .heading-anchor { opacity: 0; text-decoration: none; }
      .heading-anchor-group:hover .heading-anchor, .heading-anchor:focus { opacity: 1; }
      .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr)); gap: .75rem; }
      .stat { background: #f8fbff; border: 1px solid #d0d7de; padding: .85rem; }
      .stat strong { display: block; color: #5c6f82; font-size: .8rem; text-transform: uppercase; letter-spacing: .04em; margin-bottom: .25rem; }
      .table-wrap { overflow-x: auto; }
      table { width: 100%; border-collapse: collapse; }
      th, td { text-align: left; vertical-align: top; padding: .65rem .5rem; border-bottom: 1px solid #d0d7de; }
      th { font-size: .8rem; text-transform: uppercase; letter-spacing: .04em; color: #5c6f82; }
      a { color: #005ea2; }
      .button-link { display: inline-block; border: 1px solid #005ea2; background: #005ea2; color: #fff; border-radius: .3rem; padding: .45rem .75rem; text-decoration: none; }
      .muted { color: #5c6f82; }
    </style>
  </head>
  <body>
    ${renderSiteNav("../", "../reports/", "../reports/latest/", "./", "archive-nav")}
    <main>
      <section>
        ${renderAnchoredHeading(1, "Design System Scan Archives", "top")}
        <p>This archive keeps older report runs available as downloadable ZIP packages organized by trigger and date. The current reports view only shows the newest report for each trigger in the last month.</p>
      </section>
      <section>
        <div class="stats">
          <div class="stat"><strong>Archived runs</strong>${scans.length}</div>
          <div class="stat"><strong>Latest update</strong>${renderDateCell(history.updatedAt ?? "unknown", "archives-latest-update")}</div>
        </div>
      </section>
      <section>
        ${renderAnchoredHeading(2, "Archive packages", "archive-packages")}
        <p class="muted">Each package includes the stable HTML, Markdown, CSV, and JSON outputs for a specific run.</p>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Trigger</th>
                <th>Seed URL</th>
                <th>System</th>
                <th>Pages crawled</th>
                <th>Package size</th>
                <th>Download</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </section>
      ${renderProjectFooter()}
    </main>
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

function renderFlatPageRows(scan) {
  return (scan.pages ?? [])
    .map((page) => {
      const versions = (page.versions ?? []).join(", ");
      const url = escapeHtml(page.url);
      return `
        <tr>
          <td><a href="${url}">${url}</a></td>
          <td>${statusBadge(page.fingerprint?.status ?? "absent")}</td>
          <td>${formatPercent(page.fingerprint?.coverage ?? 0)}</td>
          <td>${page.summary?.fullComponentCount ?? 0}</td>
          <td>${page.summary?.partialComponentCount ?? 0}</td>
          <td>${page.summary?.matchedTemplateCount ?? 0}</td>
          <td>${escapeHtml(versions || "none")}</td>
        </tr>
      `;
    })
    .join("");
}

export function buildScanReportHtml(scan) {
  const componentSnapshot = summarizeTopItems(scan.siteSummary?.components, 12);
  const templateSnapshot = summarizeTopItems(scan.siteSummary?.templates, 8);
  const themeSnapshot = summarizeTopItems(scan.siteSummary?.themes, 8);
  const primaryTheme = scan.siteSummary?.primaryTheme?.name;
  const proposedVersion = getProposedVersion(scan);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Design System Scan Report</title>
    <style>
      body { margin: 0; font-family: ui-sans-serif, system-ui, sans-serif; color: #112e51; background: #eef5fb; }
      main { max-width: 88rem; margin: 0 auto; padding: 2rem 1rem 4rem; }
      .report-nav { max-width: 88rem; margin: 0 auto; padding: 1rem 1rem 0; }
      .report-nav ul { list-style: none; padding: 0; margin: 0; display: flex; gap: 1rem; flex-wrap: wrap; }
      section { background: #fff; border: 1px solid #d0d7de; box-shadow: 0 12px 32px rgba(17, 46, 81, .08); padding: 1rem 1.25rem; margin-bottom: 1rem; }
      .heading-anchor-group { display: flex; align-items: baseline; gap: .5rem; }
      .heading-anchor { opacity: 0; text-decoration: none; }
      .heading-anchor-group:hover .heading-anchor, .heading-anchor:focus { opacity: 1; }
      .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr)); gap: .75rem; }
      .stat { background: #f8fbff; border: 1px solid #d0d7de; padding: .85rem; }
      .stat strong { display: block; color: #5c6f82; font-size: .8rem; text-transform: uppercase; letter-spacing: .04em; margin-bottom: .25rem; }
      table { width: 100%; border-collapse: collapse; }
      th, td { text-align: left; vertical-align: top; padding: .65rem .5rem; border-bottom: 1px solid #d0d7de; }
      th { font-size: .8rem; text-transform: uppercase; letter-spacing: .04em; color: #5c6f82; }
      .badge { display: inline-block; padding: .15rem .45rem; border-radius: 999px; font-size: .8rem; font-weight: 700; text-transform: uppercase; }
      .badge--full { background: #dff6dd; color: #17603a; }
      .badge--partial { background: #fff4cc; color: #7a5300; }
      .badge--absent { background: #f4dfe2; color: #8b1e2d; }
      a { color: #005ea2; }
      .muted { color: #5c6f82; }
      .table-wrap { overflow-x: auto; }
      .page-section { border-top: 1px solid #d0d7de; padding-top: 1rem; margin-top: 1rem; }
      .page-section:first-of-type { border-top: 0; padding-top: 0; margin-top: 0; }
      .footer-note { font-size: .95rem; }
      ul { margin: .25rem 0 0 1.25rem; }
    </style>
  </head>
  <body>
    ${renderSiteNav("../../../../", "../../../", "../../../../reports/latest/", "../../../../archives/", "report-nav")}
    <main>
      <section>
        ${renderAnchoredHeading(1, "Design system scan report", "top")}
        <p><strong>Seed URL:</strong> <a href="${escapeHtml(scan.seedUrl)}">${escapeHtml(scan.seedUrl)}</a></p>
        <p><strong>System:</strong> ${escapeHtml(scan.systemInfo?.name ?? scan.system)}</p>
        ${proposedVersion ? `<p><strong>Proposed version:</strong> ${escapeHtml(proposedVersion)}</p>` : ""}
        ${primaryTheme ? `<p><strong>Theme:</strong> ${escapeHtml(primaryTheme)}</p>` : ""}
        <p><strong>Trigger:</strong> ${renderTrigger(scan.trigger, scan.repository)}</p>
        <p><strong>Workflow run:</strong> <a href="${escapeHtml(scan.runUrl)}">${escapeHtml(scan.runUrl)}</a></p>
      </section>

      <section>
        <div class="stats">
          <div class="stat"><strong>Accepted URLs</strong>${scan.acceptedUrls ?? scan.siteSummary?.pageCount ?? 0}</div>
          <div class="stat"><strong>Scanned pages</strong>${scan.siteSummary?.pageCount ?? 0}</div>
          <div class="stat"><strong>Pages with DS fingerprint</strong>${scan.siteSummary?.fingerprintedPageCount ?? 0}</div>
          <div class="stat"><strong>Rejected URLs</strong>0</div>
          <div class="stat"><strong>Component types identified</strong>${scan.siteSummary?.components?.length ?? 0}</div>
          <div class="stat"><strong>Max pages</strong>${escapeHtml(scan.maxPages)}</div>
        </div>
      </section>

      <section>
        ${renderAnchoredHeading(2, "Published files", "published-files")}
        <ul>
          <li><a href="./report.md">Markdown report</a></li>
          <li><a href="./report.csv">CSV export</a></li>
          <li><a href="./report.json">JSON data</a></li>
          <li><a href="../../../">Current reports index</a></li>
          <li><a href="../../../../${escapeHtml((scan.archivePaths ?? getScanArchivePaths(scan)).zip)}">Archive ZIP package</a></li>
        </ul>
      </section>

      <section>
        ${renderAnchoredHeading(2, "Top signals", "top-signals")}
        <p class="muted">These are the strongest matches across all scanned pages.</p>
        <p><strong>Components:</strong> ${escapeHtml(componentSnapshot || "None")}</p>
        <p><strong>Templates:</strong> ${escapeHtml(templateSnapshot || "None")}</p>
        ${themeSnapshot ? `<p><strong>Themes:</strong> ${escapeHtml(themeSnapshot)}</p>` : ""}
      </section>

      <section>
        ${renderAnchoredHeading(2, "Page summary", "page-summary")}
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
              </tr>
            </thead>
            <tbody>
              ${renderFlatPageRows(scan)}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        ${renderAnchoredHeading(2, "Page details", "page-details")}
        <p class="muted">Each scanned page includes the detected design-system fingerprint, component evidence, template evidence, and any asset fetch issues.</p>
        ${renderPageSections(scan.pages)}
      </section>

      ${renderProjectFooter()}
    </main>
  </body>
</html>`;
}

export function buildScanReportMarkdown(scan) {
  const reportPaths = scan.reportPaths ?? getScanReportPaths(scan);
  const lines = [
    `# Design system scan report`,
    ``,
    `- Seed URL: ${scan.seedUrl}`,
    `- System: ${scan.systemInfo?.name ?? scan.system}`,
    `- Trigger: ${scan.trigger}`,
    `- Workflow run: ${scan.runUrl}`,
    `- Accepted URLs: ${scan.acceptedUrls ?? scan.siteSummary?.pageCount ?? 0}`,
    `- Scanned URLs: ${scan.siteSummary?.pageCount ?? 0}`,
    `- Rejected URLs: 0`,
    `- Pages with DS fingerprint: ${scan.siteSummary?.fingerprintedPageCount ?? 0}`,
    ``,
    `## Published files`,
    ``,
    `- HTML: ${reportPaths.html}`,
    `- Markdown: ${reportPaths.markdown}`,
    `- CSV: ${reportPaths.csv}`,
    `- JSON: ${reportPaths.json}`,
    ``,
    `## Top components`,
    ``,
    summarizeTopItems(scan.siteSummary?.components, 12) || "None",
    ``,
    `## Top templates`,
    ``,
    summarizeTopItems(scan.siteSummary?.templates, 8) || "None",
    ``,
    `## Pages`,
    ``,
    `| Page | Fingerprint | Coverage | Full | Partial | Templates | Versions |`,
    `| --- | --- | --- | --- | --- | --- | --- |`,
  ];

  for (const page of scan.pages ?? []) {
    lines.push(
      `| ${page.url} | ${page.fingerprint?.status ?? "absent"} | ${formatPercent(page.fingerprint?.coverage ?? 0)} | ${page.summary?.fullComponentCount ?? 0} | ${page.summary?.partialComponentCount ?? 0} | ${page.summary?.matchedTemplateCount ?? 0} | ${(page.versions ?? []).join(", ") || "none"} |`
    );
  }

  lines.push("");
  return lines.join("\n");
}

export function buildScanReportCsv(scan) {
  const rows = [
    [
      "page_url",
      "fingerprint_status",
      "fingerprint_coverage",
      "full_components",
      "partial_components",
      "matched_templates",
      "versions",
    ].join(","),
  ];

  for (const page of scan.pages ?? []) {
    const columns = [
      JSON.stringify(page.url ?? ""),
      JSON.stringify(page.fingerprint?.status ?? "absent"),
      JSON.stringify(String(page.fingerprint?.coverage ?? 0)),
      JSON.stringify(String(page.summary?.fullComponentCount ?? 0)),
      JSON.stringify(String(page.summary?.partialComponentCount ?? 0)),
      JSON.stringify(String(page.summary?.matchedTemplateCount ?? 0)),
      JSON.stringify((page.versions ?? []).join("; ")),
    ];

    rows.push(columns.join(","));
  }

  return rows.join("\n");
}

export async function writeArchiveSite(outputDir, history) {
  const inventories = await loadDesignSystemInventories();
  const comparisonMatrix = await loadDesignSystemComparisonMatrix();
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(path.join(outputDir, "index.html"), buildReportsLandingHtml(), "utf8");
  await fs.mkdir(path.join(outputDir, REPORTS_ROOT_DIR), { recursive: true });
  await fs.mkdir(path.join(outputDir, ARCHIVES_ROOT_DIR), { recursive: true });
  await fs.writeFile(
    path.join(outputDir, REPORTS_ROOT_DIR, "index.html"),
    buildArchiveIndexHtml(history),
    "utf8"
  );
  await fs.writeFile(
    path.join(outputDir, ARCHIVES_ROOT_DIR, "index.html"),
    buildArchivesIndexHtml(history),
    "utf8"
  );
  await fs.writeFile(
    path.join(outputDir, REPORTS_ROOT_DIR, "history.json"),
    JSON.stringify(history, null, 2),
    "utf8"
  );

  for (const scan of history.scans ?? []) {
    const reportPaths = scan.reportPaths ?? getScanReportPaths(scan);
    const relativeDir = reportPaths.relativeDir;
    const absoluteDir = path.join(outputDir, relativeDir);
    await fs.mkdir(absoluteDir, { recursive: true });
    await fs.writeFile(path.join(outputDir, reportPaths.html), buildScanReportHtml(scan), "utf8");
    await fs.writeFile(path.join(outputDir, reportPaths.markdown), buildScanReportMarkdown(scan), "utf8");
    await fs.writeFile(path.join(outputDir, reportPaths.csv), buildScanReportCsv(scan), "utf8");
    await fs.writeFile(path.join(outputDir, reportPaths.json), JSON.stringify(scan, null, 2), "utf8");

    if (reportPaths.latestAlias) {
      const aliasPath = path.join(outputDir, reportPaths.latestAlias);
      await fs.mkdir(path.dirname(aliasPath), { recursive: true });
      await fs.writeFile(aliasPath, buildScanReportHtml(scan), "utf8");
    }

    const issueAliasPath = buildIssueAliasPath(scan);
    if (issueAliasPath) {
      const absoluteIssueAliasPath = path.join(outputDir, issueAliasPath);
      await fs.mkdir(path.dirname(absoluteIssueAliasPath), { recursive: true });
      await fs.writeFile(absoluteIssueAliasPath, buildScanReportHtml(scan), "utf8");
    }

    const issueDateAliasPath = buildIssueDateAliasPath(scan);
    if (issueDateAliasPath) {
      const absoluteIssueDateAliasPath = path.join(outputDir, issueDateAliasPath);
      await fs.mkdir(path.dirname(absoluteIssueDateAliasPath), { recursive: true });
      await fs.writeFile(absoluteIssueDateAliasPath, buildScanReportHtml(scan), "utf8");
    }
  }

  for (const inventory of inventories) {
    const systemDir = path.join(outputDir, "systems", inventory.id);
    await fs.mkdir(systemDir, { recursive: true });
    await fs.writeFile(path.join(systemDir, "index.html"), renderDesignSystemPage(inventory), "utf8");
  }

  const comparisonDir = path.join(outputDir, "comparison");
  await fs.mkdir(comparisonDir, { recursive: true });
  await fs.writeFile(
    path.join(comparisonDir, "index.html"),
    renderComparisonPage(comparisonMatrix),
    "utf8"
  );
}

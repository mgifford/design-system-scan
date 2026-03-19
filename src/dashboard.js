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

function renderSiteNav() {
  return `
    <nav class="dashboard-nav" aria-label="Site">
      <ul>
        <li><a href="../../">Project home</a></li>
        <li><a href="../">Reports</a></li>
        <li><a href="./">Latest report</a></li>
        <li><a href="../../archives/">Archives</a></li>
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
  const modalId = `page-modal-${Buffer.from(String(page.url)).toString("base64url")}`;
  const detailsLabel = `Details for ${page.url}`;

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
        <button type="button" class="button-link" data-open-modal="${escapeHtml(modalId)}" aria-label="${escapeHtml(detailsLabel)}">Details</button>
        <dialog id="${escapeHtml(modalId)}" class="page-modal" aria-label="${escapeHtml(detailsLabel)}">
          <div class="page-modal__content">
            <div class="modal-actions">
              <div>
                <h4>${escapeHtml(page.url)}</h4>
                <p class="muted">Version clues: ${escapeHtml(versions)}</p>
              </div>
              <form method="dialog">
                <button type="submit" class="button-link button-link--secondary">Close</button>
              </form>
            </div>
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
          </div>
        </dialog>
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

function getProposedVersion(report) {
  for (const page of report.pages ?? []) {
    if (page?.versions?.length) {
      return page.versions[0];
    }
  }

  return "";
}

export function buildDashboardHtml(report, metadata) {
  const pageRows = report.pages.map(renderPageRow).join("");
  const scannedAt = report.pages[0]?.scannedAt ?? metadata.scannedAt ?? "";
  const proposedVersion = getProposedVersion(report);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Design System Scan Dashboard</title>
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
        --color-background: #f3f7fb;
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
        --color-pre-bg: #112e51;
        --color-pre-text: #f0f7ff;
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
          --color-pre-bg: #07111d;
          --color-pre-text: #edf4ff;
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
        }
      }

      [data-theme="light"] {
        --color-text: #112e51;
        --color-background: #f3f7fb;
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
        --color-pre-bg: #112e51;
        --color-pre-text: #f0f7ff;
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
        --color-pre-bg: #07111d;
        --color-pre-text: #edf4ff;
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
      }

      html, body, main, section, .hero, .meta-card, table, th, td, dialog, a, button, input, pre {
        transition: background-color .2s ease, color .2s ease, border-color .2s ease, box-shadow .2s ease;
      }

      @media (prefers-reduced-motion: reduce) {
        html, body, main, section, .hero, .meta-card, table, th, td, dialog, a, button, input, pre {
          transition: none;
        }
      }

      .dashboard-nav { max-width: 88rem; margin: 0 auto; padding: 1rem 1rem 0; }
      .dashboard-nav ul { list-style: none; padding: 0; margin: 0; display: flex; gap: 1rem; flex-wrap: wrap; }
      body { margin: 0; font-family: ui-sans-serif, system-ui, sans-serif; color: var(--color-text); background: linear-gradient(180deg, var(--color-background) 0%, var(--color-background-accent) 100%); }
      main { max-width: 92rem; margin: 0 auto; padding: 2rem 1rem 4rem; }
      .hero { background: var(--color-surface); border: 1px solid var(--color-border); box-shadow: 0 12px 32px var(--color-shadow); padding: 1.5rem; margin-bottom: 1.5rem; }
      .hero-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
      .hero-copy { min-width: min(22rem, 100%); flex: 1 1 28rem; }
      .hero h1 { margin-top: 0; margin-bottom: .5rem; font-size: 2rem; }
      .hero p { margin-top: 0; }
      .hero-actions { display: flex; align-items: center; gap: .75rem; flex-wrap: wrap; }
      .hero-links { display: flex; align-items: center; gap: .75rem; flex-wrap: wrap; }
      .meta { display: grid; grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr)); gap: 1rem; margin-top: 1rem; }
      .meta-card { background: var(--color-surface-muted); border: 1px solid var(--color-border); padding: .9rem; }
      .meta-card strong { display: block; font-size: .8rem; text-transform: uppercase; letter-spacing: .04em; color: var(--color-muted); margin-bottom: .35rem; }
      section { background: var(--color-surface); border: 1px solid var(--color-border); box-shadow: 0 12px 32px var(--color-shadow); padding: 1rem; margin-bottom: 1rem; }
      h2, h3, h4 { margin-top: 0; }
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
      a { color: var(--color-link); }
      a:hover { color: var(--color-link-hover); }
      a:focus-visible, button:focus-visible, input:focus-visible {
        outline: 3px solid var(--color-focus);
        outline-offset: 2px;
      }
      .button-link {
        appearance: none;
        border: 1px solid var(--color-button-bg);
        background: var(--color-button-bg);
        color: var(--color-button-text);
        border-radius: .3rem;
        padding: .45rem .75rem;
        font: inherit;
        cursor: pointer;
      }
      .button-link:hover { background: var(--color-button-hover); border-color: var(--color-button-hover); }
      .button-link--secondary {
        background: var(--color-surface);
        color: var(--color-link);
        border-color: var(--color-border-strong);
      }
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
      pre { white-space: pre-wrap; overflow-wrap: anywhere; background: var(--color-pre-bg); color: var(--color-pre-text); padding: 1rem; border-radius: .25rem; }
      .page-modal {
        width: min(92rem, calc(100vw - 2rem));
        max-height: calc(100vh - 2rem);
        border: 1px solid var(--color-border);
        padding: 0;
        background: var(--color-surface);
        color: var(--color-text);
      }
      .page-modal::backdrop { background: rgba(17, 46, 81, .6); }
      .page-modal__content { padding: 1.25rem; }
      .modal-actions {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1rem;
        margin-bottom: 1rem;
      }
      .modal-actions h4 { margin: 0 0 .25rem; }

      @media (forced-colors: active) {
        .hero, section, .meta-card, table, th, td, .theme-toggle, .page-modal, .button-link {
          border-color: CanvasText;
          box-shadow: none;
        }
        body, .hero, section, .meta-card, table, th, td, .page-modal {
          background: Canvas;
          color: CanvasText;
        }
        a { color: LinkText; }
        .theme-toggle, .button-link {
          background: ButtonFace;
          color: ButtonText;
        }
        .badge {
          border: 1px solid CanvasText;
        }
        tbody tr {
          border-bottom: 1px solid CanvasText;
        }
      }
    </style>
  </head>
  <body>
    ${renderSiteNav()}
    <main>
      <section class="hero">
        <div class="hero-header">
          <div class="hero-copy">
            <h1>Design System Scan Dashboard</h1>
            <p>Compact view for scan results, with expandable details for component and template evidence.</p>
            <div class="hero-links">
              <a href="${escapeHtml(metadata.runUrl)}">View workflow run</a>
              <span aria-hidden="true">·</span>
              <a href="./report.txt">Plain text report</a>
              <span aria-hidden="true">·</span>
              <a href="./scan.json">JSON report</a>
            </div>
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
        <div class="meta">
          <div class="meta-card"><strong>Date</strong>${escapeHtml(scannedAt || "Unknown")}</div>
          <div class="meta-card"><strong>Trigger</strong>${renderTrigger(metadata.trigger, metadata.repository)}</div>
          <div class="meta-card"><strong>Seed URL</strong>${escapeHtml(metadata.url)}</div>
          <div class="meta-card"><strong>System</strong>${escapeHtml(report.system?.name ?? metadata.system ?? "Unknown")}</div>
          <div class="meta-card"><strong>Proposed version</strong>${escapeHtml(proposedVersion || "None detected")}</div>
          <div class="meta-card"><strong>Theme</strong>${escapeHtml(report.siteSummary.primaryTheme?.name ?? "None detected")}</div>
          <div class="meta-card"><strong>Pages scanned</strong>${report.siteSummary.successfulPageCount}/${report.siteSummary.pageCount}</div>
          <div class="meta-card"><strong>Fingerprint pages</strong>${report.siteSummary.fingerprintedPageCount}</div>
          <div class="meta-card"><strong>Max pages</strong>${escapeHtml(metadata.maxPages)}</div>
        </div>
      </section>

      ${renderSummaryTable("Site-wide theme tells", report.siteSummary.themes ?? [], "Top theme matches across all scanned pages.")}
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

      document.querySelectorAll('[data-open-modal]').forEach((button) => {
        button.addEventListener('click', () => {
          const modal = document.getElementById(button.dataset.openModal);
          modal?.showModal();
        });
      });
    </script>
  </body>
</html>`;
}

export async function writeDashboardSite(outputDir, report, metadata) {
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(path.join(outputDir, "index.html"), buildDashboardHtml(report, metadata), "utf8");
  await fs.writeFile(path.join(outputDir, "report.txt"), metadata.reportText, "utf8");
  await fs.writeFile(path.join(outputDir, "scan.json"), JSON.stringify(report, null, 2), "utf8");
}

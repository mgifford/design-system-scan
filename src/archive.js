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
      const componentSnapshot = summarizeTopItems(scan.siteSummary?.components, 6);
      const templateSnapshot = summarizeTopItems(scan.siteSummary?.templates, 4);
      const modalId = `scan-modal-${escapeHtml(scan.id)}`;
      const dateId = `scan-date-${escapeHtml(scan.id)}`;
      const detailsLabel = `Details for ${scan.seedUrl}`;

      return `
        <tr data-filter="${escapeHtml([scan.seedUrl, scan.system, scan.trigger].join(" ").toLowerCase())}" id="scan-${escapeHtml(scan.id)}">
          <td>${renderDateCell(scan.scannedAt, dateId)}</td>
          <td><a href="${escapeHtml(scan.seedUrl)}">${escapeHtml(scan.seedUrl)}</a></td>
          <td>${escapeHtml(scan.system)}</td>
          <td>${renderTrigger(scan.trigger, scan.repository)}</td>
          <td>${scan.siteSummary?.successfulPageCount ?? 0}/${scan.siteSummary?.pageCount ?? 0}</td>
          <td>${scan.siteSummary?.fingerprintedPageCount ?? 0}</td>
          <td>${componentSnapshot ? escapeHtml(componentSnapshot) : '<span class="muted">None</span>'}</td>
          <td>${templateSnapshot ? escapeHtml(templateSnapshot) : '<span class="muted">None</span>'}</td>
          <td>
            <button type="button" class="button-link" data-open-modal="${modalId}" aria-label="${escapeHtml(detailsLabel)}">Details</button>
            <dialog id="${modalId}" class="scan-modal">
              <div class="scan-modal__content">
                <div class="modal-actions">
                  <h3>${escapeHtml(scan.seedUrl)}</h3>
                  <form method="dialog">
                    <button type="submit" class="button-link">Close</button>
                  </form>
                </div>
              <p><strong>Date:</strong> ${renderDateCell(scan.scannedAt, `${dateId}-modal`)}</p>
              <p><strong>Trigger:</strong> ${renderTrigger(scan.trigger, scan.repository)}</p>
              <p><strong>Run:</strong> <a href="${escapeHtml(scan.runUrl)}">${escapeHtml(scan.runNumber)}</a></p>
              <p><strong>Commit:</strong> ${escapeHtml(scan.sha)}</p>
              <p><strong>Crawl:</strong> ${escapeHtml(scan.crawl)} | <strong>Max pages:</strong> ${escapeHtml(scan.maxPages)}</p>
              <p><strong>Pages with design system fingerprint:</strong> ${scan.siteSummary?.fingerprintedPageCount ?? 0}</p>
              ${renderPageTable(scan.pages)}
              </div>
            </dialog>
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
      .scan-modal { width: min(92rem, calc(100vw - 2rem)); max-height: calc(100vh - 2rem); border: 1px solid var(--color-border); padding: 0; background: var(--color-surface); color: var(--color-text); }
      .scan-modal::backdrop { background: rgba(17, 46, 81, .6); }
      .scan-modal__content { padding: 1.25rem; }
      .modal-actions { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; }
      .modal-actions h3 { margin: 0; }
      @media (pointer: coarse) {
        .tooltip-bubble { max-width: min(16rem, 80vw); }
      }
      @media (forced-colors: active) {
        .hero, section, .stat, table, th, td, .button-link, .theme-toggle, .scan-modal {
          border-color: CanvasText;
          box-shadow: none;
        }
        body, .hero, section, .stat, table, th, td, .scan-modal {
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
    <main>
      <section class="hero">
        <div class="hero-header">
          <div class="hero-copy">
            <h1>Design System Scan Archive</h1>
            <p>Compact history of scans across sites, with a table-first index and deeper details available in a modal for each run.</p>
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
          <div class="stat"><strong>Total scans</strong>${scans.length}</div>
          <div class="stat"><strong>Unique sites</strong>${uniqueSites}</div>
          <div class="stat"><strong>Latest update</strong>${renderDateCell(history.updatedAt ?? "unknown", "latest-update")}</div>
        </div>
      </section>

      <section>
        <h2>Scans</h2>
        <p class="muted">Filter by URL, system, or trigger. “Pages with DS fingerprint” counts pages where the scanner found enough USWDS evidence to classify the page as using the design system.</p>
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

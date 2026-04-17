function formatPercent(value) {
  return `${Math.round(value * 100)}%`;
}

function unknownPatternLabel(pattern) {
  return pattern.type === "custom-element"
    ? `<${pattern.pattern}>`
    : `role="${pattern.pattern}"`;
}

function topComponents(components) {
  return components
    .filter((component) => component.status !== "absent")
    .sort((left, right) => right.coverage - left.coverage)
    .slice(0, 10);
}

function topTemplates(templates) {
  return templates
    .filter((template) => template.status !== "absent")
    .sort((left, right) => right.coverage - left.coverage)
    .slice(0, 5);
}

function topTokens(tokens) {
  return (tokens ?? [])
    .filter((token) => token.status !== "absent")
    .sort((left, right) => right.coverage - left.coverage)
    .slice(0, 6);
}

function describeMissing(item) {
  return item.missingSignals
    .slice(0, 3)
    .map((signal) => signal.label)
    .join(" | ");
}

export function formatTextReport(report) {
  const lines = [];

  if (report.detection?.mode === "auto") {
    lines.push(`Detected system: ${report.detection.selectedSystemName}`);

    if ((report.detection.candidates ?? []).length > 0) {
      lines.push("System candidates:");
      report.detection.candidates.forEach((candidate) => {
        lines.push(
          `  - ${candidate.name}: score ${candidate.score}, fingerprint pages ${candidate.fingerprintedPages}/${candidate.pageCount}, components ${candidate.fullComponents} full + ${candidate.partialComponents} partial`
        );
      });
    }

    lines.push("");
  }

  lines.push(`${report.system.name} scan`);
  lines.push(`Tracked definition: ${report.system.trackedVersion}`);
  lines.push(`Docs: ${report.system.homepage}`);
  lines.push(
    `Pages scanned: ${report.siteSummary.successfulPageCount}/${report.siteSummary.pageCount}`
  );
  lines.push(
    `Pages with design system fingerprint: ${report.siteSummary.fingerprintedPageCount}`
  );

  if ((report.siteSummary.themes ?? []).length > 0) {
    const themeSummary = report.siteSummary.themes
      .slice(0, 6)
      .map((theme) => `${theme.name} (${theme.full} full, ${theme.partial} partial)`)
      .join("; ");
    lines.push(`Site-wide theme tells: ${themeSummary}`);
  }

  if (report.siteSummary.primaryTheme) {
    lines.push(
      `Primary theme match: ${report.siteSummary.primaryTheme.name} (${report.siteSummary.primaryTheme.full} full, ${report.siteSummary.primaryTheme.partial} partial)`
    );
  }

  if (report.siteSummary.components.length > 0) {
    const componentSummary = report.siteSummary.components
      .slice(0, 8)
      .map((component) => `${component.name} (${component.full} full, ${component.partial} partial)`)
      .join("; ");
    lines.push(`Site-wide component tells: ${componentSummary}`);
  }

  if ((report.siteSummary.templates ?? []).length > 0) {
    const templateSummary = report.siteSummary.templates
      .slice(0, 6)
      .map((template) => `${template.name} (${template.full} full, ${template.partial} partial)`)
      .join("; ");
    lines.push(`Site-wide template tells: ${templateSummary}`);
  }

  if ((report.siteSummary.tokens ?? []).length > 0) {
    const tokenSummary = report.siteSummary.tokens
      .slice(0, 6)
      .map((token) => `${token.name} (${token.full} full, ${token.partial} partial)`)
      .join("; ");
    lines.push(`Site-wide token tells: ${tokenSummary}`);
  }

  if ((report.siteSummary.unknownPatterns ?? []).length > 0) {
    const patternSummary = report.siteSummary.unknownPatterns
      .slice(0, 6)
      .map((p) => {
        const label = unknownPatternLabel(p);
        return `${label} (${p.pageCount} page${p.pageCount === 1 ? "" : "s"})`;
      })
      .join("; ");
    lines.push(`Site-wide unknown patterns: ${patternSummary}`);
  }

  lines.push("");

  for (const page of report.pages) {
    lines.push(page.url);

    if (page.error) {
      lines.push(`  Error: ${page.error}`);
      lines.push("");
      continue;
    }

    lines.push(
      `  Fingerprint: ${page.siteFingerprint.status} (${formatPercent(page.siteFingerprint.coverage)})`
    );
    lines.push(
      `  Adoption: ${page.summary.fullComponentCount} full, ${page.summary.partialComponentCount} partial, ${formatPercent(page.summary.overallCoverage)} overall`
    );
    if (page.primaryTheme) {
      lines.push(
        `  Theme: ${page.primaryTheme.name} (${page.primaryTheme.status}, ${formatPercent(page.primaryTheme.coverage)})`
      );
    }
    lines.push(`  Templates: ${page.summary.matchedTemplateCount} detected`);
    lines.push(
      `  Version clues: ${page.versions.length > 0 ? page.versions.join(", ") : "none detected"}`
    );

    const components = topComponents(page.components);

    if (components.length > 0) {
      lines.push("  Components:");

      for (const component of components) {
        const evidence = component.matchedSignals
          .slice(0, 2)
          .map((signal) => signal.value)
          .join(" | ");
        const missing = describeMissing(component);
        lines.push(
          `    - ${component.name}: ${component.status} (${formatPercent(component.coverage)})${evidence ? ` via ${evidence}` : ""}`
        );
        if (missing) {
          lines.push(`      missing: ${missing}`);
        }
      }
    }

    const templates = topTemplates(page.templates ?? []);

    if (templates.length > 0) {
      lines.push("  Templates:");

      for (const template of templates) {
        const evidence = template.matchedSignals
          .slice(0, 2)
          .map((signal) => signal.value)
          .join(" | ");
        const missing = describeMissing(template);
        lines.push(
          `    - ${template.name}: ${template.status} (${formatPercent(template.coverage)})${evidence ? ` via ${evidence}` : ""}`
        );
        if (missing) {
          lines.push(`      missing: ${missing}`);
        }
      }
    }

    const tokens = topTokens(page.tokens ?? []);

    if (tokens.length > 0) {
      lines.push("  Design tokens:");

      for (const token of tokens) {
        const evidence = token.matchedSignals
          .slice(0, 2)
          .map((signal) => signal.value)
          .join(" | ");
        lines.push(
          `    - ${token.name}: ${token.status} (${formatPercent(token.coverage)})${evidence ? ` via ${evidence}` : ""}`
        );
      }
    }

    if ((page.unknownPatterns ?? []).length > 0) {
      lines.push("  Unknown patterns:");

      for (const pattern of page.unknownPatterns) {
        lines.push(`    - ${unknownPatternLabel(pattern)}`);
      }
    }

    if (page.assetInventory.assetErrors.length > 0) {
      lines.push("  Asset fetch issues:");
      page.assetInventory.assetErrors.slice(0, 5).forEach((error) => {
        lines.push(`    - ${error}`);
      });
    }

    lines.push("");
  }

  return lines.join("\n");
}

export function formatDiffReport(diff) {
  const lines = [];

  lines.push(`Snapshot diff for ${diff.system.name}`);
  lines.push(`Previous: ${diff.previous.path}`);
  lines.push(`Current: ${diff.current.path}`);
  lines.push(`Page delta: ${diff.summary.pageDelta}`);
  lines.push(`Fingerprint page delta: ${diff.summary.fingerprintPageDelta}`);

  if (diff.summary.addedUrls.length > 0) {
    lines.push(`Added URLs: ${diff.summary.addedUrls.slice(0, 10).join(", ")}`);
  }

  if (diff.summary.removedUrls.length > 0) {
    lines.push(`Removed URLs: ${diff.summary.removedUrls.slice(0, 10).join(", ")}`);
  }

  if (diff.summary.componentChanges.length > 0) {
    lines.push("Component changes:");

    diff.summary.componentChanges.slice(0, 12).forEach((change) => {
      lines.push(
        `  - ${change.name}: full ${change.previous.full} -> ${change.current.full}, partial ${change.previous.partial} -> ${change.current.partial}`
      );
    });
  }

  if (diff.summary.templateChanges.length > 0) {
    lines.push("Template changes:");

    diff.summary.templateChanges.slice(0, 12).forEach((change) => {
      lines.push(
        `  - ${change.name}: full ${change.previous.full} -> ${change.current.full}, partial ${change.previous.partial} -> ${change.current.partial}`
      );
    });
  }

  return lines.join("\n");
}

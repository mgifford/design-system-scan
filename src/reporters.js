function formatPercent(value) {
  return `${Math.round(value * 100)}%`;
}

function topComponents(components) {
  return components
    .filter((component) => component.status !== "absent")
    .sort((left, right) => right.coverage - left.coverage)
    .slice(0, 10);
}

export function formatTextReport(report) {
  const lines = [];

  lines.push(`${report.system.name} scan`);
  lines.push(`Tracked definition: ${report.system.trackedVersion}`);
  lines.push(`Docs: ${report.system.homepage}`);
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
        lines.push(
          `    - ${component.name}: ${component.status} (${formatPercent(component.coverage)})${evidence ? ` via ${evidence}` : ""}`
        );
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

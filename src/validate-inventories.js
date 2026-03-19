import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const INVENTORY_DIR = path.join(ROOT_DIR, "data", "design-systems");

const SYSTEMS = [
  {
    id: "uswds",
    name: "U.S. Web Design System",
    inventoryFile: "uswds.json",
    sourceUrl: "https://designsystem.digital.gov/components/overview/",
    inventoryKey: "officialComponents",
    extractIds(html) {
      return extractSlugSet(html, /\/components\/([a-z0-9-]+)\//giu);
    },
  },
  {
    id: "va",
    name: "VA.gov Design System",
    inventoryFile: "va.json",
    sourceUrl: "https://design.va.gov/components/",
    inventoryKey: "currentComponents",
    extractIds(html) {
      return extractSlugSet(html, /\/components\/([a-z0-9-]+)(?:["/#?]|$)/giu);
    },
  },
  {
    id: "cms",
    name: "CMS Design System",
    inventoryFile: "cms.json",
    sourceUrl: "https://design.cms.gov/components/overview/",
    inventoryKey: "officialComponents",
    extractIds(html) {
      return extractSlugSet(html, /\/components\/([a-z0-9-]+)\//giu);
    },
  },
  {
    id: "govuk",
    name: "GOV.UK Design System",
    inventoryFile: "govuk.json",
    sourceUrl: "https://design-system.service.gov.uk/components/",
    inventoryKey: "officialComponents",
    extractIds(html) {
      return extractSlugSet(html, /\/components\/([a-z0-9-]+)\//giu);
    },
  },
];

function extractSlugSet(html, pattern) {
  const ids = new Set();
  for (const match of html.matchAll(pattern)) {
    ids.add(String(match[1]).toLowerCase());
  }
  return ids;
}

function getInventoryIds(inventory, inventoryKey) {
  const items = inventory[inventoryKey] ?? [];
  return new Set(items.map((item) => String(item.id).toLowerCase()));
}

function compareSets(expectedSet, observedSet) {
  const missingFromInventory = [...observedSet].filter((id) => !expectedSet.has(id)).sort();
  const missingFromUpstream = [...expectedSet].filter((id) => !observedSet.has(id)).sort();

  return {
    matches: missingFromInventory.length === 0 && missingFromUpstream.length === 0,
    missingFromInventory,
    missingFromUpstream,
  };
}

async function validateSystem(system) {
  const inventoryPath = path.join(INVENTORY_DIR, system.inventoryFile);
  const inventory = JSON.parse(await fs.readFile(inventoryPath, "utf8"));
  const response = await fetch(system.sourceUrl, {
    headers: {
      "user-agent": "design-system-scan/0.1.0 inventory validator",
      accept: "text/html,application/xhtml+xml",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${system.sourceUrl}: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const observedIds = system.extractIds(html);
  const expectedIds = getInventoryIds(inventory, system.inventoryKey);
  const comparison = compareSets(expectedIds, observedIds);

  return {
    id: system.id,
    name: system.name,
    sourceUrl: system.sourceUrl,
    inventoryFile: path.relative(ROOT_DIR, inventoryPath),
    inventoryCount: expectedIds.size,
    upstreamCount: observedIds.size,
    ...comparison,
  };
}

function buildMarkdownReport(results) {
  const lines = [
    "# Design system inventory validation",
    "",
    `Checked at: ${new Date().toISOString()}`,
    "",
  ];

  for (const result of results) {
    lines.push(`## ${result.name}`);
    lines.push("");
    lines.push(`- Source URL: ${result.sourceUrl}`);
    lines.push(`- Inventory file: ${result.inventoryFile}`);
    lines.push(`- Inventory count: ${result.inventoryCount}`);
    lines.push(`- Upstream count: ${result.upstreamCount}`);
    lines.push(`- Status: ${result.matches ? "match" : "drift detected"}`);
    if (result.missingFromInventory.length > 0) {
      lines.push(`- Missing from inventory: ${result.missingFromInventory.join(", ")}`);
    }
    if (result.missingFromUpstream.length > 0) {
      lines.push(`- Missing from upstream: ${result.missingFromUpstream.join(", ")}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

async function main() {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    console.log(`Usage: node src/validate-inventories.js [--output <dir>]

Fetch live design system component overview pages and compare them to
the inventory JSON files in data/design-systems/.
`);
    return;
  }

  const outputDir = process.argv.includes("--output")
    ? path.resolve(process.argv[process.argv.indexOf("--output") + 1])
    : path.join(ROOT_DIR, "artifacts", "inventory-validation");

  await fs.mkdir(outputDir, { recursive: true });

  const results = [];
  for (const system of SYSTEMS) {
    results.push(await validateSystem(system));
  }

  const summary = {
    checkedAt: new Date().toISOString(),
    status: results.every((result) => result.matches) ? "ok" : "drift-detected",
    systems: results,
  };

  await fs.writeFile(path.join(outputDir, "inventory-validation.json"), JSON.stringify(summary, null, 2), "utf8");
  await fs.writeFile(path.join(outputDir, "inventory-validation.md"), buildMarkdownReport(results), "utf8");

  for (const result of results) {
    console.log(
      `${result.matches ? "OK" : "DRIFT"} ${result.id}: inventory=${result.inventoryCount} upstream=${result.upstreamCount}`
    );
    if (result.missingFromInventory.length > 0) {
      console.log(`  missing from inventory: ${result.missingFromInventory.join(", ")}`);
    }
    if (result.missingFromUpstream.length > 0) {
      console.log(`  missing from upstream: ${result.missingFromUpstream.join(", ")}`);
    }
  }

  if (summary.status !== "ok") {
    process.exitCode = 1;
  }
}

await main();

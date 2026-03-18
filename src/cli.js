#!/usr/bin/env node

import fs from "node:fs/promises";
import process from "node:process";

import { scanUrls } from "./scanner.js";
import { formatDiffReport, formatTextReport } from "./reporters.js";
import { diffSnapshots, loadSnapshot, saveSnapshot } from "./snapshots.js";
import { getSystemDefinition, listSystemDefinitions } from "./systems/index.js";

function printHelp() {
  console.log(`design-system-scan

Usage:
  node src/cli.js --system uswds <url> [more urls]
  node src/cli.js --system uswds --file urls.txt

Options:
  --system <id>         Design system definition to use. Default: uswds
  --file <path>         Read newline-delimited URLs from a file
  --crawl               Discover same-origin pages from the seed URLs
  --max-pages <n>       Max pages to scan when crawling. Default: 25
  --json                Emit raw JSON instead of the text report
  --no-assets           Skip fetching linked CSS/JS assets
  --asset-limit <n>     Max CSS and JS assets to fetch per page. Default: 8
  --timeout <ms>        Request timeout per fetch. Default: 15000
  --save <path>         Save the scan report as JSON
  --compare <path>      Compare the current report against a saved snapshot
  --list-systems        Print available system definitions
  --help                Show this message
`);
}

function parseArgs(argv) {
  const options = {
    system: "uswds",
    includeAssets: true,
    assetLimit: 8,
    crawl: false,
    maxPages: 25,
    timeoutMs: 15000,
    json: false,
    listSystems: false,
    file: null,
    save: null,
    compare: null,
    urls: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--system") {
      options.system = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--file") {
      options.file = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--asset-limit") {
      options.assetLimit = Number.parseInt(argv[index + 1], 10);
      index += 1;
      continue;
    }

    if (arg === "--max-pages") {
      options.maxPages = Number.parseInt(argv[index + 1], 10);
      index += 1;
      continue;
    }

    if (arg === "--timeout") {
      options.timeoutMs = Number.parseInt(argv[index + 1], 10);
      index += 1;
      continue;
    }

    if (arg === "--json") {
      options.json = true;
      continue;
    }

    if (arg === "--no-assets") {
      options.includeAssets = false;
      continue;
    }

    if (arg === "--crawl") {
      options.crawl = true;
      continue;
    }

    if (arg === "--save") {
      options.save = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--compare") {
      options.compare = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--list-systems") {
      options.listSystems = true;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }

    options.urls.push(arg);
  }

  return options;
}

async function readUrlsFromFile(pathname) {
  const content = await fs.readFile(pathname, "utf8");

  return content
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  if (options.listSystems) {
    const systems = listSystemDefinitions();
    systems.forEach((system) => {
      console.log(`${system.id}\t${system.name}\t${system.version}`);
    });
    return;
  }

  const system = getSystemDefinition(options.system);

  if (!system) {
    console.error(`Unknown system "${options.system}".`);
    process.exitCode = 1;
    return;
  }

  const fileUrls = options.file ? await readUrlsFromFile(options.file) : [];
  const urls = [...fileUrls, ...options.urls];

  if (urls.length === 0) {
    console.error("No URLs provided. Use positional URLs or --file.");
    process.exitCode = 1;
    return;
  }

  const report = await scanUrls(urls, system, {
    includeAssets: options.includeAssets,
    assetLimit: options.assetLimit,
    crawl: options.crawl,
    maxPages: options.maxPages,
    timeoutMs: options.timeoutMs,
  });

  if (options.save) {
    await saveSnapshot(options.save, report);
  }

  let diff = null;

  if (options.compare) {
    const previous = await loadSnapshot(options.compare);
    diff = diffSnapshots(previous, report, options.compare, options.save ?? "(unsaved current run)");
  }

  if (options.json) {
    console.log(JSON.stringify({ report, diff }, null, 2));
    return;
  }

  console.log(formatTextReport(report));

  if (diff) {
    console.log(formatDiffReport(diff));
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

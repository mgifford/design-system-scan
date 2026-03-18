import { URL } from "node:url";

const VERSION_REGEXES = [
  /uswds(?:[-/.@]|%40)?v?(\d+\.\d+\.\d+)/giu,
  /@uswds\/uswds@(\d+\.\d+\.\d+)/giu,
  /uswds[\w./-]*?(\d+\.\d+\.\d+)/giu,
  /USWDS\s+(\d+\.\d+\.\d+)/giu,
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function uniq(values) {
  return [...new Set(values)];
}

function normalizeWhitespace(value) {
  return value.replace(/\s+/gu, " ").trim();
}

function createTimeoutSignal(timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    clear: () => clearTimeout(timer),
  };
}

async function fetchText(url, timeoutMs) {
  const timeout = createTimeoutSignal(timeoutMs);

  try {
    const response = await fetch(url, {
      signal: timeout.signal,
      headers: {
        "user-agent": "design-system-scan/0.1",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.text();
  } finally {
    timeout.clear();
  }
}

function resolveUrl(baseUrl, candidate) {
  try {
    return new URL(candidate, baseUrl).toString();
  } catch {
    return null;
  }
}

function extractClasses(html) {
  const classValues = [];

  for (const match of html.matchAll(/class\s*=\s*["']([^"']+)["']/giu)) {
    classValues.push(match[1]);
  }

  const classes = classValues.flatMap((value) =>
    value
      .split(/\s+/u)
      .map((item) => item.trim())
      .filter(Boolean)
  );

  return uniq(classes);
}

function extractLinkedAssets(html, baseUrl) {
  const stylesheetUrls = [];
  const scriptUrls = [];

  for (const match of html.matchAll(/<link\b[^>]*href=["']([^"']+)["'][^>]*>/giu)) {
    const tag = match[0];
    const href = match[1];

    if (/rel=["'][^"']*stylesheet[^"']*["']/iu.test(tag)) {
      const absolute = resolveUrl(baseUrl, href);

      if (absolute) {
        stylesheetUrls.push(absolute);
      }
    }
  }

  for (const match of html.matchAll(/<script\b[^>]*src=["']([^"']+)["'][^>]*>/giu)) {
    const src = match[1];
    const absolute = resolveUrl(baseUrl, src);

    if (absolute) {
      scriptUrls.push(absolute);
    }
  }

  return {
    cssUrls: uniq(stylesheetUrls),
    jsUrls: uniq(scriptUrls),
  };
}

function detectVersions(texts) {
  const hits = [];

  for (const text of texts) {
    for (const regex of VERSION_REGEXES) {
      for (const match of text.matchAll(regex)) {
        hits.push(match[1]);
      }
    }
  }

  return uniq(hits);
}

function scoreSignals(signals, context, definitionThresholds) {
  const matchedSignals = [];
  let matchedWeight = 0;
  let possibleWeight = 0;

  for (const signal of signals) {
    const weight = signal.weight ?? 1;
    possibleWeight += weight;

    const matched = signalMatches(signal, context);
    if (!matched) {
      continue;
    }

    matchedWeight += weight;
    matchedSignals.push({
      label: signal.label,
      source: matched.source,
      value: matched.value,
      weight,
    });
  }

  const coverage = possibleWeight === 0 ? 0 : matchedWeight / possibleWeight;
  const thresholds = definitionThresholds ?? {
    full: 0.75,
    partial: 0.3,
  };

  let status = "absent";

  if (coverage >= thresholds.full) {
    status = "full";
  } else if (coverage >= thresholds.partial) {
    status = "partial";
  }

  return {
    status,
    matchedWeight,
    possibleWeight,
    coverage: Number.parseFloat(coverage.toFixed(3)),
    matchedSignals,
  };
}

function signalMatches(signal, context) {
  if (signal.type === "asset-substring") {
    const asset = context.assetUrls.find((value) => value.includes(signal.pattern));
    return asset ? { source: "asset-url", value: asset } : null;
  }

  if (signal.type === "class-exact") {
    const className = context.classes.find((value) => value === signal.pattern);
    return className ? { source: "class", value: className } : null;
  }

  if (signal.type === "class-prefix") {
    const className = context.classes.find((value) => value.startsWith(signal.pattern));
    return className ? { source: "class", value: className } : null;
  }

  if (signal.type === "class-regex") {
    const regex = new RegExp(signal.pattern, "u");
    const className = context.classes.find((value) => regex.test(value));
    return className ? { source: "class", value: className } : null;
  }

  if (signal.type === "html-regex") {
    const regex = new RegExp(signal.pattern, "iu");
    const match = context.html.match(regex);
    return match ? { source: "html", value: normalizeWhitespace(match[0]) } : null;
  }

  if (signal.type === "css-regex") {
    const regex = new RegExp(signal.pattern, "iu");
    const cssMatch = context.cssTexts.find((value) => regex.test(value));
    if (!cssMatch) {
      return null;
    }

    return { source: "css", value: signal.pattern };
  }

  if (signal.type === "js-regex") {
    const regex = new RegExp(signal.pattern, "iu");
    const jsMatch = context.jsTexts.find((value) => regex.test(value));
    if (!jsMatch) {
      return null;
    }

    return { source: "js", value: signal.pattern };
  }

  if (signal.type === "text-substring") {
    const haystacks = [context.html, ...context.cssTexts, ...context.jsTexts];
    const hit = haystacks.find((value) => value.includes(signal.pattern));
    return hit ? { source: "text", value: signal.pattern } : null;
  }

  return null;
}

function buildContext(page, assets) {
  const cssTexts = assets.css
    .filter((asset) => typeof asset.content === "string")
    .map((asset) => asset.content);
  const jsTexts = assets.js
    .filter((asset) => typeof asset.content === "string")
    .map((asset) => asset.content);
  const assetUrls = [
    ...page.cssUrls,
    ...page.jsUrls,
    ...assets.css.map((asset) => asset.url),
    ...assets.js.map((asset) => asset.url),
  ];

  return {
    html: page.html,
    classes: page.classes,
    cssTexts,
    jsTexts,
    assetUrls,
  };
}

async function fetchAssets(urls, limit, timeoutMs) {
  const selectedUrls = urls.slice(0, limit);

  const responses = await Promise.all(
    selectedUrls.map(async (assetUrl) => {
      try {
        const content = await fetchText(assetUrl, timeoutMs);
        return { url: assetUrl, content };
      } catch (error) {
        return {
          url: assetUrl,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    })
  );

  return responses;
}

function summarizePage(pageReport, definition) {
  const matchedComponents = pageReport.components.filter(
    (component) => component.status !== "absent"
  );
  const fullyImplemented = matchedComponents.filter(
    (component) => component.status === "full"
  ).length;
  const partiallyImplemented = matchedComponents.filter(
    (component) => component.status === "partial"
  ).length;
  const overallCoverage =
    definition.components.length === 0
      ? 0
      : (fullyImplemented + partiallyImplemented * 0.5) / definition.components.length;

  return {
    matchedComponentCount: matchedComponents.length,
    fullComponentCount: fullyImplemented,
    partialComponentCount: partiallyImplemented,
    overallCoverage: Number.parseFloat(clamp(overallCoverage, 0, 1).toFixed(3)),
  };
}

export async function scanUrl(url, definition, options) {
  const page = {
    url,
    html: "",
    classes: [],
    cssUrls: [],
    jsUrls: [],
    errors: [],
  };

  try {
    page.html = await fetchText(url, options.timeoutMs);
  } catch (error) {
    return {
      url,
      error: error instanceof Error ? error.message : String(error),
      siteFingerprint: null,
      versions: [],
      components: [],
      summary: {
        matchedComponentCount: 0,
        fullComponentCount: 0,
        partialComponentCount: 0,
        overallCoverage: 0,
      },
    };
  }

  page.classes = extractClasses(page.html);
  const assets = extractLinkedAssets(page.html, url);
  page.cssUrls = assets.cssUrls;
  page.jsUrls = assets.jsUrls;

  const assetContent = {
    css: [],
    js: [],
  };

  if (options.includeAssets) {
    assetContent.css = await fetchAssets(page.cssUrls, options.assetLimit, options.timeoutMs);
    assetContent.js = await fetchAssets(page.jsUrls, options.assetLimit, options.timeoutMs);
  }

  const context = buildContext(page, assetContent);
  const siteFingerprint = scoreSignals(
    definition.siteFingerprint.signals,
    context,
    definition.siteFingerprint.thresholds
  );

  const components = definition.components.map((component) => ({
    id: component.id,
    name: component.name,
    ...scoreSignals(component.signals, context, component.thresholds),
  }));

  const versionTexts = [
    page.html,
    ...context.assetUrls,
    ...context.cssTexts,
    ...context.jsTexts,
  ];

  const versions = detectVersions(versionTexts);
  const assetErrors = [...assetContent.css, ...assetContent.js]
    .filter((asset) => asset.error)
    .map((asset) => `${asset.url}: ${asset.error}`);

  return {
    url,
    error: null,
    scannedAt: new Date().toISOString(),
    versions,
    siteFingerprint,
    components,
    assetInventory: {
      cssUrls: page.cssUrls,
      jsUrls: page.jsUrls,
      cssFetched: assetContent.css.length,
      jsFetched: assetContent.js.length,
      assetErrors,
    },
    summary: summarizePage({ components }, definition),
  };
}

export async function scanUrls(urls, definition, options) {
  const pages = [];

  for (const url of urls) {
    pages.push(await scanUrl(url, definition, options));
  }

  return {
    system: {
      id: definition.id,
      name: definition.name,
      trackedVersion: definition.version,
      homepage: definition.homepage,
      docs: definition.docs,
    },
    options,
    pages,
  };
}

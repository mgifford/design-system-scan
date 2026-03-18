import { URL } from "node:url";

const VERSION_REGEXES = [
  /(?:^|[^a-z])uswds(?:[-/.@]|%40|%2f|\/|@)?(?:min[.-])?(?:css|js)?[^0-9]{0,10}v?(\d+\.\d+\.\d+)/giu,
  /@uswds\/uswds@(\d+\.\d+\.\d+)/giu,
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

function normalizePageUrl(url) {
  try {
    const parsed = new URL(url);
    parsed.hash = "";

    if ((parsed.pathname === "" || parsed.pathname === "/") && !parsed.search) {
      parsed.pathname = "/";
    }

    return parsed.toString();
  } catch {
    return url;
  }
}

function sameOrigin(left, right) {
  try {
    return new URL(left).origin === new URL(right).origin;
  } catch {
    return false;
  }
}

function shouldSkipCrawlUrl(url) {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.toLowerCase();

    if (parsed.hash && !pathname) {
      return true;
    }

    return (
      pathname.endsWith(".pdf") ||
      pathname.endsWith(".jpg") ||
      pathname.endsWith(".jpeg") ||
      pathname.endsWith(".png") ||
      pathname.endsWith(".gif") ||
      pathname.endsWith(".svg") ||
      pathname.endsWith(".zip") ||
      pathname.endsWith(".doc") ||
      pathname.endsWith(".docx") ||
      pathname.endsWith(".xls") ||
      pathname.endsWith(".xlsx") ||
      pathname.endsWith(".ppt") ||
      pathname.endsWith(".pptx")
    );
  } catch {
    return true;
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

function extractTags(html) {
  const tags = [];

  for (const match of html.matchAll(/<([a-z][a-z0-9-]*)\b/giu)) {
    tags.push(match[1].toLowerCase());
  }

  return uniq(tags);
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

function extractLinkedPages(html, baseUrl) {
  const links = [];

  for (const match of html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/giu)) {
    const href = match[1];
    const absolute = normalizePageUrl(resolveUrl(baseUrl, href));

    if (!absolute || !sameOrigin(baseUrl, absolute) || shouldSkipCrawlUrl(absolute)) {
      continue;
    }

    links.push(absolute);
  }

  return uniq(links);
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
  const missingSignals = [];
  let matchedWeight = 0;
  let possibleWeight = 0;

  for (const signal of signals) {
    const weight = signal.weight ?? 1;
    possibleWeight += weight;

    const matched = signalMatches(signal, context);
    if (!matched) {
      missingSignals.push({
        label: signal.label,
        weight,
      });
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
    missingSignals,
  };
}

function signalMatches(signal, context) {
  if (signal.type === "component-ref") {
    const component = context.componentMap?.get(signal.componentId);

    if (!component) {
      return null;
    }

    const minimum = signal.minimumStatus ?? "partial";
    const ranks = {
      absent: 0,
      partial: 1,
      full: 2,
    };

    if ((ranks[component.status] ?? 0) < (ranks[minimum] ?? 1)) {
      return null;
    }

    return {
      source: "component",
      value: `${component.name}:${component.status}`,
    };
  }

  if (signal.type === "tag-exact") {
    const tagName = context.tags.find((value) => value === signal.pattern.toLowerCase());
    return tagName ? { source: "tag", value: tagName } : null;
  }

  if (signal.type === "tag-prefix") {
    const tagName = context.tags.find((value) => value.startsWith(signal.pattern.toLowerCase()));
    return tagName ? { source: "tag", value: tagName } : null;
  }

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
    tags: page.tags,
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
  const matchedTemplates = (pageReport.templates ?? []).filter(
    (template) => template.status !== "absent"
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
    matchedTemplateCount: matchedTemplates.length,
    overallCoverage: Number.parseFloat(clamp(overallCoverage, 0, 1).toFixed(3)),
  };
}

function evaluatePageContent(url, html, definition, options, assetContent = { css: [], js: [] }) {
  const page = {
    url,
    html,
    classes: extractClasses(html),
    tags: extractTags(html),
    cssUrls: [],
    jsUrls: [],
    errors: [],
  };

  const linkedAssets = extractLinkedAssets(page.html, url);
  page.cssUrls = linkedAssets.cssUrls;
  page.jsUrls = linkedAssets.jsUrls;

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
  const componentMap = new Map(components.map((component) => [component.id, component]));
  const templates = (definition.templates ?? []).map((template) => ({
    id: template.id,
    name: template.name,
    ...scoreSignals(
      template.signals,
      {
        ...context,
        componentMap,
      },
      template.thresholds
    ),
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
    templates,
    assetInventory: {
      cssUrls: page.cssUrls,
      jsUrls: page.jsUrls,
      cssFetched: assetContent.css.length,
      jsFetched: assetContent.js.length,
      assetErrors,
    },
    summary: summarizePage({ components, templates }, definition),
  };
}

export function evaluateHtml(url, html, definition) {
  return evaluatePageContent(url, html, definition, {
    includeAssets: false,
    assetLimit: 0,
    timeoutMs: 0,
  });
}

export async function scanUrl(url, definition, options) {
  let html = "";

  try {
    html = await fetchText(url, options.timeoutMs);
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
  const linkedAssets = extractLinkedAssets(html, url);

  const assetContent = {
    css: [],
    js: [],
  };

  if (options.includeAssets) {
    assetContent.css = await fetchAssets(linkedAssets.cssUrls, options.assetLimit, options.timeoutMs);
    assetContent.js = await fetchAssets(linkedAssets.jsUrls, options.assetLimit, options.timeoutMs);
  }

  return evaluatePageContent(url, html, definition, options, assetContent);
}

export async function discoverUrls(seedUrls, options) {
  const queue = seedUrls.map((url) => normalizePageUrl(url));
  const seen = new Set();
  const discovered = [];

  while (queue.length > 0 && discovered.length < options.maxPages) {
    const url = queue.shift();

    if (!url || seen.has(url)) {
      continue;
    }

    seen.add(url);
    discovered.push(url);

    if (!options.crawl) {
      continue;
    }

    let html = "";

    try {
      html = await fetchText(url, options.timeoutMs);
    } catch {
      continue;
    }

    const nextUrls = extractLinkedPages(html, url);

    for (const nextUrl of nextUrls) {
      if (!seen.has(nextUrl) && queue.length + discovered.length < options.maxPages * 4) {
        queue.push(nextUrl);
      }
    }
  }

  return discovered;
}

export async function scanUrls(urls, definition, options) {
  const discoveredUrls = await discoverUrls(urls, options);
  const pages = [];

  for (const url of discoveredUrls) {
    pages.push(await scanUrl(url, definition, options));
  }

  const siteSummary = summarizeSite(pages);

  return {
    system: {
      id: definition.id,
      name: definition.name,
      trackedVersion: definition.version,
      homepage: definition.homepage,
      docs: definition.docs,
    },
    options,
    crawl: {
      enabled: options.crawl,
      requestedSeeds: urls,
      scannedUrls: discoveredUrls,
      maxPages: options.maxPages,
    },
    pages,
    siteSummary,
  };
}

function summarizeSite(pages) {
  const successfulPages = pages.filter((page) => !page.error);
  const fingerprintPages = successfulPages.filter(
    (page) => page.siteFingerprint && page.siteFingerprint.status !== "absent"
  );
  const componentCounts = new Map();
  const templateCounts = new Map();

  for (const page of successfulPages) {
    for (const component of page.components) {
      if (component.status === "absent") {
        continue;
      }

      const current = componentCounts.get(component.id) ?? {
        id: component.id,
        name: component.name,
        full: 0,
        partial: 0,
      };

      if (component.status === "full") {
        current.full += 1;
      } else if (component.status === "partial") {
        current.partial += 1;
      }

      componentCounts.set(component.id, current);
    }

    for (const template of page.templates ?? []) {
      if (template.status === "absent") {
        continue;
      }

      const current = templateCounts.get(template.id) ?? {
        id: template.id,
        name: template.name,
        full: 0,
        partial: 0,
      };

      if (template.status === "full") {
        current.full += 1;
      } else if (template.status === "partial") {
        current.partial += 1;
      }

      templateCounts.set(template.id, current);
    }
  }

  return {
    pageCount: pages.length,
    successfulPageCount: successfulPages.length,
    fingerprintedPageCount: fingerprintPages.length,
    components: [...componentCounts.values()].sort((left, right) => {
      const leftScore = left.full * 2 + left.partial;
      const rightScore = right.full * 2 + right.partial;
      return rightScore - leftScore;
    }),
    templates: [...templateCounts.values()].sort((left, right) => {
      const leftScore = left.full * 2 + left.partial;
      const rightScore = right.full * 2 + right.partial;
      return rightScore - leftScore;
    }),
  };
}

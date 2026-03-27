import test from "node:test";
import assert from "node:assert/strict";

import { discoverUrls } from "../src/scanner.js";

test("discoverUrls seeds crawl queue from sitemap xml on same origin", async () => {
  const responses = new Map([
    [
      "https://www.canada.ca/sitemap.xml",
      `<?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        <url><loc>https://www.canada.ca/en.html</loc></url>
        <url><loc>https://www.canada.ca/fr.html</loc></url>
        <url><loc>https://www.canada.ca/services.html</loc></url>
      </urlset>`,
    ],
    [
      "https://www.canada.ca/",
      `<html><body><main><h1>Canada</h1></main></body></html>`,
    ],
    [
      "https://www.canada.ca/en.html",
      `<html><body><a href="/services.html">Services</a></body></html>`,
    ],
    [
      "https://www.canada.ca/fr.html",
      `<html><body><a href="/en.html">English</a></body></html>`,
    ],
    [
      "https://www.canada.ca/services.html",
      `<html><body><p>Services</p></body></html>`,
    ],
  ]);

  const urls = await discoverUrls(["https://www.canada.ca/"], {
    crawl: true,
    maxPages: 4,
    timeoutMs: 1000,
    fetchText: async (url) => {
      if (!responses.has(url)) {
        throw new Error(`Unexpected fetch: ${url}`);
      }

      return responses.get(url);
    },
  });

  assert.equal(urls.length, 4);
  assert.ok(urls.includes("https://www.canada.ca/"));
  assert.ok(urls.includes("https://www.canada.ca/en.html"));
  assert.ok(urls.includes("https://www.canada.ca/fr.html"));
  assert.ok(urls.includes("https://www.canada.ca/services.html"));
});

test("discoverUrls respects crawlDelayMs between page fetches", async () => {
  const pageUrls = new Set([
    "https://example.com/",
    "https://example.com/page1.html",
    "https://example.com/page2.html",
  ]);
  const fetchTimestamps = [];
  const responses = new Map([
    [
      "https://example.com/",
      `<html><body><a href="/page1.html">Page 1</a><a href="/page2.html">Page 2</a></body></html>`,
    ],
    ["https://example.com/page1.html", `<html><body><p>Page 1</p></body></html>`],
    ["https://example.com/page2.html", `<html><body><p>Page 2</p></body></html>`],
  ]);

  const urls = await discoverUrls(["https://example.com/"], {
    crawl: true,
    maxPages: 3,
    crawlDelayMs: 50,
    timeoutMs: 1000,
    fetchText: async (url) => {
      if (pageUrls.has(url)) {
        fetchTimestamps.push(Date.now());
      }

      return responses.get(url) ?? "";
    },
  });

  assert.equal(urls.length, 3);
  assert.equal(fetchTimestamps.length, 3, "Expected exactly three page fetches");
  for (let i = 1; i < fetchTimestamps.length; i++) {
    assert.ok(
      fetchTimestamps[i] - fetchTimestamps[i - 1] >= 30,
      `Expected at least 30ms between fetches (got ${fetchTimestamps[i] - fetchTimestamps[i - 1]}ms)`
    );
  }
});

test("discoverUrls continues crawling after a failed page fetch", async () => {
  const responses = new Map([
    [
      "https://example.com/",
      `<html><body>
        <a href="/ok.html">OK</a>
        <a href="/fail.html">Fail</a>
      </body></html>`,
    ],
    ["https://example.com/ok.html", `<html><body><p>OK</p></body></html>`],
  ]);

  const urls = await discoverUrls(["https://example.com/"], {
    crawl: true,
    maxPages: 5,
    timeoutMs: 1000,
    fetchText: async (url) => {
      if (url === "https://example.com/fail.html") {
        throw new Error("HTTP 403");
      }

      return responses.get(url) ?? "";
    },
  });

  assert.ok(urls.includes("https://example.com/"));
  assert.ok(urls.includes("https://example.com/ok.html"));
  assert.ok(!urls.includes("https://example.com/fail.html"));
});

test("discoverUrls excludes sitemap xml, pdf files, and redirect-only endpoints from scanned pages", async () => {
  const urls = await discoverUrls(["https://www.dhs.gov/"], {
    crawl: true,
    maxPages: 10,
    timeoutMs: 1000,
    fetchPage: async (url) => {
      if (url === "https://www.dhs.gov/") {
        return {
          url,
          finalUrl: url,
          redirected: false,
          contentType: "text/html; charset=utf-8",
          text: `<html><body>
            <a href="/news.html">News</a>
            <a href="/sitemap.xml?page=1">XML</a>
            <a href="/files/report.pdf">PDF</a>
            <a href="/facebook">Facebook</a>
          </body></html>`,
        };
      }

      if (url === "https://www.dhs.gov/news.html") {
        return {
          url,
          finalUrl: url,
          redirected: false,
          contentType: "text/html; charset=utf-8",
          text: `<html><body><p>News</p></body></html>`,
        };
      }

      if (url === "https://www.dhs.gov/facebook") {
        return {
          url,
          finalUrl: "https://www.facebook.com/dhsgov",
          redirected: true,
          contentType: "text/html; charset=utf-8",
          text: `<html><body><p>Redirected</p></body></html>`,
        };
      }

      throw new Error(`Unexpected fetch: ${url}`);
    },
  });

  assert.deepEqual(urls, [
    "https://www.dhs.gov/",
    "https://www.dhs.gov/news.html",
  ]);
});

test("discoverUrls excludes non-html responses discovered from sitemap entries", async () => {
  const responses = new Map([
    [
      "https://example.gov/sitemap.xml",
      `<?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        <url><loc>https://example.gov/</loc></url>
        <url><loc>https://example.gov/policy.xml</loc></url>
        <url><loc>https://example.gov/guide.pdf</loc></url>
        <url><loc>https://example.gov/apply</loc></url>
      </urlset>`,
    ],
  ]);

  const urls = await discoverUrls(["https://example.gov/"], {
    crawl: true,
    maxPages: 10,
    timeoutMs: 1000,
    fetchText: async (url) => {
      if (!responses.has(url)) {
        throw new Error(`Unexpected sitemap fetch: ${url}`);
      }

      return responses.get(url);
    },
    fetchPage: async (url) => {
      if (url === "https://example.gov/" || url === "https://example.gov/apply") {
        return {
          url,
          finalUrl: url,
          redirected: false,
          contentType: "text/html; charset=utf-8",
          text: `<html><body><p>HTML page</p></body></html>`,
        };
      }

      if (url === "https://example.gov/policy.xml") {
        return {
          url,
          finalUrl: url,
          redirected: false,
          contentType: "application/xml; charset=utf-8",
          text: `<?xml version="1.0"?><policy />`,
        };
      }

      throw new Error(`Unexpected page fetch: ${url}`);
    },
  });

  assert.deepEqual(urls, [
    "https://example.gov/",
    "https://example.gov/apply",
  ]);
});

test("discoverUrls follows cross-origin redirect from seed URL (bare domain to www)", async () => {
  // Simulates ncbi.nlm.nih.gov → www.ncbi.nlm.nih.gov
  const urls = await discoverUrls(["https://ncbi.nlm.nih.gov/"], {
    crawl: true,
    maxPages: 3,
    timeoutMs: 1000,
    fetchPage: async (url) => {
      if (url === "https://ncbi.nlm.nih.gov/") {
        return {
          url,
          finalUrl: "https://www.ncbi.nlm.nih.gov/",
          redirected: true,
          contentType: "text/html; charset=utf-8",
          text: `<html><body><a href="/about">About</a><a href="/search">Search</a></body></html>`,
        };
      }

      if (url === "https://www.ncbi.nlm.nih.gov/") {
        return {
          url,
          finalUrl: url,
          redirected: false,
          contentType: "text/html; charset=utf-8",
          text: `<html><body><a href="/about">About</a><a href="/search">Search</a></body></html>`,
        };
      }

      if (url === "https://www.ncbi.nlm.nih.gov/about") {
        return {
          url,
          finalUrl: url,
          redirected: false,
          contentType: "text/html; charset=utf-8",
          text: `<html><body><p>About NCBI</p></body></html>`,
        };
      }

      if (url === "https://www.ncbi.nlm.nih.gov/search") {
        return {
          url,
          finalUrl: url,
          redirected: false,
          contentType: "text/html; charset=utf-8",
          text: `<html><body><p>Search</p></body></html>`,
        };
      }

      throw new Error(`Unexpected fetch: ${url}`);
    },
  });

  assert.ok(urls.length > 0, "Expected at least one page to be discovered after following redirect");
  assert.ok(urls.some((u) => u === "https://www.ncbi.nlm.nih.gov/"), "Expected canonical www URL to be discovered");
});

test("discoverUrls follows cross-origin redirect from seed URL without crawling", async () => {
  const urls = await discoverUrls(["https://ncbi.nlm.nih.gov/"], {
    crawl: false,
    maxPages: 1,
    timeoutMs: 1000,
    fetchPage: async (url) => {
      if (url === "https://ncbi.nlm.nih.gov/") {
        return {
          url,
          finalUrl: "https://www.ncbi.nlm.nih.gov/",
          redirected: true,
          contentType: "text/html; charset=utf-8",
          text: `<html><body><p>Home</p></body></html>`,
        };
      }

      if (url === "https://www.ncbi.nlm.nih.gov/") {
        return {
          url,
          finalUrl: url,
          redirected: false,
          contentType: "text/html; charset=utf-8",
          text: `<html><body><p>Home</p></body></html>`,
        };
      }

      throw new Error(`Unexpected fetch: ${url}`);
    },
  });

  assert.deepEqual(urls, ["https://www.ncbi.nlm.nih.gov/"]);
});

test("discoverUrls still blocks cross-origin redirects from non-seed crawled links", async () => {
  const urls = await discoverUrls(["https://example.gov/"], {
    crawl: true,
    maxPages: 5,
    timeoutMs: 1000,
    fetchPage: async (url) => {
      if (url === "https://example.gov/") {
        return {
          url,
          finalUrl: url,
          redirected: false,
          contentType: "text/html; charset=utf-8",
          text: `<html><body>
            <a href="/local">Local</a>
            <a href="/external-redirect">External redirect</a>
          </body></html>`,
        };
      }

      if (url === "https://example.gov/local") {
        return {
          url,
          finalUrl: url,
          redirected: false,
          contentType: "text/html; charset=utf-8",
          text: `<html><body><p>Local page</p></body></html>`,
        };
      }

      if (url === "https://example.gov/external-redirect") {
        return {
          url,
          finalUrl: "https://other-domain.gov/",
          redirected: true,
          contentType: "text/html; charset=utf-8",
          text: `<html><body><p>Redirected away</p></body></html>`,
        };
      }

      throw new Error(`Unexpected fetch: ${url}`);
    },
  });

  assert.ok(urls.some((u) => u === "https://example.gov/"), "Expected seed page");
  assert.ok(urls.some((u) => u === "https://example.gov/local"), "Expected local link");
  assert.ok(!urls.some((u) => u === "https://other-domain.gov/"), "Cross-origin redirect from crawled link should be blocked");
});

test("discoverUrls discovers sitemaps from canonical URL after seed cross-origin redirect", async () => {
  const urls = await discoverUrls(["https://example.gov/"], {
    crawl: true,
    maxPages: 5,
    timeoutMs: 1000,
    fetchText: async (url) => {
      if (url === "https://www.example.gov/sitemap.xml") {
        return `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <url><loc>https://www.example.gov/news</loc></url>
          <url><loc>https://www.example.gov/about</loc></url>
        </urlset>`;
      }

      // Original domain sitemap fails (or has no matching entries)
      throw new Error(`No sitemap at ${url}`);
    },
    fetchPage: async (url) => {
      if (url === "https://example.gov/") {
        return {
          url,
          finalUrl: "https://www.example.gov/",
          redirected: true,
          contentType: "text/html; charset=utf-8",
          text: `<html><body><p>Home</p></body></html>`,
        };
      }

      if (url === "https://www.example.gov/") {
        return {
          url,
          finalUrl: url,
          redirected: false,
          contentType: "text/html; charset=utf-8",
          text: `<html><body><p>Home</p></body></html>`,
        };
      }

      if (url === "https://www.example.gov/news" || url === "https://www.example.gov/about") {
        return {
          url,
          finalUrl: url,
          redirected: false,
          contentType: "text/html; charset=utf-8",
          text: `<html><body><p>Page</p></body></html>`,
        };
      }

      throw new Error(`Unexpected fetch: ${url}`);
    },
  });

  assert.ok(urls.some((u) => u === "https://www.example.gov/"), "Expected canonical home page");
  assert.ok(
    urls.some((u) => u === "https://www.example.gov/news") || urls.some((u) => u === "https://www.example.gov/about"),
    "Expected sitemap URLs from canonical origin to be discovered"
  );
});

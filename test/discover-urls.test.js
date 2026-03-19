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
  assert.ok(urls.includes("https://example.com/fail.html"));
});

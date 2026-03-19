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

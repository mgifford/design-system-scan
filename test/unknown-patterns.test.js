import test from "node:test";
import assert from "node:assert/strict";

import { evaluateHtml } from "../src/scanner.js";
import { uswds } from "../src/systems/uswds.js";
import { gcds } from "../src/systems/gcds.js";

function wrap(html) {
  return `<!doctype html><html><head></head><body>${html}</body></html>`;
}

function findPattern(page, type, pattern) {
  return page.unknownPatterns.find((p) => p.type === type && p.pattern === pattern);
}

const EMPTY_SYSTEM = {
  id: "empty",
  name: "Empty",
  version: "0.0.0",
  homepage: "",
  docs: [],
  siteFingerprint: { signals: [] },
  components: [],
  templates: [],
  themes: [],
  tokens: [],
};

// ── Custom element detection ─────────────────────────────────────────────────

test("unknownPatterns includes custom elements not covered by system", () => {
  const html = wrap("<my-widget>Content</my-widget>");
  const page = evaluateHtml("https://example.test/", html, EMPTY_SYSTEM);

  assert.ok(
    findPattern(page, "custom-element", "my-widget"),
    "Should detect my-widget as an uncovered custom element"
  );
});

test("unknownPatterns excludes custom elements covered by tag-exact system signals", () => {
  // gcds-button is covered by GCDS via tag-exact signal
  const html = wrap("<gcds-button>Submit</gcds-button>");
  const page = evaluateHtml("https://example.test/", html, gcds);

  assert.ok(
    !findPattern(page, "custom-element", "gcds-button"),
    "gcds-button should not appear as unknown (covered by GCDS)"
  );
});

test("unknownPatterns includes custom elements not matched by the current system even if covered by another", () => {
  // gcds-button is defined in GCDS but not in USWDS
  const html = wrap("<gcds-button>Submit</gcds-button>");
  const page = evaluateHtml("https://example.test/", html, uswds);

  assert.ok(
    findPattern(page, "custom-element", "gcds-button"),
    "gcds-button should appear as unknown when scanned against USWDS"
  );
});

test("unknownPatterns does not include plain HTML elements", () => {
  const html = wrap("<button type='button'>Click</button><nav></nav>");
  const page = evaluateHtml("https://example.test/", html, EMPTY_SYSTEM);

  const htmlTags = page.unknownPatterns.filter((p) => p.type === "custom-element");
  assert.equal(htmlTags.length, 0, "Standard HTML tags have no hyphens and should not appear");
});

test("unknownPatterns result is an array", () => {
  const html = wrap("<p>Hello</p>");
  const page = evaluateHtml("https://example.test/", html, uswds);

  assert.ok(Array.isArray(page.unknownPatterns), "unknownPatterns should be an array");
});

// ── ARIA widget role detection ────────────────────────────────────────────────

test("unknownPatterns includes role=dialog", () => {
  const html = wrap('<div role="dialog" aria-modal="true"><p>Modal content</p></div>');
  const page = evaluateHtml("https://example.test/", html, EMPTY_SYSTEM);

  assert.ok(findPattern(page, "aria-role", "dialog"), "Should detect role=dialog as an ARIA widget role");
});

test("unknownPatterns includes role=tablist, role=tab, and role=tabpanel", () => {
  const html = wrap(`
    <div role="tablist">
      <button role="tab" aria-selected="true">Tab 1</button>
    </div>
    <div role="tabpanel">Panel content</div>
  `);
  const page = evaluateHtml("https://example.test/", html, EMPTY_SYSTEM);

  assert.ok(findPattern(page, "aria-role", "tablist"), "Should detect role=tablist");
  assert.ok(findPattern(page, "aria-role", "tab"), "Should detect role=tab");
  assert.ok(findPattern(page, "aria-role", "tabpanel"), "Should detect role=tabpanel");
});

test("unknownPatterns does not include non-widget ARIA roles", () => {
  const html = wrap(`
    <main role="main">
      <nav role="navigation">
        <a href="/">Home</a>
      </nav>
    </main>
  `);
  const page = evaluateHtml("https://example.test/", html, EMPTY_SYSTEM);

  assert.ok(!findPattern(page, "aria-role", "main"), "role=main is a landmark, not a widget");
  assert.ok(!findPattern(page, "aria-role", "navigation"), "role=navigation is a landmark, not a widget");
});

test("unknownPatterns includes role=combobox", () => {
  const html = wrap('<input role="combobox" aria-expanded="false" aria-autocomplete="list">');
  const page = evaluateHtml("https://example.test/", html, EMPTY_SYSTEM);

  assert.ok(findPattern(page, "aria-role", "combobox"), "Should detect role=combobox");
});

test("unknownPatterns ARIA roles are unique per page", () => {
  // Two dialogs on the same page should only produce one role=dialog entry
  const html = wrap(`
    <div role="dialog">First</div>
    <div role="dialog">Second</div>
  `);
  const page = evaluateHtml("https://example.test/", html, EMPTY_SYSTEM);

  const dialogEntries = page.unknownPatterns.filter(
    (p) => p.type === "aria-role" && p.pattern === "dialog"
  );
  assert.equal(dialogEntries.length, 1, "Duplicate ARIA roles on one page should appear once");
});

// ── Mixed content ────────────────────────────────────────────────────────────

test("unknownPatterns detects both custom elements and ARIA roles together", () => {
  const html = wrap(`
    <app-modal role="dialog" aria-modal="true">
      <button role="tab">Close</button>
    </app-modal>
  `);
  const page = evaluateHtml("https://example.test/", html, EMPTY_SYSTEM);

  assert.ok(findPattern(page, "custom-element", "app-modal"), "Should detect app-modal custom element");
  assert.ok(findPattern(page, "aria-role", "dialog"), "Should detect role=dialog");
  assert.ok(findPattern(page, "aria-role", "tab"), "Should detect role=tab");
});

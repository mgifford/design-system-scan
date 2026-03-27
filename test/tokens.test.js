import test from "node:test";
import assert from "node:assert/strict";

import { evaluateHtml } from "../src/scanner.js";
import { uswds } from "../src/systems/uswds.js";
import { gcds } from "../src/systems/gcds.js";
import { govuk } from "../src/systems/govuk.js";
import { nlds } from "../src/systems/nlds.js";
import { cms } from "../src/systems/cms.js";
import { va } from "../src/systems/va.js";
import { kolibri } from "../src/systems/kolibri.js";

function wrap(html) {
  return `<!doctype html><html><head></head><body>${html}</body></html>`;
}

function evaluateToken(tokenId, html, definition) {
  const page = evaluateHtml("https://example.test/", wrap(html), definition);
  return (page.tokens ?? []).find((token) => token.id === tokenId);
}

// ── USWDS ──────────────────────────────────────────────────────────────────

test("USWDS definition includes a tokens array", () => {
  assert.ok(Array.isArray(uswds.tokens), "tokens should be an array");
  assert.ok(uswds.tokens.length > 0, "tokens array should not be empty");
});

test("USWDS token groups have expected ids", () => {
  const ids = uswds.tokens.map((t) => t.id);
  assert.ok(ids.includes("color-tokens"), "should include color-tokens");
  assert.ok(ids.includes("typography-tokens"), "should include typography-tokens");
  assert.ok(ids.includes("spacing-tokens"), "should include spacing-tokens");
  assert.ok(ids.includes("theme-tokens"), "should include theme-tokens");
});

test("USWDS color-tokens evaluates absent when no token markup", () => {
  const result = evaluateToken("color-tokens", "<p>No tokens here</p>", uswds);
  assert.equal(result.status, "absent");
});

test("USWDS color-tokens evaluates partial with token in style block", () => {
  const html = `<style>:root { --uswds-color-primary-vivid: #0050d8; }</style>`;
  const result = evaluateToken("color-tokens", html, uswds);
  assert.equal(result.status, "partial");
});

test("USWDS color-tokens evaluates full with token definition and var() usage", () => {
  const html = `<style>:root { --uswds-color-primary-vivid: #0050d8; } a { color: var(--uswds-color-primary-vivid); }</style>`;
  const result = evaluateToken("color-tokens", html, uswds);
  assert.equal(result.status, "full");
  assert.ok(result.coverage > 0.55);
});

test("USWDS typography-tokens evaluates partial with font token in style block", () => {
  const html = `<style>:root { --uswds-font-sans: "Source Sans Pro", sans-serif; }</style>`;
  const result = evaluateToken("typography-tokens", html, uswds);
  assert.equal(result.status, "partial");
});

test("USWDS spacing-tokens evaluates partial with spacing token in style block", () => {
  const html = `<style>:root { --uswds-spacing-4: 2rem; }</style>`;
  const result = evaluateToken("spacing-tokens", html, uswds);
  assert.equal(result.status, "partial");
});

test("USWDS theme-tokens evaluates partial with theme token in style block", () => {
  const html = `<style>:root { --uswds-theme-color-primary: #005ea2; }</style>`;
  const result = evaluateToken("theme-tokens", html, uswds);
  assert.equal(result.status, "partial");
});

test("USWDS evaluateHtml includes tokens array in result", () => {
  const page = evaluateHtml("https://example.test/", wrap("<p>Hello</p>"), uswds);
  assert.ok(Array.isArray(page.tokens), "page result should have tokens array");
  assert.equal(page.tokens.length, uswds.tokens.length);
});

// ── GCDS ───────────────────────────────────────────────────────────────────

test("GCDS definition includes a tokens array", () => {
  assert.ok(Array.isArray(gcds.tokens), "tokens should be an array");
  assert.ok(gcds.tokens.length > 0, "tokens array should not be empty");
});

test("GCDS token groups have expected ids", () => {
  const ids = gcds.tokens.map((t) => t.id);
  assert.ok(ids.includes("color-tokens"), "should include color-tokens");
  assert.ok(ids.includes("typography-tokens"), "should include typography-tokens");
  assert.ok(ids.includes("spacing-tokens"), "should include spacing-tokens");
});

test("GCDS color-tokens evaluates absent when no token markup", () => {
  const result = evaluateToken("color-tokens", "<p>No tokens here</p>", gcds);
  assert.equal(result.status, "absent");
});

test("GCDS color-tokens evaluates partial with token in style block", () => {
  const html = `<style>:root { --gcds-color-blue-50: #cfe8ff; }</style>`;
  const result = evaluateToken("color-tokens", html, gcds);
  assert.equal(result.status, "partial");
});

test("GCDS color-tokens evaluates full with definition and var() usage", () => {
  const html = `<style>:root { --gcds-color-primary: #0535d2; } a { color: var(--gcds-color-primary); }</style>`;
  const result = evaluateToken("color-tokens", html, gcds);
  assert.equal(result.status, "full");
});

test("GCDS typography-tokens evaluates partial with font token in style block", () => {
  const html = `<style>:root { --gcds-font-family-sans: "Noto Sans", sans-serif; }</style>`;
  const result = evaluateToken("typography-tokens", html, gcds);
  assert.equal(result.status, "partial");
});

test("GCDS spacing-tokens evaluates partial with spacing token in style block", () => {
  const html = `<style>:root { --gcds-spacing-100: 0.25rem; }</style>`;
  const result = evaluateToken("spacing-tokens", html, gcds);
  assert.equal(result.status, "partial");
});

// ── GOV.UK ─────────────────────────────────────────────────────────────────

test("GOV.UK definition includes a tokens array", () => {
  assert.ok(Array.isArray(govuk.tokens), "tokens should be an array");
  assert.ok(govuk.tokens.length > 0, "tokens array should not be empty");
});

test("GOV.UK token groups have expected ids", () => {
  const ids = govuk.tokens.map((t) => t.id);
  assert.ok(ids.includes("colour-tokens"), "should include colour-tokens");
  assert.ok(ids.includes("typography-tokens"), "should include typography-tokens");
  assert.ok(ids.includes("spacing-tokens"), "should include spacing-tokens");
});

test("GOV.UK colour-tokens evaluates absent when no token markup", () => {
  const result = evaluateToken("colour-tokens", "<p>No tokens here</p>", govuk);
  assert.equal(result.status, "absent");
});

test("GOV.UK colour-tokens evaluates partial with token in style block", () => {
  const html = `<style>:root { --govuk-colour-black: #0b0c0c; }</style>`;
  const result = evaluateToken("colour-tokens", html, govuk);
  assert.equal(result.status, "partial");
});

test("GOV.UK colour-tokens evaluates full with definition and var() usage", () => {
  const html = `<style>:root { --govuk-colour-black: #0b0c0c; } body { color: var(--govuk-colour-black); }</style>`;
  const result = evaluateToken("colour-tokens", html, govuk);
  assert.equal(result.status, "full");
});

// ── NLDS ───────────────────────────────────────────────────────────────────

test("NLDS definition includes a tokens array", () => {
  assert.ok(Array.isArray(nlds.tokens), "tokens should be an array");
  assert.ok(nlds.tokens.length > 0, "tokens array should not be empty");
});

test("NLDS token groups have expected ids", () => {
  const ids = nlds.tokens.map((t) => t.id);
  assert.ok(ids.includes("color-tokens"), "should include color-tokens");
  assert.ok(ids.includes("typography-tokens"), "should include typography-tokens");
  assert.ok(ids.includes("spacing-tokens"), "should include spacing-tokens");
});

test("NLDS color-tokens evaluates absent when no token markup", () => {
  const result = evaluateToken("color-tokens", "<p>No tokens here</p>", nlds);
  assert.equal(result.status, "absent");
});

test("NLDS color-tokens evaluates partial with token in style block", () => {
  const html = `<style>:root { --nl-color-brand-primary: #007bc7; }</style>`;
  const result = evaluateToken("color-tokens", html, nlds);
  assert.equal(result.status, "partial");
});

test("NLDS color-tokens evaluates full with definition and var() usage", () => {
  const html = `<style>:root { --nl-color-brand-primary: #007bc7; } a { color: var(--nl-color-brand-primary); }</style>`;
  const result = evaluateToken("color-tokens", html, nlds);
  assert.equal(result.status, "full");
});

// ── CMS ────────────────────────────────────────────────────────────────────

test("CMS definition includes a tokens array", () => {
  assert.ok(Array.isArray(cms.tokens), "tokens should be an array");
  assert.ok(cms.tokens.length > 0, "tokens array should not be empty");
});

test("CMS token groups have expected ids", () => {
  const ids = cms.tokens.map((t) => t.id);
  assert.ok(ids.includes("color-tokens"), "should include color-tokens");
  assert.ok(ids.includes("typography-tokens"), "should include typography-tokens");
  assert.ok(ids.includes("spacing-tokens"), "should include spacing-tokens");
});

test("CMS color-tokens evaluates absent when no token markup", () => {
  const result = evaluateToken("color-tokens", "<p>No tokens here</p>", cms);
  assert.equal(result.status, "absent");
});

test("CMS color-tokens evaluates partial with token in style block", () => {
  const html = `<style>:root { --cmsgov-color-primary: #0071bc; }</style>`;
  const result = evaluateToken("color-tokens", html, cms);
  assert.equal(result.status, "partial");
});

test("CMS color-tokens evaluates full with definition and var() usage", () => {
  const html = `<style>:root { --cmsgov-color-primary: #0071bc; } a { color: var(--cmsgov-color-primary); }</style>`;
  const result = evaluateToken("color-tokens", html, cms);
  assert.equal(result.status, "full");
});

// ── VA ─────────────────────────────────────────────────────────────────────

test("VA definition includes a tokens array", () => {
  assert.ok(Array.isArray(va.tokens), "tokens should be an array");
  assert.ok(va.tokens.length > 0, "tokens array should not be empty");
});

test("VA token groups have expected ids", () => {
  const ids = va.tokens.map((t) => t.id);
  assert.ok(ids.includes("color-tokens"), "should include color-tokens");
  assert.ok(ids.includes("typography-tokens"), "should include typography-tokens");
  assert.ok(ids.includes("spacing-tokens"), "should include spacing-tokens");
});

test("VA color-tokens evaluates absent when no token markup", () => {
  const result = evaluateToken("color-tokens", "<p>No tokens here</p>", va);
  assert.equal(result.status, "absent");
});

test("VA color-tokens evaluates partial with token in style block", () => {
  const html = `<style>:root { --vads-color-primary: #003e73; }</style>`;
  const result = evaluateToken("color-tokens", html, va);
  assert.equal(result.status, "partial");
});

test("VA color-tokens evaluates full with definition and var() usage", () => {
  const html = `<style>:root { --vads-color-primary: #003e73; } a { color: var(--vads-color-primary); }</style>`;
  const result = evaluateToken("color-tokens", html, va);
  assert.equal(result.status, "full");
});

test("VA spacing-tokens evaluates partial with spacing token in style block", () => {
  const html = `<style>:root { --vads-spacing-4: 1rem; }</style>`;
  const result = evaluateToken("spacing-tokens", html, va);
  assert.equal(result.status, "partial");
});

// ── KoliBri ────────────────────────────────────────────────────────────────

test("KoliBri definition includes a tokens array", () => {
  assert.ok(Array.isArray(kolibri.tokens), "tokens should be an array");
  assert.ok(kolibri.tokens.length > 0, "tokens array should not be empty");
});

test("KoliBri token groups have expected ids", () => {
  const ids = kolibri.tokens.map((t) => t.id);
  assert.ok(ids.includes("color-tokens"), "should include color-tokens");
  assert.ok(ids.includes("typography-tokens"), "should include typography-tokens");
  assert.ok(ids.includes("border-tokens"), "should include border-tokens");
});

test("KoliBri color-tokens evaluates absent when no token markup", () => {
  const result = evaluateToken("color-tokens", "<p>No tokens here</p>", kolibri);
  assert.equal(result.status, "absent");
});

test("KoliBri color-tokens evaluates partial with token in style block", () => {
  const html = `<style>:root { --kol-color-primary: #003b8e; }</style>`;
  const result = evaluateToken("color-tokens", html, kolibri);
  assert.equal(result.status, "partial");
});

test("KoliBri color-tokens evaluates full with definition and var() usage", () => {
  const html = `<style>:root { --kol-color-primary: #003b8e; } a { color: var(--kol-color-primary); }</style>`;
  const result = evaluateToken("color-tokens", html, kolibri);
  assert.equal(result.status, "full");
});

test("KoliBri border-tokens evaluates partial with border token in style block", () => {
  const html = `<style>:root { --kol-border-radius: 4px; }</style>`;
  const result = evaluateToken("border-tokens", html, kolibri);
  assert.equal(result.status, "partial");
});

// ── Cross-system isolation ──────────────────────────────────────────────────

test("GCDS token markup does not trigger USWDS token detection", () => {
  const html = `<style>:root { --gcds-color-primary: #0535d2; }</style>`;
  const result = evaluateToken("color-tokens", html, uswds);
  assert.equal(result.status, "absent");
});

test("USWDS token markup does not trigger VA token detection", () => {
  const html = `<style>:root { --uswds-color-primary: #005ea2; }</style>`;
  const result = evaluateToken("color-tokens", html, va);
  assert.equal(result.status, "absent");
});

import test from "node:test";
import assert from "node:assert/strict";

import { evaluateHtml } from "../src/scanner.js";
import { cms } from "../src/systems/cms.js";

function findComponent(page, id) {
  return page.components.find((component) => component.id === id);
}

test("CMS starter component rules detect a broader set of official web components", () => {
  const html = `
    <ds-autocomplete label="Search"></ds-autocomplete>
    <ds-card heading="Coverage"></ds-card>
    <ds-choice type="checkbox" checked></ds-choice>
    <ds-choice type="radio"></ds-choice>
    <ds-date-field label="Date of birth"></ds-date-field>
    <ds-help-drawer></ds-help-drawer>
    <ds-drawer></ds-drawer>
    <ds-dropdown label="State"><option>Maryland</option></ds-dropdown>
    <ds-filter-chip label="Coverage"></ds-filter-chip>
    <ds-healthcare-gov-header></ds-healthcare-gov-header>
    <ds-medicare-gov-footer></ds-medicare-gov-footer>
    <ds-inline-error id="name-error"></ds-inline-error>
    <ds-label></ds-label>
    <ds-month-picker label="Month"></ds-month-picker>
    <ds-note-box heading="Note"></ds-note-box>
    <ds-pagination current-page="2"></ds-pagination>
    <ds-review heading="Review"></ds-review>
    <ds-skip-nav href="#main"></ds-skip-nav>
    <ds-spinner size="small"></ds-spinner>
    <ds-table><thead><tr><th>Name</th></tr></thead></ds-table>
    <ds-tabs><ds-tab-panel></ds-tab-panel></ds-tabs>
    <ds-text-field label="Name"></ds-text-field>
    <ds-third-party-external-link href="https://example.com"></ds-third-party-external-link>
    <ds-vertical-nav><ds-vertical-nav-item></ds-vertical-nav-item></ds-vertical-nav>
  `;

  const page = evaluateHtml("https://design.cms.gov/", html, cms);

  assert.equal(findComponent(page, "autocomplete")?.status, "full");
  assert.equal(findComponent(page, "card")?.status, "full");
  assert.equal(findComponent(page, "checkbox")?.status, "full");
  assert.equal(findComponent(page, "radio-button")?.status, "full");
  assert.equal(findComponent(page, "single-input-date-field")?.status, "full");
  assert.equal(findComponent(page, "drawer-help-drawer")?.status, "full");
  assert.equal(findComponent(page, "filter-chip")?.status, "full");
  assert.equal(findComponent(page, "healthcare-header")?.status, "full");
  assert.equal(findComponent(page, "medicare-footer")?.status, "full");
  assert.equal(findComponent(page, "inline-error")?.status, "full");
  assert.equal(findComponent(page, "label-legend")?.status, "partial");
  assert.equal(findComponent(page, "month-picker")?.status, "full");
  assert.equal(findComponent(page, "note-box")?.status, "full");
  assert.equal(findComponent(page, "pagination")?.status, "full");
  assert.equal(findComponent(page, "review")?.status, "full");
  assert.equal(findComponent(page, "skip-nav")?.status, "full");
  assert.equal(findComponent(page, "spinner")?.status, "full");
  assert.equal(findComponent(page, "table")?.status, "full");
  assert.equal(findComponent(page, "tabs")?.status, "full");
  assert.equal(findComponent(page, "text-field")?.status, "full");
  assert.equal(findComponent(page, "third-party-external-link")?.status, "full");
  assert.equal(findComponent(page, "vertical-navigation")?.status, "full");
});

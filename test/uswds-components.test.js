import test from "node:test";
import assert from "node:assert/strict";

import { evaluateHtml } from "../src/scanner.js";
import { uswds } from "../src/systems/uswds.js";

const officialComponentIds = [
  "accordion",
  "alert",
  "banner",
  "breadcrumb",
  "button",
  "button-group",
  "card",
  "character-count",
  "checkbox",
  "collection",
  "combo-box",
  "data-visualizations",
  "date-picker",
  "date-range-picker",
  "file-input",
  "footer",
  "form",
  "grid",
  "header",
  "icon",
  "icon-list",
  "identifier",
  "in-page-navigation",
  "input-mask",
  "input-prefix-suffix",
  "language-selector",
  "link",
  "list",
  "memorable-date",
  "modal",
  "pagination",
  "process-list",
  "prose",
  "radio-buttons",
  "range-slider",
  "search",
  "select",
  "side-navigation",
  "site-alert",
  "step-indicator",
  "summary-box",
  "table",
  "tag",
  "text-input",
  "time-picker",
  "tooltip",
  "typography",
  "validation",
];

const fixtures = {
  accordion: {
    partial: `<div class="usa-accordion"></div>`,
    full: `<div class="usa-accordion"><h2 class="usa-accordion__heading"><button class="usa-accordion__button" aria-controls="faq-1" aria-expanded="false">Question</button></h2><div id="faq-1" class="usa-accordion__content">Answer</div></div>`,
  },
  alert: {
    partial: `<div class="usa-alert"></div>`,
    full: `<div class="usa-alert usa-alert--info"><div class="usa-alert__body">Info</div></div>`,
  },
  banner: {
    partial: `<section class="usa-banner"></section>`,
    full: `<section class="usa-banner"><header class="usa-banner__header"></header><div class="usa-banner__content"><button class="usa-banner__button">Toggle</button></div></section>`,
  },
  breadcrumb: {
    partial: `<nav class="usa-breadcrumb"></nav>`,
    full: `<nav class="usa-breadcrumb"><ol class="usa-breadcrumb__list"><li class="usa-breadcrumb__list-item"><a class="usa-breadcrumb__link" href="/">Home</a></li></ol></nav>`,
  },
  button: {
    partial: `<button class="usa-button">Submit</button>`,
    full: `<button class="usa-button usa-button--secondary" type="button">Submit</button>`,
  },
  "button-group": {
    partial: `<ul class="usa-button-group"></ul>`,
    full: `<ul class="usa-button-group usa-button-group--segmented"><li class="usa-button-group__item"><button class="usa-button">One</button></li></ul>`,
  },
  card: {
    partial: `<li class="usa-card"></li>`,
    full: `<li class="usa-card"><div class="usa-card__container"><header class="usa-card__header"></header><div class="usa-card__body"></div></div></li>`,
  },
  "character-count": {
    partial: `<div class="usa-character-count"></div>`,
    full: `<div class="usa-character-count"><textarea class="usa-character-count__field"></textarea><span class="usa-character-count__message">200 characters allowed</span></div>`,
  },
  checkbox: {
    partial: `<div class="usa-checkbox"></div>`,
    full: `<div class="usa-checkbox"><input class="usa-checkbox__input" type="checkbox" id="a"><label class="usa-checkbox__label" for="a">Agree</label></div>`,
  },
  collection: {
    partial: `<ul class="usa-collection"></ul>`,
    full: `<ul class="usa-collection"><li class="usa-collection__item"><div class="usa-collection__body"><h3 class="usa-collection__heading">Item</h3></div></li></ul>`,
  },
  "combo-box": {
    partial: `<div class="usa-combo-box"></div>`,
    full: `<div class="usa-combo-box"><input role="combobox" aria-autocomplete="list"></div>`,
  },
  "data-visualizations": {
    partial: `<section id="section-linechart"></section>`,
    full: `<section id="section-linechart" class="usa-prose">highcharts output</section>`,
  },
  "date-picker": {
    partial: `<div class="usa-date-picker"></div>`,
    full: `<div class="usa-date-picker"><input type="text" aria-label="calendar date"></div>`,
  },
  "date-range-picker": {
    partial: `<div class="usa-date-range-picker"></div>`,
    full: `<div class="usa-date-range-picker"><div class="usa-date-picker"><input type="text"><input type="text"></div></div>`,
  },
  "file-input": {
    partial: `<div class="usa-file-input"></div>`,
    full: `<div class="usa-file-input"><input type="file"><span class="usa-error-message">Upload failed</span></div>`,
  },
  footer: {
    partial: `<footer class="usa-footer"></footer>`,
    full: `<footer class="usa-footer usa-footer--big"><div class="usa-footer__primary-section"></div><div class="usa-footer__secondary-section"></div></footer>`,
  },
  form: {
    partial: `<form class="usa-form"></form>`,
    full: `<form class="usa-form"><fieldset class="usa-fieldset"></fieldset><span class="usa-hint--required">Required</span></form>`,
  },
  grid: {
    partial: `<div class="grid-row"></div>`,
    full: `<div class="grid-container"><div class="grid-row"><div class="tablet:grid-col">A</div></div></div>`,
  },
  header: {
    partial: `<header class="usa-header"></header>`,
    full: `<header class="usa-header usa-header--extended"><div class="usa-navbar"></div><nav class="usa-nav"></nav></header>`,
  },
  icon: {
    partial: `<svg class="usa-icon"></svg>`,
    full: `<svg class="usa-icon usa-icon--size-3"></svg>`,
  },
  "icon-list": {
    partial: `<ul class="usa-icon-list"></ul>`,
    full: `<ul class="usa-icon-list"><li class="usa-icon-list__item"><div class="usa-icon-list__icon"></div><div class="usa-icon-list__content"></div></li></ul>`,
  },
  identifier: {
    partial: `<div class="usa-identifier"></div>`,
    full: `<div class="usa-identifier"><section class="usa-identifier__section--masthead"></section><ul class="usa-identifier__required-links-list"></ul></div>`,
  },
  "in-page-navigation": {
    partial: `<nav class="usa-in-page-navigation"></nav>`,
    full: `<div class="usa-in-page-nav-container"><nav class="usa-in-page-nav usa-in-page-navigation"></nav></div>`,
  },
  "input-mask": {
    partial: `<input class="usa-input-mask">`,
    full: `<form class="usa-form"><input class="usa-input-mask" pattern="[0-9]{5}"></form>`,
  },
  "input-prefix-suffix": {
    partial: `<div class="usa-input-prefix-suffix"></div>`,
    full: `<div class="usa-input-prefix-suffix usa-input-group"><span class="usa-input-prefix">$</span><input class="usa-input"><span class="usa-input-suffix">USD</span></div>`,
  },
  "language-selector": {
    partial: `<div class="usa-language-selector"></div>`,
    full: `<div class="usa-language-selector"><a class="usa-link" hreflang="es" lang="es" href="/es">Espanol</a></div>`,
  },
  link: {
    partial: `<a class="usa-link" href="/x">Read more</a>`,
    full: `<a class="usa-link usa-link--external" href="https://example.com" target="_blank" rel="noreferrer">External</a>`,
  },
  list: {
    partial: `<ul class="usa-list"><li>One</li></ul>`,
    full: `<ul class="usa-list usa-list--unstyled" role="list"><li>One</li></ul>`,
  },
  "memorable-date": {
    partial: `<div class="usa-memorable-date"></div>`,
    full: `<div class="usa-memorable-date"><div class="usa-form-group--month"></div><div class="usa-form-group--day"></div><select class="usa-select"></select></div>`,
  },
  modal: {
    partial: `<div class="usa-modal"></div>`,
    full: `<div class="usa-modal"><div class="usa-modal__content"><h2 class="usa-modal__heading">Title</h2></div><button data-open-modal="x">Open</button></div>`,
  },
  pagination: {
    partial: `<nav class="usa-pagination"></nav>`,
    full: `<nav class="usa-pagination"><ul class="usa-pagination__list"><li class="usa-pagination__item"><a class="usa-pagination__link" href="#">1</a></li></ul></nav>`,
  },
  "process-list": {
    partial: `<ol class="usa-process-list"></ol>`,
    full: `<ol class="usa-process-list"><li class="usa-process-list__item">Step</li></ol>`,
  },
  prose: {
    partial: `<div class="usa-prose"></div>`,
    full: `<div class="usa-prose measure-6"><p>Readable text</p></div>`,
  },
  "radio-buttons": {
    partial: `<div class="usa-radio"></div>`,
    full: `<div class="usa-radio"><input class="usa-radio__input" type="radio" id="r1"><label class="usa-radio__label" for="r1">Choice</label></div>`,
  },
  "range-slider": {
    partial: `<input class="usa-range">`,
    full: `<input class="usa-range" type="range">`,
  },
  search: {
    partial: `<form class="usa-search"></form>`,
    full: `<form class="usa-search usa-search--small"><button class="usa-search__submit-icon"></button><span class="usa-search__submit-text">Search</span></form>`,
  },
  select: {
    partial: `<select class="usa-select"></select>`,
    full: `<div><select class="usa-select"><option>One</option></select></div>`,
  },
  "side-navigation": {
    partial: `<nav class="usa-sidenav"></nav>`,
    full: `<nav class="usa-sidenav"><li class="usa-sidenav__item"></li><ul class="usa-sidenav__sublist"></ul></nav>`,
  },
  "site-alert": {
    partial: `<section class="usa-site-alert"></section>`,
    full: `<section class="usa-site-alert usa-site-alert--info"><div class="usa-prose">Alert text</div></section>`,
  },
  "step-indicator": {
    partial: `<div class="usa-step-indicator"></div>`,
    full: `<div class="usa-step-indicator"><div class="usa-step-indicator__heading"></div><ol class="usa-step-indicator__segments"><li class="usa-step-indicator__segment"></li></ol></div>`,
  },
  "summary-box": {
    partial: `<div class="usa-summary-box"></div>`,
    full: `<div class="usa-summary-box"><div class="usa-summary-box__body"><h3 class="usa-summary-box__heading">Summary</h3></div></div>`,
  },
  table: {
    partial: `<table class="usa-table"></table>`,
    full: `<div class="usa-table-container--scrollable"><table class="usa-table usa-table--striped"></table></div>`,
  },
  tag: {
    partial: `<strong class="usa-tag">New</strong>`,
    full: `<strong class="usa-tag usa-tag--big" aria-label="Status">New</strong>`,
  },
  "text-input": {
    partial: `<input class="usa-input">`,
    full: `<div><input class="usa-input usa-input--error"><textarea class="usa-textarea"></textarea></div>`,
  },
  "time-picker": {
    partial: `<div class="usa-time-picker"></div>`,
    full: `<div class="usa-time-picker"><input type="time"></div>`,
  },
  tooltip: {
    partial: `<button class="usa-tooltip">Help</button>`,
    full: `<button class="usa-tooltip" aria-describedby="tip-1">Help</button><div id="tip-1" role="tooltip"></div>`,
  },
  typography: {
    partial: `<h2 class="usa-heading-alt">Heading</h2>`,
    full: `<div class="usa-prose measure-6"><h2 class="usa-heading-alt">Heading</h2></div>`,
  },
  validation: {
    partial: `<div class="usa-validation"></div>`,
    full: `<div class="usa-validation"><div class="usa-alert--validation"></div><ul class="usa-checklist"><li class="usa-checklist__item">Valid</li></ul></div>`,
  },
};

function wrap(html) {
  return `<!doctype html><html><body>${html}</body></html>`;
}

function evaluateComponent(id, html) {
  const page = evaluateHtml("https://example.test/", wrap(html), uswds);
  return page.components.find((component) => component.id === id);
}

test("USWDS definition covers the full official component inventory", () => {
  const definedIds = new Set(uswds.components.map((component) => component.id));

  officialComponentIds.forEach((id) => {
    assert.ok(definedIds.has(id), `Missing official component definition for ${id}`);
  });
});

test("Every official USWDS component has partial and full fixtures", () => {
  officialComponentIds.forEach((id) => {
    assert.ok(fixtures[id], `Missing fixtures for ${id}`);
    assert.ok(fixtures[id].partial, `Missing partial fixture for ${id}`);
    assert.ok(fixtures[id].full, `Missing full fixture for ${id}`);
  });
});

for (const id of officialComponentIds) {
  test(`${id} evaluates as absent, partial, and full`, () => {
    const absent = evaluateComponent(id, `<main>No relevant component markup</main>`);
    const partial = evaluateComponent(id, fixtures[id].partial);
    const full = evaluateComponent(id, fixtures[id].full);

    assert.equal(absent.status, "absent");
    assert.equal(partial.status, "partial");
    assert.equal(full.status, "full");
    assert.ok(full.coverage > partial.coverage);
  });
}

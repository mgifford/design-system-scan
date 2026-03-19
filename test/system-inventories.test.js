import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const inventoryFiles = [
  "data/design-systems/uswds.json",
  "data/design-systems/va.json",
  "data/design-systems/cms.json",
  "data/design-systems/govuk.json",
  "data/design-systems/nlds.json",
  "data/design-systems/gcds.json",
];

test("design system inventory JSON files are present and populated", () => {
  for (const pathname of inventoryFiles) {
    const inventory = JSON.parse(fs.readFileSync(pathname, "utf8"));
    const componentCount =
      inventory.officialComponents?.length ?? inventory.currentComponents?.length ?? 0;

    assert.ok(inventory.id, `${pathname} should define an id`);
    assert.ok(inventory.name, `${pathname} should define a name`);
    assert.ok(componentCount > 0, `${pathname} should list components`);
  }
});

test("GOV.UK inventory indexes the full official component set currently tracked", () => {
  const inventory = JSON.parse(fs.readFileSync("data/design-systems/govuk.json", "utf8"));

  assert.equal(inventory.officialComponents.length, 34);
  assert.ok(
    inventory.officialComponents.some((component) => component.id === "service-navigation")
  );
  assert.ok(inventory.officialComponents.some((component) => component.id === "warning-text"));
});

test("NL Design System inventory indexes the full official component set currently tracked", () => {
  const inventory = JSON.parse(fs.readFileSync("data/design-systems/nlds.json", "utf8"));

  assert.equal(inventory.officialComponents.length, 94);
  assert.ok(
    inventory.officialComponents.some((component) => component.id === "breadcrumb-navigation")
  );
  assert.ok(inventory.officialComponents.some((component) => component.id === "youtube-video"));
});

test("GC Design System inventory indexes the full official component set currently tracked", () => {
  const inventory = JSON.parse(fs.readFileSync("data/design-systems/gcds.json", "utf8"));

  assert.equal(inventory.officialComponents.length, 33);
  assert.ok(inventory.officialComponents.some((component) => component.id === "breadcrumbs"));
  assert.ok(inventory.officialComponents.some((component) => component.id === "theme-and-topic-menu"));
});

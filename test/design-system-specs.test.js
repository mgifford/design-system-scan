import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const specFiles = [
  "data/design-system-specs/uswds.yaml",
  "data/design-system-specs/va.yaml",
  "data/design-system-specs/cms.yaml",
  "data/design-system-specs/govuk.yaml",
  "data/design-system-specs/nlds.yaml",
  "data/design-system-specs/gcds.yaml",
  "data/design-system-specs/kolibri.yaml",
];

test("design system semantic YAML specs are present and contain core sections", () => {
  for (const pathname of specFiles) {
    const content = fs.readFileSync(pathname, "utf8");

    assert.match(content, /^system:/m, `${pathname} should declare system metadata`);
    assert.match(content, /^components:/m, `${pathname} should define components`);
    assert.match(content, /^  demo_focus:/m, `${pathname} should define demo focus`);
    assert.match(content, /^  id:/m, `${pathname} should define a system id`);
    assert.match(content, /^  name:/m, `${pathname} should define a system name`);
    assert.match(content, /^  - id:/m, `${pathname} should include component ids`);
    assert.match(content, /^    purpose:/m, `${pathname} should include component purpose`);
    assert.match(content, /^    canonical_patterns:/m, `${pathname} should include canonical patterns`);
  }
});

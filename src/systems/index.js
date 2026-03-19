import { cms } from "./cms.js";
import { govuk } from "./govuk.js";
import { nlds } from "./nlds.js";
import { uswds } from "./uswds.js";
import { va } from "./va.js";

const DETECTABLE_SYSTEMS = [uswds, va, cms, govuk, nlds];
const AUTO_SYSTEM = {
  id: "auto",
  name: "Auto-detect design system",
  version: "compare-all",
  autoDetect: true,
};

export function listSystemDefinitions() {
  return [AUTO_SYSTEM, ...DETECTABLE_SYSTEMS].map((system) => ({
    id: system.id,
    name: system.name,
    version: system.version,
  }));
}

export function getSystemDefinition(id) {
  if (id === AUTO_SYSTEM.id) {
    return AUTO_SYSTEM;
  }

  return DETECTABLE_SYSTEMS.find((system) => system.id === id) ?? null;
}

export function listDetectableSystemDefinitions() {
  return [...DETECTABLE_SYSTEMS];
}

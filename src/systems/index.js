import { uswds } from "./uswds.js";

const SYSTEMS = [uswds];

export function listSystemDefinitions() {
  return SYSTEMS.map((system) => ({
    id: system.id,
    name: system.name,
    version: system.version,
  }));
}

export function getSystemDefinition(id) {
  return SYSTEMS.find((system) => system.id === id) ?? null;
}

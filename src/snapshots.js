import fs from "node:fs/promises";
import path from "node:path";

function toMap(components) {
  return new Map(components.map((component) => [component.id, component]));
}

export async function saveSnapshot(pathname, report) {
  await fs.mkdir(path.dirname(pathname), { recursive: true });
  await fs.writeFile(pathname, JSON.stringify(report, null, 2), "utf8");
}

export async function loadSnapshot(pathname) {
  const content = await fs.readFile(pathname, "utf8");
  return JSON.parse(content);
}

export function diffSnapshots(previous, current, previousPath, currentPath) {
  const previousUrls = new Set(previous.pages.map((page) => page.url));
  const currentUrls = new Set(current.pages.map((page) => page.url));
  const previousComponents = toMap(previous.siteSummary?.components ?? []);
  const currentComponents = toMap(current.siteSummary?.components ?? []);
  const componentIds = new Set([...previousComponents.keys(), ...currentComponents.keys()]);
  const componentChanges = [];

  for (const id of componentIds) {
    const previousComponent = previousComponents.get(id) ?? {
      id,
      name: currentComponents.get(id)?.name ?? id,
      full: 0,
      partial: 0,
    };
    const currentComponent = currentComponents.get(id) ?? {
      id,
      name: previousComponent.name,
      full: 0,
      partial: 0,
    };

    if (
      previousComponent.full !== currentComponent.full ||
      previousComponent.partial !== currentComponent.partial
    ) {
      componentChanges.push({
        id,
        name: currentComponent.name,
        previous: {
          full: previousComponent.full,
          partial: previousComponent.partial,
        },
        current: {
          full: currentComponent.full,
          partial: currentComponent.partial,
        },
      });
    }
  }

  return {
    system: current.system,
    previous: {
      path: previousPath,
      scannedAt: previous.pages[0]?.scannedAt ?? null,
    },
    current: {
      path: currentPath,
      scannedAt: current.pages[0]?.scannedAt ?? null,
    },
    summary: {
      pageDelta: (current.siteSummary?.pageCount ?? 0) - (previous.siteSummary?.pageCount ?? 0),
      fingerprintPageDelta:
        (current.siteSummary?.fingerprintedPageCount ?? 0) -
        (previous.siteSummary?.fingerprintedPageCount ?? 0),
      addedUrls: [...currentUrls].filter((url) => !previousUrls.has(url)),
      removedUrls: [...previousUrls].filter((url) => !currentUrls.has(url)),
      componentChanges: componentChanges.sort((left, right) =>
        left.name.localeCompare(right.name)
      ),
    },
  };
}

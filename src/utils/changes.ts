import fs from "node:fs";
import path from "node:path";
import { createTwoFilesPatch } from "diff";

import { readLock } from "../registry/lock";
import { resolveTargetPath } from "../registry/paths";
import { resolveRegistryTree } from "../registry/resolve";
import { Component, UIConfig } from "../types";
import { componentTargets, findCatalogComponent } from "./componentFiles";

type FileStatus = "modified" | "missing" | "unchanged";

type FileChange = { path: string; status: FileStatus; patch: string | null };

export type ItemChanges = { name: string; kind: "component" | "registry"; files: FileChange[] };

const normalize = (text: string) => text.replace(/\r\n/g, "\n").trimEnd();

const compare = (cwd: string, relPath: string, upstream: string): FileChange => {
  const abs = path.join(cwd, relPath);
  if (!fs.existsSync(abs)) return { path: relPath, status: "missing", patch: null };
  const local = fs.readFileSync(abs, "utf-8");
  if (normalize(local) === normalize(upstream)) {
    return { path: relPath, status: "unchanged", patch: null };
  }
  const patch = createTwoFilesPatch(
    `a/${relPath}`,
    `b/${relPath}`,
    `${normalize(local)}\n`,
    `${normalize(upstream)}\n`,
    "local",
    "upstream"
  );
  return { path: relPath, status: "modified", patch };
};

/** A catalog component counts as installed when its first file exists. */
const isInstalled = (cwd: string, component: Component, uiConfig: UIConfig) => {
  const first = componentTargets(component, uiConfig).find((f) => f.kind === "component");
  return Boolean(first && fs.existsSync(path.join(cwd, first.path)));
};

/**
 * Compares installed components and registry items with their upstream versions.
 * With no names, checks everything installed (catalog components and `ui-thing.lock.json`).
 */
export const computeChanges = async (
  names: string[],
  uiConfig: UIConfig,
  catalog: Component[],
  cwd = process.cwd()
): Promise<{ items: ItemChanges[]; missing: string[] }> => {
  const lock = readLock(cwd);
  const items: ItemChanges[] = [];
  const missing: string[] = [];

  const componentNames: Component[] = [];
  const registryNames: string[] = [];

  if (names.length === 0) {
    componentNames.push(...catalog.filter((c) => isInstalled(cwd, c, uiConfig)));
    registryNames.push(...Object.keys(lock.items));
  } else {
    for (const name of names) {
      if (lock.items[name]) registryNames.push(name);
      else {
        const component = findCatalogComponent(catalog, name);
        if (component) componentNames.push(component);
        else missing.push(name);
      }
    }
  }

  for (const component of componentNames) {
    items.push({
      name: component.value,
      kind: "component",
      files: componentTargets(component, uiConfig).map((f) => compare(cwd, f.path, f.content)),
    });
  }

  for (const name of registryNames) {
    const { items: tree } = await resolveRegistryTree(
      [lock.items[name].source],
      uiConfig.registries
    );
    const { item } = tree[tree.length - 1];
    const files: FileChange[] = [];
    for (const file of item.files ?? []) {
      if (file.content === undefined) continue;
      try {
        files.push(compare(cwd, resolveTargetPath(file, uiConfig), file.content));
      } catch {
        // files that cannot be mapped are not installed by `add` either
      }
    }
    items.push({ name, kind: "registry", files });
  }

  return { items, missing };
};

/** Totals for summaries. */
export const summarize = (items: ItemChanges[]) => {
  const files = items.flatMap((i) => i.files);
  return {
    modified: files.filter((f) => f.status === "modified").length,
    missing: files.filter((f) => f.status === "missing").length,
    unchanged: files.filter((f) => f.status === "unchanged").length,
    itemsWithChanges: items.filter((i) => i.files.some((f) => f.status !== "unchanged")).length,
  };
};

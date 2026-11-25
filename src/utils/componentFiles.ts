import path from "node:path";

import { Component, UIConfig } from "../types";

export type PlannedFile = {
  /** Path relative to the project root, where `ui-thing add` writes the file. */
  path: string;
  kind: "component" | "util" | "composable" | "plugin";
  content: string;
};

/**
 * Every file `ui-thing add` writes for a catalog component, with its target path.
 * Shared by `view`, `diff`, `update --dry-run` and `add --dry-run`.
 */
export const componentTargets = (component: Component, uiConfig: UIConfig): PlannedFile[] => {
  const groups: Array<[PlannedFile["kind"], Component["files"] | undefined, string]> = [
    ["component", component.files, uiConfig.componentsLocation],
    ["util", component.utils, uiConfig.utilsLocation],
    ["composable", component.composables, uiConfig.composablesLocation],
    ["plugin", component.plugins, uiConfig.pluginsLocation ?? ""],
  ];
  return groups.flatMap(([kind, files, dir]) =>
    (files ?? []).map((f) => ({
      kind,
      path: path.posix.join(dir.replace(/\\/g, "/"), f.fileName),
      content: f.fileContent,
    }))
  );
};

/** Case-insensitive lookup by registry value (`button`, `vee-input`). */
export const findCatalogComponent = (components: Component[], name: string) =>
  components.find((c) => c.value.toLowerCase() === name.toLowerCase());

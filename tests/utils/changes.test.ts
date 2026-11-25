import { afterEach, describe, expect, it } from "vitest";

import { Component } from "../../src/types";
import { computeChanges, summarize } from "../../src/utils/changes";
import { DEFAULT_CONFIG_NUXT4 } from "../../src/utils/constants";
import { makeProject } from "../helpers/tmp";

const component = (
  value: string,
  files: Record<string, string>,
  utils: Record<string, string> = {}
): Component => ({
  name: value,
  value,
  files: Object.entries(files).map(([fileName, fileContent]) => ({
    fileName,
    fileContent,
    dirPath: "",
  })),
  utils: Object.entries(utils).map(([fileName, fileContent]) => ({
    fileName,
    fileContent,
    dirPath: "",
  })),
  composables: [],
  plugins: [],
});

describe("utils/changes", () => {
  let cleanup = () => {};
  afterEach(() => cleanup());

  it("classifies files as modified, unchanged or missing and builds a patch", async () => {
    const project = makeProject({
      "app/components/Ui/Button.vue": "<template>local</template>\n",
      "app/components/Ui/Card/Card.vue": "<template>same</template>\r\n",
    });
    cleanup = project.cleanup;
    const catalog = [
      component("button", { "Button.vue": "<template>upstream</template>" }, { "button.ts": "x" }),
      component("card", { "Card/Card.vue": "<template>same</template>" }),
      component("dialog", { "Dialog.vue": "" }),
    ];

    const { items, missing } = await computeChanges([], DEFAULT_CONFIG_NUXT4, catalog, project.dir);

    expect(missing).toEqual([]);
    // dialog is not installed, so it is not compared when no names are given
    expect(items.map((i) => i.name)).toEqual(["button", "card"]);
    const button = items[0].files;
    expect(button.map((f) => [f.path, f.status])).toEqual([
      ["app/components/Ui/Button.vue", "modified"],
      ["app/utils/button.ts", "missing"],
    ]);
    expect(button[0].patch).toContain("-<template>local</template>");
    expect(button[0].patch).toContain("+<template>upstream</template>");
    expect(items[1].files[0].status).toBe("unchanged"); // CRLF and trailing newline ignored
    expect(summarize(items)).toEqual({
      modified: 1,
      missing: 1,
      unchanged: 1,
      itemsWithChanges: 1,
    });
  });

  it("reports unknown names", async () => {
    const project = makeProject();
    cleanup = project.cleanup;
    const { missing } = await computeChanges(["nope"], DEFAULT_CONFIG_NUXT4, [], project.dir);
    expect(missing).toEqual(["nope"]);
  });
});

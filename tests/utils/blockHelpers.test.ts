import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { BlockComponent } from "../../src/types";
import {
  blockId,
  extractPackageImports,
  findBlocks,
  missingPackages,
  normalizeBlockName,
} from "../../src/utils/blockHelpers";

const block = (name: string, fileName: string): BlockComponent => ({
  name,
  fileName,
  file: "",
  category: "Hero",
  path: `Hero/${fileName}`,
});

describe("utils/blockHelpers", () => {
  it("normalizes every way of naming a block to the same key", () => {
    const expected = normalizeBlockName("BlockHero1");
    for (const name of ["BlockHero1.vue", "Hero 1", "hero-1", "HERO1", "blockhero1"]) {
      expect(normalizeBlockName(name)).toBe(expected);
    }
    expect(normalizeBlockName("BlockChartBar.client.vue")).toBe(normalizeBlockName("Chart Bar"));
    expect(normalizeBlockName("Hero 1")).not.toBe(normalizeBlockName("Hero 11"));
  });

  it("finds blocks by id or display name and reports missing ones", () => {
    const blocks = [
      block("Hero 1", "BlockHero1.vue"),
      block("Chart Bar", "BlockChartBar.client.vue"),
    ];
    const { found, missing } = findBlocks(["BlockHero1", "chart bar", "hero-1", "Nope 9"], blocks);
    expect(found.map(blockId)).toEqual(["BlockHero1", "BlockChartBar.client"]);
    expect(missing).toEqual(["Nope 9"]);
  });

  it("extracts npm package roots and ignores aliases, relative paths and Nuxt-provided packages", () => {
    const source = `
      import { Motion } from "motion-v";
      import { object } from 'yup';
      import { BubbleMenu } from "@tiptap/vue-3/menus";
      import { Navigation } from "swiper/modules";
      import "swiper/css";
      import type { Ref } from "vue";
      import { foo } from "./foo";
      import { bar } from "~/utils/bar";
      import { baz } from "@/lib/baz";
      import { x } from "#imports";
      import fs from "node:fs";
      const lazy = () => import("gsap");
    `;
    expect(extractPackageImports(source)).toEqual([
      "@tiptap/vue-3",
      "gsap",
      "motion-v",
      "swiper",
      "yup",
    ]);
  });

  it("ignores look-alikes inside template strings and invalid names", () => {
    // Real case from the border-beam component: a template literal containing `from: colorFrom`.
    const source = [
      "import { Motion } from 'motion-v';",
      "const style = `",
      "  from: colorFrom,",
      "  to: 'x'`;",
      "const label = \"Copied from 'clipboard'\";",
    ].join("\n");
    expect(extractPackageImports(source)).toEqual(["motion-v"]);
  });

  it("reports only packages missing from package.json and node_modules", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ui-thing-blocks-"));
    fs.writeFileSync(
      path.join(dir, "package.json"),
      JSON.stringify({ dependencies: { "motion-v": "1" }, devDependencies: { yup: "1" } })
    );
    expect(missingPackages(["motion-v", "yup", "gsap"], dir)).toEqual(["gsap"]);
    fs.rmSync(dir, { recursive: true, force: true });
  });
});

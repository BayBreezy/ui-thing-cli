import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { resolveViews } from "../../src/commands/view";
import { clearRegistryCache } from "../../src/registry/fetch";
import { BlockComponent, Component } from "../../src/types";
import { DEFAULT_CONFIG_NUXT4 } from "../../src/utils/constants";

vi.mock("../../src/utils/fetchComponents");
vi.mock("../../src/utils/fetchBlocks");

const button: Component = {
  name: "Button",
  value: "button",
  deps: ["reka-ui"],
  docsPath: "/components/button",
  files: [{ fileName: "Button.vue", dirPath: "", fileContent: "<button />" }],
  utils: [{ fileName: "button.ts", dirPath: "", fileContent: "export {}" }],
  composables: [],
  plugins: [],
};

const hero: BlockComponent = {
  name: "Hero 1",
  fileName: "BlockHero1.vue",
  file: '<script setup>\nimport gsap from "gsap";\n</script>',
  category: "Hero",
  path: "Hero/BlockHero1.vue",
  components: ["button"],
};

describe("commands/view", () => {
  let mock: MockAdapter;
  beforeEach(async () => {
    vi.clearAllMocks();
    clearRegistryCache();
    mock = new MockAdapter(axios);
    const { fetchComponents } = await import("../../src/utils/fetchComponents");
    const { fetchBlocks } = await import("../../src/utils/fetchBlocks");
    vi.mocked(fetchComponents).mockResolvedValue([button]);
    vi.mocked(fetchBlocks).mockResolvedValue([hero]);
  });
  afterEach(() => mock.restore());

  it("shows a component with its target paths and docs", async () => {
    const { results } = await resolveViews(["Button"], DEFAULT_CONFIG_NUXT4);
    expect(results[0]).toMatchObject({
      kind: "component",
      ref: "button",
      docs: "https://uithing.com/components/button",
      dependencies: ["reka-ui"],
      files: [
        { path: "app/components/Ui/Button.vue", content: "<button />" },
        { path: "app/utils/button.ts", content: "export {}" },
      ],
    });
  });

  it("shows a block with the packages it imports, only fetching blocks when needed", async () => {
    const { fetchBlocks } = await import("../../src/utils/fetchBlocks");
    const { results } = await resolveViews(["hero-1"], DEFAULT_CONFIG_NUXT4);
    expect(fetchBlocks).toHaveBeenCalledTimes(1);
    expect(results[0]).toMatchObject({
      kind: "block",
      ref: "BlockHero1",
      dependencies: ["gsap"],
      components: ["button"],
      files: [{ path: "app/components/Blocks/Hero/BlockHero1.vue" }],
    });
  });

  it("shows a registry item with mapped paths, and reports unknown names", async () => {
    mock.onGet("https://vue-bits.dev/r/HoloMosaic.json").reply(200, {
      name: "HoloMosaic",
      type: "registry:component",
      dependencies: ["gsap"],
      files: [{ path: "HoloMosaic/HoloMosaic.vue", type: "registry:component", content: "<div/>" }],
    });
    const { results, missing } = await resolveViews(
      ["@vue-bits/HoloMosaic", "nope"],
      DEFAULT_CONFIG_NUXT4
    );
    expect(results[0]).toMatchObject({
      kind: "registry",
      name: "HoloMosaic",
      dependencies: ["gsap"],
      files: [{ path: "app/components/Ui/HoloMosaic/HoloMosaic.vue", content: "<div/>" }],
    });
    expect(missing).toEqual(["nope"]);
  });
});

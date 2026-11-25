import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { runBlockCommand } from "../../src/commands/block";
import { BlockComponent } from "../../src/types";
import { DEFAULT_CONFIG_NUXT4 } from "../../src/utils/constants";

vi.mock("../../src/commands/add", () => ({ runAddCommand: vi.fn() }));
vi.mock("../../src/utils/config");
vi.mock("../../src/utils/compareUIConfig");
vi.mock("../../src/utils/fetchBlocks");
vi.mock("../../src/utils/fetchBlockCategories");
vi.mock("../../src/utils/installPackages");
vi.mock("../../src/utils/safeWriteFile");
vi.mock("../../src/utils/blockHelpers", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../src/utils/blockHelpers")>()),
  missingPackages: vi.fn((pkgs: string[]) => pkgs.filter((p) => p !== "motion-v")),
}));
vi.mock("../../src/utils/logger");
vi.mock("../../src/utils/printFancyBoxMessage");
vi.mock("prompts");

const BLOCKS: BlockComponent[] = [
  {
    name: "Hero 1",
    fileName: "BlockHero1.vue",
    file: [
      "<template><UiButton /></template>",
      '<script lang="ts" setup>',
      '  import { Motion } from "motion-v";',
      '  import gsap from "gsap";',
      "</script>",
    ].join("\n"),
    category: "Hero",
    description: "Split hero. Features: badge",
    path: "Hero/BlockHero1.vue",
    components: ["button", "container"],
  },
  {
    name: "Pricing 2",
    fileName: "BlockPricing2.vue",
    file: "<template><UiCard /></template>",
    category: "Pricing",
    path: "Pricing/BlockPricing2.vue",
    components: ["card", "button"],
  },
];

describe("commands/block", () => {
  let exit: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    exit = vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
      throw new Error(`exit ${code}`);
    }) as never);
    const { getUIConfig } = await import("../../src/utils/config");
    const { compareUIConfig } = await import("../../src/utils/compareUIConfig");
    const { fetchBlocks } = await import("../../src/utils/fetchBlocks");
    const { safeWriteFile } = await import("../../src/utils/safeWriteFile");
    vi.mocked(getUIConfig).mockResolvedValue({ ...DEFAULT_CONFIG_NUXT4, packageManager: "bun" });
    vi.mocked(compareUIConfig).mockResolvedValue(true);
    vi.mocked(fetchBlocks).mockResolvedValue(BLOCKS);
    vi.mocked(safeWriteFile).mockResolvedValue(true);
  });

  afterEach(() => exit.mockRestore());

  it("adds named blocks with --yes without any prompt", async () => {
    const prompts = (await import("prompts")).default;
    const { safeWriteFile } = await import("../../src/utils/safeWriteFile");
    const { runAddCommand } = await import("../../src/commands/add");
    const { installPackages } = await import("../../src/utils/installPackages");

    await runBlockCommand(["BlockHero1", "pricing-2"], { yes: true });

    expect(prompts).not.toHaveBeenCalled();
    expect(vi.mocked(safeWriteFile).mock.calls.map((c) => [c[0], c[4]])).toEqual([
      [expect.stringContaining("app/components/Blocks/Hero/BlockHero1.vue"), false],
      [expect.stringContaining("app/components/Blocks/Pricing/BlockPricing2.vue"), false],
    ]);
    expect(runAddCommand).toHaveBeenCalledWith(["button", "container", "card"], { yes: true });
    expect(installPackages).toHaveBeenCalledWith("bun", ["gsap"]);
  });

  it("writes to --dir when given", async () => {
    const { safeWriteFile } = await import("../../src/utils/safeWriteFile");
    await runBlockCommand(["Hero 1"], { yes: true, dir: "app/components/Marketing" });
    expect(vi.mocked(safeWriteFile).mock.calls[0][0]).toContain(
      "app/components/Marketing/Hero/BlockHero1.vue"
    );
  });

  it("fails before writing anything when a name is unknown", async () => {
    const { safeWriteFile } = await import("../../src/utils/safeWriteFile");
    await expect(runBlockCommand(["BlockHero1", "BlockNope7"], { yes: true })).rejects.toThrow(
      "exit 1"
    );
    expect(safeWriteFile).not.toHaveBeenCalled();
  });

  it("requires names with --yes", async () => {
    await expect(runBlockCommand([], { yes: true })).rejects.toThrow("exit 1");
  });

  it("prints the catalog as JSON, filtered by category, without loading the config", async () => {
    const { getUIConfig } = await import("../../src/utils/config");
    const log = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    await runBlockCommand([], { json: true, category: "hero" });

    expect(getUIConfig).not.toHaveBeenCalled();
    expect(JSON.parse(String(log.mock.calls[0][0]))).toEqual([
      {
        id: "BlockHero1",
        name: "Hero 1",
        category: "Hero",
        description: "Split hero. Features: badge",
        components: ["button", "container"],
      },
    ]);
    log.mockRestore();
  });
});

describe("nuxtComponentName", () => {
  it("matches the name Nuxt registers for the default folder", async () => {
    const { nuxtComponentName } = await import("../../src/commands/block");
    expect(nuxtComponentName("app/components/Blocks", BLOCKS[0])).toBe("BlocksHeroBlockHero1");
    expect(nuxtComponentName("components/Blocks", BLOCKS[1])).toBe("BlocksPricingBlockPricing2");
    expect(nuxtComponentName("app/blocks", BLOCKS[0])).toBeUndefined();
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

import { init } from "../../src/commands/init";

vi.mock("c12/update");
vi.mock("ora", () => ({
  default: () => ({ start: vi.fn().mockReturnThis(), succeed: vi.fn().mockReturnThis() }),
}));
vi.mock("fs-extra", () => ({ default: { writeFileSync: vi.fn() } }));
vi.mock("../../src/utils/config");
vi.mock("../../src/utils/addPrettierConfig");
vi.mock("../../src/utils/addTailwindVitePlugin");
vi.mock("../../src/utils/addVSCodeFiles");
vi.mock("../../src/utils/installPackages");
vi.mock("../../src/utils/printFancyBoxMessage");

const TV = { from: "tailwind-variants", name: "tv" };
const VARIANT_PROPS = { from: "tailwind-variants", name: "VariantProps", type: true };

describe("commands/init nuxt.config update", () => {
  const runInit = async (config: Record<string, any>) => {
    const { getUIConfig } = await import("../../src/utils/config");
    const { askPrettierConfig } = await import("../../src/utils/addPrettierConfig");
    const { updateConfig } = await import("c12/update");

    vi.mocked(getUIConfig).mockResolvedValue({
      theme: "zinc",
      tailwindCSSLocation: "app/assets/css/tailwind.css",
      utilsLocation: "app/utils",
      packageManager: "npm",
    } as any);
    vi.mocked(askPrettierConfig).mockResolvedValue(false);

    await init.parseAsync([], { from: "user" });

    const [opts] = vi.mocked(updateConfig).mock.calls[0];
    await (opts as any).onUpdate(config);
    return config;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates the imports object when it is missing", async () => {
    const config = await runInit({});

    expect(config.imports.imports).toEqual([TV, VARIANT_PROPS]);
  });

  it("keeps `scan: false` and adds imports.imports when it is missing (#72)", async () => {
    const config = await runInit({ imports: { scan: false } });

    expect(config.imports.scan).toBe(false);
    expect(config.imports.imports).toEqual([TV, VARIANT_PROPS]);
  });

  it("does not duplicate existing auto-imports", async () => {
    const config = await runInit({ imports: { imports: [TV, VARIANT_PROPS] } });

    expect(config.imports.imports).toEqual([TV, VARIANT_PROPS]);
  });
});

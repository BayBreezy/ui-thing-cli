import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { addShortcuts } from "../../src/commands/shortcuts";
import { DEFAULT_CONFIG_NUXT4 } from "../../src/utils/constants";
import { makeProject } from "../helpers/tmp";

vi.mock("../../src/utils/installPackages");
vi.mock("../../src/utils/printFancyBoxMessage");
vi.mock("../../src/utils/config", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../src/utils/config")>()),
  addModuleToConfig: vi.fn(),
  loadConfigOrDefaults: vi.fn(),
}));
vi.mock("prompts");

describe("commands/shortcuts", () => {
  const cwd = process.cwd();
  let cleanup = () => {};

  beforeEach(async () => {
    vi.clearAllMocks();
    const { loadConfigOrDefaults } = await import("../../src/utils/config");
    vi.mocked(loadConfigOrDefaults).mockResolvedValue({
      config: { ...DEFAULT_CONFIG_NUXT4, packageManager: "bun" },
      fromFile: true,
    });
  });
  afterEach(() => {
    process.chdir(cwd);
    cleanup();
  });

  it("writes the composable, installs @vueuse/nuxt only when missing, never prompts", async () => {
    const project = makeProject({
      "package.json": JSON.stringify({ dependencies: {} }),
      "nuxt.config.ts": "export default defineNuxtConfig({})",
    });
    cleanup = project.cleanup;
    process.chdir(project.dir);
    const { installPackages } = await import("../../src/utils/installPackages");
    const { addModuleToConfig } = await import("../../src/utils/config");
    const prompts = (await import("prompts")).default;
    const fs = await import("node:fs");

    await addShortcuts.parseAsync([], { from: "user" });

    expect(fs.existsSync("app/composables/shortcuts.ts")).toBe(true);
    expect(installPackages).toHaveBeenCalledWith("bun", ["@vueuse/nuxt"]);
    expect(addModuleToConfig).toHaveBeenCalledWith(["@vueuse/nuxt"]);
    expect(prompts).not.toHaveBeenCalled();
  });

  it("skips the install when @vueuse/nuxt is already a dependency", async () => {
    const project = makeProject({
      "package.json": JSON.stringify({ dependencies: { "@vueuse/nuxt": "^14.0.0" } }),
      "nuxt.config.ts": "export default defineNuxtConfig({})",
    });
    cleanup = project.cleanup;
    process.chdir(project.dir);
    const { installPackages } = await import("../../src/utils/installPackages");

    await addShortcuts.parseAsync([], { from: "user" });

    expect(installPackages).not.toHaveBeenCalled();
  });
});

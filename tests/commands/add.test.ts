import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { runAddCommand } from "../../src/commands/add";
import { Component } from "../../src/types";

vi.mock("../../src/utils/fetchComponents");
vi.mock("../../src/utils/config");
vi.mock("../../src/utils/compareUIConfig");
vi.mock("../../src/utils/detectNuxtVersion");
vi.mock("../../src/utils/writeFile");
vi.mock("../../src/utils/installPackages");
vi.mock("../../src/utils/fileExists");
vi.mock("../../src/utils/logger");
vi.mock("../../src/utils/printFancyBoxMessage");
vi.mock("../../src/utils/promptForComponents");
vi.mock("../../src/utils/installValidator");
vi.mock("prompts");
vi.mock("c12/update");

const mockComponent: Component = {
  name: "Popover",
  value: "popover",
  files: [{ fileName: "Popover.vue", dirPath: "app/components/Ui", fileContent: "<div />" }],
  utils: [],
  composables: [],
  plugins: [],
  deps: [],
  devDeps: [],
  nuxtModules: [],
};

describe("commands/add --skip-config", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses Nuxt 4 defaults when skipConfig is set and nuxt 4 is detected", async () => {
    const { fetchComponents } = await import("../../src/utils/fetchComponents");
    const { detectNuxtVersion } = await import("../../src/utils/detectNuxtVersion");
    const { writeFile } = await import("../../src/utils/writeFile");
    const { fileExists } = await import("../../src/utils/fileExists");
    const prompts = await import("prompts");

    vi.mocked(fetchComponents).mockResolvedValue([mockComponent]);
    vi.mocked(detectNuxtVersion).mockReturnValue(4);
    vi.mocked(fileExists).mockResolvedValue(false);
    vi.mocked(prompts.default).mockResolvedValue({});

    await runAddCommand(["popover"], { skipConfig: true, packageManager: "npm" });

    expect(vi.mocked(writeFile)).toHaveBeenCalledWith(
      expect.stringContaining("app/components/Ui/Popover.vue"),
      "<div />"
    );
  });

  it("uses Nuxt 3 defaults when skipConfig is set and nuxt 3 is detected", async () => {
    const { fetchComponents } = await import("../../src/utils/fetchComponents");
    const { detectNuxtVersion } = await import("../../src/utils/detectNuxtVersion");
    const { writeFile } = await import("../../src/utils/writeFile");
    const { fileExists } = await import("../../src/utils/fileExists");
    const prompts = await import("prompts");

    vi.mocked(fetchComponents).mockResolvedValue([mockComponent]);
    vi.mocked(detectNuxtVersion).mockReturnValue(3);
    vi.mocked(fileExists).mockResolvedValue(false);
    vi.mocked(prompts.default).mockResolvedValue({});

    await runAddCommand(["popover"], { skipConfig: true, packageManager: "npm" });

    expect(vi.mocked(writeFile)).toHaveBeenCalledWith(
      expect.stringContaining("components/Ui/Popover.vue"),
      "<div />"
    );
    expect(vi.mocked(writeFile)).not.toHaveBeenCalledWith(
      expect.stringContaining("app/components/Ui/Popover.vue"),
      expect.any(String)
    );
  });

  it("uses the provided --package-manager without prompting", async () => {
    const { fetchComponents } = await import("../../src/utils/fetchComponents");
    const { detectNuxtVersion } = await import("../../src/utils/detectNuxtVersion");
    const { fileExists } = await import("../../src/utils/fileExists");
    const prompts = await import("prompts");

    vi.mocked(fetchComponents).mockResolvedValue([mockComponent]);
    vi.mocked(detectNuxtVersion).mockReturnValue(4);
    vi.mocked(fileExists).mockResolvedValue(false);

    await runAddCommand(["popover"], { skipConfig: true, packageManager: "bun" });

    expect(vi.mocked(prompts.default)).not.toHaveBeenCalledWith(
      expect.objectContaining({ name: "packageManager" })
    );
  });

  it("prompts for package manager when skipConfig is set but no --package-manager given", async () => {
    const { fetchComponents } = await import("../../src/utils/fetchComponents");
    const { detectNuxtVersion } = await import("../../src/utils/detectNuxtVersion");
    const { fileExists } = await import("../../src/utils/fileExists");
    const prompts = await import("prompts");

    vi.mocked(fetchComponents).mockResolvedValue([mockComponent]);
    vi.mocked(detectNuxtVersion).mockReturnValue(4);
    vi.mocked(fileExists).mockResolvedValue(false);
    vi.mocked(prompts.default).mockResolvedValue({ packageManager: "pnpm" });

    await runAddCommand(["popover"], { skipConfig: true });

    expect(vi.mocked(prompts.default)).toHaveBeenCalledWith(
      expect.objectContaining({ name: "packageManager", type: "select" })
    );
  });

  it("does not call getUIConfig when skipConfig is set", async () => {
    const { fetchComponents } = await import("../../src/utils/fetchComponents");
    const { detectNuxtVersion } = await import("../../src/utils/detectNuxtVersion");
    const { getUIConfig } = await import("../../src/utils/config");
    const { fileExists } = await import("../../src/utils/fileExists");
    const prompts = await import("prompts");

    vi.mocked(fetchComponents).mockResolvedValue([mockComponent]);
    vi.mocked(detectNuxtVersion).mockReturnValue(4);
    vi.mocked(fileExists).mockResolvedValue(false);
    vi.mocked(prompts.default).mockResolvedValue({});

    await runAddCommand(["popover"], { skipConfig: true, packageManager: "npm" });

    expect(vi.mocked(getUIConfig)).not.toHaveBeenCalled();
  });
});

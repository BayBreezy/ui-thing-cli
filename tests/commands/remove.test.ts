import fs from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { runRemoveCommand } from "../../src/commands/remove";
import { Component } from "../../src/types";

vi.mock("../../src/utils/fetchComponents");
vi.mock("../../src/utils/config");
vi.mock("../../src/utils/fileExists");
vi.mock("../../src/utils/logger");
vi.mock("../../src/utils/printFancyBoxMessage");
vi.mock("prompts");
vi.mock("node:fs/promises");

const mockComponents: Component[] = [
  {
    name: "Button",
    value: "button",
    files: [{ fileName: "Button.vue", dirPath: "app/components/Ui", fileContent: "" }],
    utils: [],
    composables: [],
    plugins: [],
  },
  {
    name: "Input",
    value: "input",
    files: [{ fileName: "Input.vue", dirPath: "app/components/Ui", fileContent: "" }],
    utils: [],
    composables: [],
    plugins: [],
  },
];

describe("commands/remove", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should remove component files that exist", async () => {
    const { fetchComponents } = await import("../../src/utils/fetchComponents");
    const { getUIConfig } = await import("../../src/utils/config");
    const { fileExists } = await import("../../src/utils/fileExists");
    const { logger } = await import("../../src/utils/logger");
    const prompts = await import("prompts");

    vi.mocked(getUIConfig).mockResolvedValue({
      componentsLocation: "app/components/Ui",
      utilsLocation: "app/utils",
      composablesLocation: "app/composables",
    } as any);
    vi.mocked(fetchComponents).mockResolvedValue(mockComponents);
    vi.mocked(fileExists).mockResolvedValue(true);
    vi.mocked(prompts.default).mockResolvedValue({ confirmed: true });
    vi.mocked(fs.unlink).mockResolvedValue(undefined);

    await runRemoveCommand(["button"]);

    expect(vi.mocked(fs.unlink)).toHaveBeenCalledWith(expect.stringContaining("Button.vue"));
    expect(vi.mocked(logger.success)).toHaveBeenCalledWith("Removed: Button.vue");
  });

  it("should skip files that do not exist and warn", async () => {
    const { fetchComponents } = await import("../../src/utils/fetchComponents");
    const { getUIConfig } = await import("../../src/utils/config");
    const { fileExists } = await import("../../src/utils/fileExists");
    const { logger } = await import("../../src/utils/logger");
    const prompts = await import("prompts");

    vi.mocked(getUIConfig).mockResolvedValue({
      componentsLocation: "app/components/Ui",
      utilsLocation: "app/utils",
      composablesLocation: "app/composables",
    } as any);
    vi.mocked(fetchComponents).mockResolvedValue(mockComponents);
    vi.mocked(fileExists).mockResolvedValue(false);
    vi.mocked(prompts.default).mockResolvedValue({ confirmed: true });

    await runRemoveCommand(["button"]);

    expect(vi.mocked(fs.unlink)).not.toHaveBeenCalled();
    expect(vi.mocked(logger.warn)).toHaveBeenCalledWith(expect.stringContaining("Button.vue"));
  });

  it("should cancel when user declines confirmation", async () => {
    const { fetchComponents } = await import("../../src/utils/fetchComponents");
    const { getUIConfig } = await import("../../src/utils/config");
    const { fileExists } = await import("../../src/utils/fileExists");
    const { logger } = await import("../../src/utils/logger");
    const prompts = await import("prompts");

    vi.mocked(getUIConfig).mockResolvedValue({
      componentsLocation: "app/components/Ui",
      utilsLocation: "app/utils",
      composablesLocation: "app/composables",
    } as any);
    vi.mocked(fetchComponents).mockResolvedValue(mockComponents);
    vi.mocked(fileExists).mockResolvedValue(true);
    vi.mocked(prompts.default).mockResolvedValue({ confirmed: false });

    await runRemoveCommand(["button"]);

    expect(vi.mocked(fs.unlink)).not.toHaveBeenCalled();
    expect(vi.mocked(logger.info)).toHaveBeenCalledWith("Cancelled.");
  });

  it("should exit with error when no specified names are found in registry", async () => {
    const { fetchComponents } = await import("../../src/utils/fetchComponents");
    const { getUIConfig } = await import("../../src/utils/config");
    const { logger } = await import("../../src/utils/logger");

    const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {}) as any);

    vi.mocked(getUIConfig).mockResolvedValue({
      componentsLocation: "app/components/Ui",
      utilsLocation: "app/utils",
      composablesLocation: "app/composables",
    } as any);
    vi.mocked(fetchComponents).mockResolvedValue(mockComponents);

    await runRemoveCommand(["nonexistent"]);

    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      "None of the specified components were found in the registry."
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("should show info and return when no components are installed", async () => {
    const { fetchComponents } = await import("../../src/utils/fetchComponents");
    const { getUIConfig } = await import("../../src/utils/config");
    const { fileExists } = await import("../../src/utils/fileExists");
    const { logger } = await import("../../src/utils/logger");

    vi.mocked(getUIConfig).mockResolvedValue({
      componentsLocation: "app/components/Ui",
      utilsLocation: "app/utils",
      composablesLocation: "app/composables",
    } as any);
    vi.mocked(fetchComponents).mockResolvedValue(mockComponents);
    vi.mocked(fileExists).mockResolvedValue(false);

    await runRemoveCommand([]);

    expect(vi.mocked(logger.info)).toHaveBeenCalledWith("No installed components found.");
    expect(vi.mocked(fs.unlink)).not.toHaveBeenCalled();
  });
});

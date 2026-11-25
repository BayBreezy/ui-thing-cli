import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { runUpdateCommand } from "../../src/commands/update";
import { Component } from "../../src/types";

vi.mock("../../src/utils/fetchComponents");
vi.mock("../../src/utils/config");
vi.mock("../../src/utils/fileExists");
vi.mock("../../src/utils/writeFile");
vi.mock("../../src/utils/logger");
vi.mock("../../src/utils/printFancyBoxMessage");
vi.mock("prompts");

const mockComponents: Component[] = [
  {
    name: "Button",
    value: "button",
    files: [{ fileName: "Button.vue", dirPath: "app/components/Ui", fileContent: "<button />" }],
    utils: [],
    composables: [],
    plugins: [],
  },
  {
    name: "Input",
    value: "input",
    files: [{ fileName: "Input.vue", dirPath: "app/components/Ui", fileContent: "<input />" }],
    utils: [],
    composables: [],
    plugins: [],
  },
];

describe("commands/update", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should update a named component and overwrite its files", async () => {
    const { fetchComponents } = await import("../../src/utils/fetchComponents");
    const { getUIConfig } = await import("../../src/utils/config");
    const { writeFile } = await import("../../src/utils/writeFile");
    const { logger } = await import("../../src/utils/logger");

    vi.mocked(getUIConfig).mockResolvedValue({ componentsLocation: "app/components/Ui" } as any);
    vi.mocked(fetchComponents).mockResolvedValue(mockComponents);

    await runUpdateCommand(["button"]);

    expect(vi.mocked(writeFile)).toHaveBeenCalledWith(
      expect.stringContaining("Button.vue"),
      "<button />"
    );
    expect(vi.mocked(logger.success)).toHaveBeenCalledWith("Updated: Button.vue");
  });

  it("should warn for unknown component names", async () => {
    const { fetchComponents } = await import("../../src/utils/fetchComponents");
    const { getUIConfig } = await import("../../src/utils/config");
    const { logger } = await import("../../src/utils/logger");

    vi.mocked(getUIConfig).mockResolvedValue({ componentsLocation: "app/components/Ui" } as any);
    vi.mocked(fetchComponents).mockResolvedValue(mockComponents);

    await runUpdateCommand(["nonexistent"]);

    expect(vi.mocked(logger.warn)).toHaveBeenCalledWith(expect.stringContaining("nonexistent"));
  });

  it("should prompt for selection when no names given and components are installed", async () => {
    const { fetchComponents } = await import("../../src/utils/fetchComponents");
    const { getUIConfig } = await import("../../src/utils/config");
    const { fileExists } = await import("../../src/utils/fileExists");
    const { writeFile } = await import("../../src/utils/writeFile");
    const prompts = await import("prompts");

    vi.mocked(getUIConfig).mockResolvedValue({ componentsLocation: "app/components/Ui" } as any);
    vi.mocked(fetchComponents).mockResolvedValue(mockComponents);
    vi.mocked(fileExists).mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    vi.mocked(prompts.default).mockResolvedValue({ selected: ["button"] });

    await runUpdateCommand([]);

    expect(vi.mocked(writeFile)).toHaveBeenCalledWith(
      expect.stringContaining("Button.vue"),
      "<button />"
    );
  });

  it("should exit cleanly when user cancels the prompt", async () => {
    const { fetchComponents } = await import("../../src/utils/fetchComponents");
    const { getUIConfig } = await import("../../src/utils/config");
    const { fileExists } = await import("../../src/utils/fileExists");
    const { writeFile } = await import("../../src/utils/writeFile");
    const prompts = await import("prompts");

    const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {}) as any);

    vi.mocked(getUIConfig).mockResolvedValue({ componentsLocation: "app/components/Ui" } as any);
    vi.mocked(fetchComponents).mockResolvedValue(mockComponents);
    vi.mocked(fileExists).mockResolvedValue(true);
    vi.mocked(prompts.default).mockResolvedValue({ selected: [] });

    await runUpdateCommand([]);

    expect(exitSpy).toHaveBeenCalledWith(0);
    expect(vi.mocked(writeFile)).not.toHaveBeenCalled();
  });

  it("should show info message when no installed components found", async () => {
    const { fetchComponents } = await import("../../src/utils/fetchComponents");
    const { getUIConfig } = await import("../../src/utils/config");
    const { fileExists } = await import("../../src/utils/fileExists");
    const { logger } = await import("../../src/utils/logger");

    vi.mocked(getUIConfig).mockResolvedValue({ componentsLocation: "app/components/Ui" } as any);
    vi.mocked(fetchComponents).mockResolvedValue(mockComponents);
    vi.mocked(fileExists).mockResolvedValue(false);

    await runUpdateCommand([]);

    expect(vi.mocked(logger.info)).toHaveBeenCalledWith("No installed components found.");
  });
});

describe("commands/update --dry-run", () => {
  it("reports what would change and writes nothing", async () => {
    vi.clearAllMocks();
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { makeProject, captureJson } = await import("../helpers/tmp");
    const { fetchComponents } = await import("../../src/utils/fetchComponents");
    const { loadConfigOrDefaults } = await import("../../src/utils/config");
    const { writeFile } = await import("../../src/utils/writeFile");
    const { DEFAULT_CONFIG_NUXT4 } = await import("../../src/utils/constants");

    const project = makeProject({ "app/components/Ui/Button.vue": "old" });
    const cwd = process.cwd();
    process.chdir(project.dir);
    try {
      vi.mocked(loadConfigOrDefaults).mockResolvedValue({
        config: DEFAULT_CONFIG_NUXT4,
        fromFile: true,
      });
      vi.mocked(fetchComponents).mockResolvedValue([
        {
          name: "Button",
          value: "button",
          files: [{ fileName: "Button.vue", dirPath: "", fileContent: "new" }],
          utils: [],
          composables: [],
          plugins: [],
        },
      ]);

      const out = await captureJson(() =>
        runUpdateCommand(["button"], { dryRun: true, json: true })
      );

      expect(out.summary).toEqual({ modified: 1, missing: 0, unchanged: 0, itemsWithChanges: 1 });
      expect(out.items[0].files[0]).toMatchObject({
        path: "app/components/Ui/Button.vue",
        status: "modified",
      });
      expect(writeFile).not.toHaveBeenCalled();
      expect(fs.readFileSync(path.join(project.dir, "app/components/Ui/Button.vue"), "utf-8")).toBe(
        "old"
      );
    } finally {
      process.chdir(cwd);
      project.cleanup();
    }
  });
});

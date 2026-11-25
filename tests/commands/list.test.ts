import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { runListCommand } from "../../src/commands/list";
import { Component } from "../../src/types";

vi.mock("../../src/utils/fetchComponents");
vi.mock("../../src/utils/config");
vi.mock("../../src/utils/fileExists");
vi.mock("../../src/utils/logger");

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
  {
    name: "Card",
    value: "card",
    files: [{ fileName: "Card/Card.vue", dirPath: "app/components/Ui", fileContent: "" }],
    utils: [],
    composables: [],
    plugins: [],
  },
];

describe("commands/list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should list all components when --installed is not passed", async () => {
    const { fetchComponents } = await import("../../src/utils/fetchComponents");
    const { loadConfigOrDefaults } = await import("../../src/utils/config");
    const { logger } = await import("../../src/utils/logger");

    vi.mocked(loadConfigOrDefaults).mockResolvedValue({
      config: { componentsLocation: "app/components/Ui" } as any,
      fromFile: true,
    });
    vi.mocked(fetchComponents).mockResolvedValue(mockComponents);

    await runListCommand({ installed: false });

    expect(vi.mocked(logger.log)).toHaveBeenCalledTimes(3);
    expect(vi.mocked(logger.success)).toHaveBeenCalledWith("3 component(s) found.");
  });

  it("should filter to installed components when --installed is passed", async () => {
    const { fetchComponents } = await import("../../src/utils/fetchComponents");
    const { loadConfigOrDefaults } = await import("../../src/utils/config");
    const { fileExists } = await import("../../src/utils/fileExists");
    const { logger } = await import("../../src/utils/logger");

    vi.mocked(loadConfigOrDefaults).mockResolvedValue({
      config: { componentsLocation: "app/components/Ui" } as any,
      fromFile: true,
    });
    vi.mocked(fetchComponents).mockResolvedValue(mockComponents);
    // Only Button is "installed"
    vi.mocked(fileExists)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(false);

    await runListCommand({ installed: true });

    expect(vi.mocked(logger.log)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(logger.log)).toHaveBeenCalledWith("Button (button)");
    expect(vi.mocked(logger.success)).toHaveBeenCalledWith("1 component(s) found.");
  });

  it("should show 'No components installed.' when --installed and none found", async () => {
    const { fetchComponents } = await import("../../src/utils/fetchComponents");
    const { loadConfigOrDefaults } = await import("../../src/utils/config");
    const { fileExists } = await import("../../src/utils/fileExists");
    const { logger } = await import("../../src/utils/logger");

    vi.mocked(loadConfigOrDefaults).mockResolvedValue({
      config: { componentsLocation: "app/components/Ui" } as any,
      fromFile: true,
    });
    vi.mocked(fetchComponents).mockResolvedValue(mockComponents);
    vi.mocked(fileExists).mockResolvedValue(false);

    await runListCommand({ installed: true });

    expect(vi.mocked(logger.info)).toHaveBeenCalledWith("No components installed.");
    expect(vi.mocked(logger.log)).not.toHaveBeenCalled();
  });

  it("should show 'No components available.' when API returns empty array", async () => {
    const { fetchComponents } = await import("../../src/utils/fetchComponents");
    const { loadConfigOrDefaults } = await import("../../src/utils/config");
    const { logger } = await import("../../src/utils/logger");

    vi.mocked(loadConfigOrDefaults).mockResolvedValue({
      config: { componentsLocation: "app/components/Ui" } as any,
      fromFile: true,
    });
    vi.mocked(fetchComponents).mockResolvedValue([]);

    await runListCommand({ installed: false });

    expect(vi.mocked(logger.info)).toHaveBeenCalledWith("No components available.");
    expect(vi.mocked(logger.log)).not.toHaveBeenCalled();
  });
});

describe("commands/list --json", () => {
  it("prints the catalog as JSON without human log lines", async () => {
    vi.clearAllMocks();
    const { fetchComponents } = await import("../../src/utils/fetchComponents");
    const { loadConfigOrDefaults } = await import("../../src/utils/config");
    const { logger } = await import("../../src/utils/logger");
    vi.mocked(loadConfigOrDefaults).mockResolvedValue({
      config: { componentsLocation: "app/components/Ui" } as any,
      fromFile: false,
    });
    vi.mocked(fetchComponents).mockResolvedValue(mockComponents);
    const write = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    await runListCommand({ installed: false, json: true });

    const out = JSON.parse(String(write.mock.calls[0][0]));
    expect(out.map((c: any) => c.value)).toEqual(["button", "input", "card"]);
    expect(out[0]).toEqual({ value: "button", name: "Button", source: "ui-thing", docs: null });
    expect(logger.log).not.toHaveBeenCalled();
    write.mockRestore();
  });
});

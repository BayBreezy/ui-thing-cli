import fse from "fs-extra";
import { afterEach, describe, expect, it, vi } from "vitest";

import * as testingFn from "../../src/utils/addPrettierConfig";

vi.mock("execa", () => ({
  $: vi.fn(),
}));

const currentDir = process.cwd();

describe("utils/addPrettierConfig", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetAllMocks();
  });

  it("should ask the user if they want to overwrite the existing prettier config file if one exists", async () => {
    vi.spyOn(fse, "existsSync").mockImplementation(() => true);
    vi.mock("prompts", async () => {
      const prompts = await vi.importActual<typeof import("prompts")>("prompts");
      return {
        ...prompts,
        default: async () => {
          return { overwrite: false };
        },
      };
    });
    const prompts = await import("prompts");
    vi.spyOn(prompts, "default");

    const result = await testingFn.addPrettierConfig();
    expect(result).toBe(false);
    expect(fse.existsSync).toHaveBeenCalledTimes(1);
    expect(prompts.default).toHaveBeenCalledTimes(1);
  });

  it("should create config file if one does not exist", async () => {
    vi.spyOn(fse, "existsSync").mockImplementation(() => false);
    vi.spyOn(fse, "writeFile").mockResolvedValue();

    const result = await testingFn.addPrettierConfig(currentDir, false);
    expect(result).toBe(true);
    expect(fse.existsSync).toHaveBeenCalledTimes(1);
    expect(fse.writeFile).toHaveBeenCalledTimes(1);
  });

  it("should format files with prettier if format is true", async () => {
    const { $ } = await import("execa");
    const mockExeca$ = vi.mocked($);

    vi.spyOn(testingFn, "addPrettierConfig");
    vi.spyOn(fse, "existsSync").mockImplementation(() => false);
    vi.spyOn(fse, "writeFile").mockResolvedValue();
    mockExeca$.mockResolvedValue(true as any);

    const result = await testingFn.addPrettierConfig(currentDir, true);
    expect(result).toBe(true);
    expect(fse.existsSync).toHaveBeenCalledTimes(1);
    expect(fse.writeFile).toHaveBeenCalledTimes(1);
    expect(mockExeca$).toHaveBeenCalledTimes(1);
    expect(testingFn.addPrettierConfig).toHaveBeenCalledTimes(1);
  });
});

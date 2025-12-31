import { afterEach, describe, expect, it, vi } from "vitest";

import { UIConfig } from "../../src/types";
import * as testingFn from "../../src/utils/compareUIConfig";
import * as configModule from "../../src/utils/config";

const goodConfig: UIConfig = {
  nuxtVersion: 3,
  theme: "string",
  tailwindCSSLocation: "string",
  componentsLocation: "string",
  composablesLocation: "string",
  utilsLocation: "string",
  force: true,
  useDefaultFilename: true,
  packageManager: "string",
  pluginsLocation: "string",
};

const badConfig = {
  theme: "string",
  tailwindCSSLocation: "string",
  tailwindConfigLocation: "string",
  utilsLocation: "string",
  force: true,
};

describe("utils/compareUIConfig", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetAllMocks();
  });

  it("should return false if properties are missing", async () => {
    // create spies
    vi.spyOn(configModule, "getUIConfig").mockResolvedValue(badConfig as unknown as UIConfig);
    vi.spyOn(testingFn, "compareUIConfig");

    // call the function we are testing
    const configValue = await testingFn.compareUIConfig();

    // assertions
    expect(configValue).toBe(false);
    expect(testingFn.compareUIConfig).toHaveBeenCalledTimes(1);
    expect(configModule.getUIConfig).toHaveBeenCalledTimes(1);
  });

  it("should return true if all properties are present", async () => {
    // create spies
    vi.spyOn(configModule, "getUIConfig").mockResolvedValue(goodConfig);
    vi.spyOn(testingFn, "compareUIConfig");

    // call the function we are testing
    const configValue = await testingFn.compareUIConfig();

    // assertions
    expect(configValue).toBe(true);
    expect(testingFn.compareUIConfig).toHaveBeenCalledTimes(1);
    expect(configModule.getUIConfig).toHaveBeenCalledTimes(1);
  });
});

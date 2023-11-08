import { afterEach, describe, expect, it, vi } from "vitest";

import * as testingFn from "../../src/templates/css";

describe("templates/css", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetAllMocks();
  });

  it("should return ZINC theme if an invalid theme is passed", async () => {
    // create spies
    vi.spyOn(testingFn, "createCSS");

    // call function
    const result = testingFn.createCSS("BAD_THEME" as any);

    // assertions
    expect(result).toContain(testingFn.ZINC_THEME);
    expect(testingFn.createCSS).toHaveBeenCalledTimes(1);
  });

  it("should returned the expected theme", async () => {
    // create spies
    vi.spyOn(testingFn, "createCSS");

    // call function
    const result = testingFn.createCSS("BLUE");

    // assertions
    expect(result).toContain(testingFn.BLUE_THEME);
    expect(testingFn.createCSS).toHaveBeenCalledTimes(1);
  });
});

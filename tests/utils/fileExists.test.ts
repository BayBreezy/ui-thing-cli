import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import * as testingFn from "../../src/utils/fileExists";

const currentDir = process.cwd();
const badPath = path.join(currentDir, "test");
const goodPath = path.join(currentDir, "tests/utils/fileExists.test.ts");

describe("utils/fileExists", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });
  it("should return true if file exists", async () => {
    const spy = vi.spyOn(fs.promises, "access");
    const fnSpy = vi.spyOn(testingFn, "fileExists");

    const exists = await testingFn.fileExists(goodPath);
    expect(fnSpy).toHaveBeenCalledWith(goodPath);
    expect(spy).toHaveBeenCalledWith(goodPath, fs.constants.F_OK || fs.constants.W_OK);
    expect(fnSpy).toBeCalledTimes(1);
    expect(spy).toBeCalledTimes(1);
    expect(exists).toBe(true);
  });

  it("should return false if file does not exist", async () => {
    const spy = vi.spyOn(fs.promises, "access");
    const fnSpy = vi.spyOn(testingFn, "fileExists");

    const exists = await testingFn.fileExists(badPath);
    expect(fnSpy).toHaveBeenCalledWith(badPath);
    expect(spy).toHaveBeenCalledWith(badPath, fs.constants.F_OK || fs.constants.W_OK);
    expect(fnSpy).toBeCalledTimes(1);
    expect(spy).toBeCalledTimes(1);
    expect(exists).toBe(false);
  });
});

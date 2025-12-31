import fs from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { detectNuxtVersion } from "../../src/utils/detectNuxtVersion";

describe("utils/detectNuxtVersion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should detect Nuxt 4 from dependencies", () => {
    const mockPackageJson = JSON.stringify({
      dependencies: {
        nuxt: "^4.0.0",
      },
    });
    vi.spyOn(fs, "readFileSync").mockReturnValue(mockPackageJson);

    const version = detectNuxtVersion();

    expect(version).toBe(4);
    expect(fs.readFileSync).toHaveBeenCalledWith("package.json", "utf-8");
  });

  it("should detect Nuxt 4 from devDependencies", () => {
    const mockPackageJson = JSON.stringify({
      devDependencies: {
        nuxt: "~4.1.0",
      },
    });
    vi.spyOn(fs, "readFileSync").mockReturnValue(mockPackageJson);

    expect(detectNuxtVersion()).toBe(4);
  });

  it("should detect Nuxt 3 from dependencies", () => {
    const mockPackageJson = JSON.stringify({
      dependencies: {
        nuxt: "^3.12.0",
      },
    });
    vi.spyOn(fs, "readFileSync").mockReturnValue(mockPackageJson);

    expect(detectNuxtVersion()).toBe(3);
  });

  it("should detect Nuxt 3 from devDependencies", () => {
    const mockPackageJson = JSON.stringify({
      devDependencies: {
        nuxt: "3.10.0",
      },
    });
    vi.spyOn(fs, "readFileSync").mockReturnValue(mockPackageJson);

    expect(detectNuxtVersion()).toBe(3);
  });

  it("should handle various version formats for Nuxt 4", () => {
    const versions = ["^4.0.0", "~4.1.0", ">=4.0.0", "4.x", "4.0.0"];
    versions.forEach((version) => {
      const mockPackageJson = JSON.stringify({
        dependencies: { nuxt: version },
      });
      vi.spyOn(fs, "readFileSync").mockReturnValue(mockPackageJson);
      expect(detectNuxtVersion()).toBe(4);
    });
  });

  it("should return 4 as default when package.json is missing", () => {
    vi.spyOn(fs, "readFileSync").mockImplementation(() => {
      throw new Error("File not found");
    });

    expect(detectNuxtVersion()).toBe(4);
  });

  it("should return 4 as default when nuxt is not in dependencies", () => {
    const mockPackageJson = JSON.stringify({
      dependencies: {
        vue: "^3.0.0",
      },
    });
    vi.spyOn(fs, "readFileSync").mockReturnValue(mockPackageJson);

    expect(detectNuxtVersion()).toBe(4);
  });

  it("should return 4 when package.json has invalid JSON", () => {
    vi.spyOn(fs, "readFileSync").mockReturnValue("invalid json");

    expect(detectNuxtVersion()).toBe(4);
  });
});

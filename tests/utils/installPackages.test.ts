import { execa } from "execa";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { installPackages } from "../../src/utils/installPackages";

// Mock execa
vi.mock("execa");

describe("utils/installPackages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should install dependencies with npm", async () => {
    const mockExeca = vi.mocked(execa);
    mockExeca.mockResolvedValue({} as any);

    await installPackages("npm", ["vue", "axios"]);

    expect(mockExeca).toHaveBeenCalledWith("npm", ["install", "vue", "axios"]);
    expect(mockExeca).toHaveBeenCalledWith(["npx -y nuxt prepare"]);
  });

  it("should install dev dependencies with npm", async () => {
    const mockExeca = vi.mocked(execa);
    mockExeca.mockResolvedValue({} as any);

    await installPackages("npm", undefined, ["typescript", "vitest"]);

    expect(mockExeca).toHaveBeenCalledWith("npm", ["install", "-D", "typescript", "vitest"]);
  });

  it("should install both dependencies and dev dependencies", async () => {
    const mockExeca = vi.mocked(execa);
    mockExeca.mockResolvedValue({} as any);

    await installPackages("npm", ["vue"], ["typescript"]);

    expect(mockExeca).toHaveBeenCalledWith("npm", ["install", "vue"]);
    expect(mockExeca).toHaveBeenCalledWith("npm", ["install", "-D", "typescript"]);
  });

  it("should use yarn add instead of install", async () => {
    const mockExeca = vi.mocked(execa);
    mockExeca.mockResolvedValue({} as any);

    await installPackages("yarn", ["vue"], ["typescript"]);

    expect(mockExeca).toHaveBeenCalledWith("yarn", ["add", "vue"]);
    expect(mockExeca).toHaveBeenCalledWith("yarn", ["add", "-D", "typescript"]);
  });

  it("should handle string input for deps", async () => {
    const mockExeca = vi.mocked(execa);
    mockExeca.mockResolvedValue({} as any);

    await installPackages("npm", "vue");

    expect(mockExeca).toHaveBeenCalledWith("npm", ["install", "vue"]);
  });

  it("should handle string input for devDeps", async () => {
    const mockExeca = vi.mocked(execa);
    mockExeca.mockResolvedValue({} as any);

    await installPackages("npm", undefined, "typescript");

    expect(mockExeca).toHaveBeenCalledWith("npm", ["install", "-D", "typescript"]);
  });

  it("should work with pnpm", async () => {
    const mockExeca = vi.mocked(execa);
    mockExeca.mockResolvedValue({} as any);

    await installPackages("pnpm", ["vue"], ["typescript"]);

    expect(mockExeca).toHaveBeenCalledWith("pnpm", ["install", "vue"]);
    expect(mockExeca).toHaveBeenCalledWith("pnpm", ["install", "-D", "typescript"]);
  });

  it("should run nuxt prepare after installation", async () => {
    const mockExeca = vi.mocked(execa);
    mockExeca.mockResolvedValue({} as any);

    await installPackages("npm", ["vue"]);

    expect(mockExeca).toHaveBeenCalledWith(["npx -y nuxt prepare"]);
  });

  it("should skip installing empty dependencies", async () => {
    const mockExeca = vi.mocked(execa);
    mockExeca.mockResolvedValue({} as any);

    await installPackages("npm", [], []);

    // Should only call nuxt prepare
    expect(mockExeca).toHaveBeenCalledTimes(1);
    expect(mockExeca).toHaveBeenCalledWith(["npx -y nuxt prepare"]);
  });
});

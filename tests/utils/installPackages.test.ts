import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { installPackages } from "../../src/utils/installPackages";

// Mock execa at the module level
vi.mock("execa", () => ({
  execa: vi.fn(),
}));

describe("utils/installPackages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should install dependencies with npm", async () => {
    const { execa } = await import("execa");
    const mockExeca = vi.mocked(execa);
    mockExeca.mockResolvedValue({} as any);

    await installPackages("npm", ["vue", "axios"]);

    expect(mockExeca).toHaveBeenCalledWith("npm", ["install", "vue", "axios"]);
    expect(mockExeca).toHaveBeenCalledWith(["npx -y nuxt prepare"]);
  });

  it("should install dev dependencies with npm", async () => {
    const { execa } = await import("execa");
    const mockExeca = vi.mocked(execa);
    mockExeca.mockResolvedValue({} as any);

    await installPackages("npm", undefined, ["typescript", "vitest"]);

    expect(mockExeca).toHaveBeenCalledWith("npm", ["install", "-D", "typescript", "vitest"]);
  });

  it("should install both dependencies and dev dependencies", async () => {
    const { execa } = await import("execa");
    const mockExeca = vi.mocked(execa);
    mockExeca.mockResolvedValue({} as any);

    await installPackages("npm", ["vue"], ["typescript"]);

    expect(mockExeca).toHaveBeenCalledWith("npm", ["install", "vue"]);
    expect(mockExeca).toHaveBeenCalledWith("npm", ["install", "-D", "typescript"]);
  });

  it("should use yarn add instead of install", async () => {
    const { execa } = await import("execa");
    const mockExeca = vi.mocked(execa);
    mockExeca.mockResolvedValue({} as any);

    await installPackages("yarn", ["vue"], ["typescript"]);

    expect(mockExeca).toHaveBeenCalledWith("yarn", ["add", "vue"]);
    expect(mockExeca).toHaveBeenCalledWith("yarn", ["add", "-D", "typescript"]);
  });

  it("should handle string input for deps", async () => {
    const { execa } = await import("execa");
    const mockExeca = vi.mocked(execa);
    mockExeca.mockResolvedValue({} as any);

    await installPackages("npm", "vue");

    expect(mockExeca).toHaveBeenCalledWith("npm", ["install", "vue"]);
  });

  it("should handle string input for devDeps", async () => {
    const { execa } = await import("execa");
    const mockExeca = vi.mocked(execa);
    mockExeca.mockResolvedValue({} as any);

    await installPackages("npm", undefined, "typescript");

    expect(mockExeca).toHaveBeenCalledWith("npm", ["install", "-D", "typescript"]);
  });

  it("should use pnpm add instead of install", async () => {
    const { execa } = await import("execa");
    const mockExeca = vi.mocked(execa);
    mockExeca.mockResolvedValue({} as any);

    await installPackages("pnpm", ["vue"], ["typescript"]);

    expect(mockExeca).toHaveBeenCalledWith("pnpm", ["add", "vue"]);
    expect(mockExeca).toHaveBeenCalledWith("pnpm", ["add", "-D", "typescript"]);
  });

  it("should use bun add instead of install", async () => {
    const { execa } = await import("execa");
    const mockExeca = vi.mocked(execa);
    mockExeca.mockResolvedValue({} as any);

    await installPackages("bun", ["vue"], ["typescript"]);

    expect(mockExeca).toHaveBeenCalledWith("bun", ["add", "vue"]);
    expect(mockExeca).toHaveBeenCalledWith("bun", ["add", "-D", "typescript"]);
  });

  it("should use deno add with npm: prefix", async () => {
    const { execa } = await import("execa");
    const mockExeca = vi.mocked(execa);
    mockExeca.mockResolvedValue({} as any);

    await installPackages("deno", ["vue"], ["typescript"]);

    expect(mockExeca).toHaveBeenCalledWith("deno", ["add", "npm:vue"]);
    expect(mockExeca).toHaveBeenCalledWith("deno", ["add", "--dev", "npm:typescript"]);
    expect(mockExeca).toHaveBeenCalledWith("deno", ["run", "-A", "npm:nuxt", "prepare"]);
  });

  it("should not double-prefix packages already starting with npm:", async () => {
    const { execa } = await import("execa");
    const mockExeca = vi.mocked(execa);
    mockExeca.mockResolvedValue({} as any);

    await installPackages("deno", ["npm:vue"]);

    expect(mockExeca).toHaveBeenCalledWith("deno", ["add", "npm:vue"]);
  });

  it("should run nuxt prepare after installation", async () => {
    const { execa } = await import("execa");
    const mockExeca = vi.mocked(execa);
    mockExeca.mockResolvedValue({} as any);

    await installPackages("npm", ["vue"]);

    expect(mockExeca).toHaveBeenCalledWith(["npx -y nuxt prepare"]);
  });

  it("should skip installing empty dependencies", async () => {
    const { execa } = await import("execa");
    const mockExeca = vi.mocked(execa);
    mockExeca.mockResolvedValue({} as any);

    await installPackages("npm", [], []);

    // Should only call nuxt prepare
    expect(mockExeca).toHaveBeenCalledTimes(1);
    expect(mockExeca).toHaveBeenCalledWith(["npx -y nuxt prepare"]);
  });
});

describe("utils/installPackages pnpm ignored builds", () => {
  it("treats ERR_PNPM_IGNORED_BUILDS as installed, warns and keeps going", async () => {
    const { execa } = await import("execa");
    const { consola } = await import("consola");
    const warn = vi.spyOn(consola, "warn").mockImplementation(() => {});
    vi.mocked(execa).mockReset();
    vi.mocked(execa).mockImplementation((async (cmd: unknown, args?: unknown) => {
      if (Array.isArray(args) && args[0] === "add") {
        throw Object.assign(new Error("Command failed"), {
          stderr: "Error: ERR_PNPM_IGNORED_BUILDS\n  ╰─▶ Ignored build scripts: esbuild@0.25.0\n",
        });
      }
      return { stdout: "" };
    }) as any);

    await expect(installPackages("pnpm", ["esbuild"])).resolves.toBeUndefined();
    expect(warn.mock.calls[0][0]).toContain("esbuild@0.25.0");
    expect(warn.mock.calls[0][0]).toContain("pnpm approve-builds");
  });

  it("still throws real failures, and only special-cases pnpm", async () => {
    const { isIgnoredBuildsOnly } = await import("../../src/utils/installPackages");
    const ignored = { stderr: "ERR_PNPM_IGNORED_BUILDS" };
    expect(isIgnoredBuildsOnly("pnpm", ignored)).toBe(true);
    expect(isIgnoredBuildsOnly("npm", ignored)).toBe(false);
    expect(isIgnoredBuildsOnly("pnpm", { stderr: "ERR_PNPM_FETCH_404" })).toBe(false);
  });
});

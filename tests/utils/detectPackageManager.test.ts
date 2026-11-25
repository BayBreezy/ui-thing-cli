import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { detectPackageManager } from "../../src/utils/detectPackageManager";

describe("utils/detectPackageManager", () => {
  let dir: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "ui-thing-pm-"));
    vi.stubEnv("npm_config_user_agent", "");
  });
  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
    vi.unstubAllEnvs();
  });

  it.each([
    ["bun.lock", "bun"],
    ["bun.lockb", "bun"],
    ["pnpm-lock.yaml", "pnpm"],
    ["yarn.lock", "yarn"],
    ["package-lock.json", "npm"],
    ["deno.lock", "deno"],
  ])("detects %s as %s", (file, expected) => {
    fs.writeFileSync(path.join(dir, file), "");
    expect(detectPackageManager(dir)).toBe(expected);
  });

  it("falls back to the packageManager field", () => {
    fs.writeFileSync(
      path.join(dir, "package.json"),
      JSON.stringify({ packageManager: "pnpm@9.1.0" })
    );
    expect(detectPackageManager(dir)).toBe("pnpm");
  });

  it("prefers a lockfile over the packageManager field", () => {
    fs.writeFileSync(
      path.join(dir, "package.json"),
      JSON.stringify({ packageManager: "pnpm@9.1.0" })
    );
    fs.writeFileSync(path.join(dir, "bun.lock"), "");
    expect(detectPackageManager(dir)).toBe("bun");
  });

  it("uses the runner that launched the CLI when the project says nothing", () => {
    vi.stubEnv("npm_config_user_agent", "bun/1.3.0 npm/? node/v24");
    expect(detectPackageManager(dir)).toBe("bun");
  });

  it("falls back to npm", () => {
    expect(detectPackageManager(dir)).toBe("npm");
  });
});

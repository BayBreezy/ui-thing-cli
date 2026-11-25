import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_CONFIG_NUXT4 } from "../../src/utils/constants";

vi.mock("../../src/utils/config");
vi.mock("../../src/utils/fetchComponents");
vi.mock("../../src/utils/logger");
vi.mock("../../src/utils/printFancyBoxMessage");
vi.mock("prompts");

describe("commands/remove registry items", () => {
  let dir: string;
  const cwd = process.cwd();

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "ui-thing-rm-"));
    process.chdir(dir);
  });
  afterEach(() => {
    process.chdir(cwd);
    fs.rmSync(dir, { recursive: true, force: true });
    vi.resetModules();
  });

  it("deletes only the files recorded in the lockfile and tidies empty folders", async () => {
    const rel = "app/components/Ui/fluid-glass/FluidGlass.vue";
    fs.mkdirSync(path.dirname(rel), { recursive: true });
    fs.writeFileSync(rel, "x");
    fs.mkdirSync("app/lib", { recursive: true });
    fs.writeFileSync("app/lib/utils.ts", "shared");
    fs.writeFileSync(
      "ui-thing.lock.json",
      JSON.stringify({
        items: {
          "fluid-glass": {
            source: "https://x/r/fluid-glass.json",
            type: "registry:ui",
            files: [rel],
            installedAt: "",
          },
        },
      })
    );

    const { getUIConfig } = await import("../../src/utils/config");
    const { fetchComponents } = await import("../../src/utils/fetchComponents");
    const prompts = (await import("prompts")).default;
    vi.mocked(getUIConfig).mockResolvedValue(DEFAULT_CONFIG_NUXT4);
    vi.mocked(fetchComponents).mockResolvedValue([]);
    vi.mocked(prompts).mockResolvedValue({ confirmed: true });

    const { runRemoveCommand } = await import("../../src/commands/remove");
    await runRemoveCommand(["fluid-glass"]);

    expect(fs.existsSync(rel)).toBe(false);
    expect(fs.existsSync("app/components/Ui/fluid-glass")).toBe(false);
    expect(fs.existsSync("app/lib/utils.ts")).toBe(true);
    expect(fs.existsSync("ui-thing.lock.json")).toBe(false);
  });
});

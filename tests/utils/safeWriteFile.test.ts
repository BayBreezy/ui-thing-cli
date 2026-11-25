import { beforeEach, describe, expect, it, vi } from "vitest";

import { safeWriteFile } from "../../src/utils/safeWriteFile";

vi.mock("../../src/utils/fileExists");
vi.mock("../../src/utils/writeFile");
vi.mock("prompts");

describe("utils/safeWriteFile", () => {
  beforeEach(() => vi.clearAllMocks());

  it("skips an existing file without prompting when not interactive", async () => {
    const { fileExists } = await import("../../src/utils/fileExists");
    const { writeFile } = await import("../../src/utils/writeFile");
    const prompts = (await import("prompts")).default;
    vi.mocked(fileExists).mockResolvedValue(true);

    expect(await safeWriteFile("/p/a.vue", "x", false, "Overwrite?", false)).toBe(false);
    expect(prompts).not.toHaveBeenCalled();
    expect(writeFile).not.toHaveBeenCalled();
  });

  it("asks before overwriting when interactive", async () => {
    const { fileExists } = await import("../../src/utils/fileExists");
    const { writeFile } = await import("../../src/utils/writeFile");
    const prompts = (await import("prompts")).default;
    vi.mocked(fileExists).mockResolvedValue(true);
    vi.mocked(prompts).mockResolvedValue({ value: true });

    expect(await safeWriteFile("/p/a.vue", "x", false, "Overwrite?")).toBe(true);
    expect(prompts).toHaveBeenCalledTimes(1);
    expect(writeFile).toHaveBeenCalledWith("/p/a.vue", "x");
  });

  it("overwrites without asking when force is set", async () => {
    const { fileExists } = await import("../../src/utils/fileExists");
    const prompts = (await import("prompts")).default;
    vi.mocked(fileExists).mockResolvedValue(true);

    expect(await safeWriteFile("/p/a.vue", "x", true, "Overwrite?", false)).toBe(true);
    expect(prompts).not.toHaveBeenCalled();
  });
});

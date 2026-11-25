import { beforeEach, describe, expect, it, vi } from "vitest";

import { installValidator, VALIDATORS } from "../../src/utils/installValidator";

vi.mock("../../src/utils/installPackages");
vi.mock("../../src/utils/logger");
vi.mock("prompts");

describe("utils/installValidator", () => {
  beforeEach(() => vi.clearAllMocks());

  it("skips the prompt when a validator is preselected", async () => {
    const prompts = (await import("prompts")).default;
    const { installPackages } = await import("../../src/utils/installPackages");

    expect(await installValidator("bun", "zod")).toBe("zod");

    expect(prompts).not.toHaveBeenCalled();
    expect(installPackages).toHaveBeenCalledWith("bun", ["zod", "@vee-validate/zod"]);
  });

  it("asks when nothing is preselected", async () => {
    const prompts = (await import("prompts")).default;
    const { installPackages } = await import("../../src/utils/installPackages");
    vi.mocked(prompts).mockResolvedValue({ validator: "yup" });

    expect(await installValidator("npm")).toBe("yup");

    expect(prompts).toHaveBeenCalledTimes(1);
    expect(installPackages).toHaveBeenCalledWith("npm", ["yup", "@vee-validate/yup"]);
  });

  it("lists the supported validators", () => {
    expect(VALIDATORS).toEqual(["yup", "zod", "joi", "valibot"]);
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { runAddCommand } from "../../src/commands/add";
import { Component } from "../../src/types";

vi.mock("../../src/utils/fetchComponents");
vi.mock("../../src/utils/config");
vi.mock("../../src/utils/compareUIConfig");
vi.mock("../../src/utils/detectNuxtVersion");
vi.mock("../../src/utils/writeFile");
vi.mock("../../src/utils/installPackages");
vi.mock("../../src/utils/fileExists");
vi.mock("../../src/utils/logger");
vi.mock("../../src/utils/printFancyBoxMessage");
vi.mock("../../src/utils/promptForComponents");
vi.mock("../../src/utils/installValidator", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../src/utils/installValidator")>()),
  installValidator: vi.fn(),
}));
vi.mock("prompts");
vi.mock("c12/update");

const mockComponent: Component = {
  name: "Popover",
  value: "popover",
  files: [{ fileName: "Popover.vue", dirPath: "app/components/Ui", fileContent: "<div />" }],
  utils: [],
  composables: [],
  plugins: [],
  deps: [],
  devDeps: [],
  nuxtModules: [],
};

describe("commands/add --skip-config", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses Nuxt 4 defaults when skipConfig is set and nuxt 4 is detected", async () => {
    const { fetchComponents } = await import("../../src/utils/fetchComponents");
    const { detectNuxtVersion } = await import("../../src/utils/detectNuxtVersion");
    const { writeFile } = await import("../../src/utils/writeFile");
    const { fileExists } = await import("../../src/utils/fileExists");
    const prompts = await import("prompts");

    vi.mocked(fetchComponents).mockResolvedValue([mockComponent]);
    vi.mocked(detectNuxtVersion).mockReturnValue(4);
    vi.mocked(fileExists).mockResolvedValue(false);
    vi.mocked(prompts.default).mockResolvedValue({});

    await runAddCommand(["popover"], { skipConfig: true, packageManager: "npm" });

    expect(vi.mocked(writeFile)).toHaveBeenCalledWith(
      expect.stringContaining("app/components/Ui/Popover.vue"),
      "<div />"
    );
  });

  it("uses Nuxt 3 defaults when skipConfig is set and nuxt 3 is detected", async () => {
    const { fetchComponents } = await import("../../src/utils/fetchComponents");
    const { detectNuxtVersion } = await import("../../src/utils/detectNuxtVersion");
    const { writeFile } = await import("../../src/utils/writeFile");
    const { fileExists } = await import("../../src/utils/fileExists");
    const prompts = await import("prompts");

    vi.mocked(fetchComponents).mockResolvedValue([mockComponent]);
    vi.mocked(detectNuxtVersion).mockReturnValue(3);
    vi.mocked(fileExists).mockResolvedValue(false);
    vi.mocked(prompts.default).mockResolvedValue({});

    await runAddCommand(["popover"], { skipConfig: true, packageManager: "npm" });

    expect(vi.mocked(writeFile)).toHaveBeenCalledWith(
      expect.stringContaining("components/Ui/Popover.vue"),
      "<div />"
    );
    expect(vi.mocked(writeFile)).not.toHaveBeenCalledWith(
      expect.stringContaining("app/components/Ui/Popover.vue"),
      expect.any(String)
    );
  });

  it("uses the provided --package-manager without prompting", async () => {
    const { fetchComponents } = await import("../../src/utils/fetchComponents");
    const { detectNuxtVersion } = await import("../../src/utils/detectNuxtVersion");
    const { fileExists } = await import("../../src/utils/fileExists");
    const prompts = await import("prompts");

    vi.mocked(fetchComponents).mockResolvedValue([mockComponent]);
    vi.mocked(detectNuxtVersion).mockReturnValue(4);
    vi.mocked(fileExists).mockResolvedValue(false);

    await runAddCommand(["popover"], { skipConfig: true, packageManager: "bun" });

    expect(vi.mocked(prompts.default)).not.toHaveBeenCalledWith(
      expect.objectContaining({ name: "packageManager" })
    );
  });

  it("prompts for package manager when skipConfig is set but no --package-manager given", async () => {
    const { fetchComponents } = await import("../../src/utils/fetchComponents");
    const { detectNuxtVersion } = await import("../../src/utils/detectNuxtVersion");
    const { fileExists } = await import("../../src/utils/fileExists");
    const prompts = await import("prompts");

    vi.mocked(fetchComponents).mockResolvedValue([mockComponent]);
    vi.mocked(detectNuxtVersion).mockReturnValue(4);
    vi.mocked(fileExists).mockResolvedValue(false);
    vi.mocked(prompts.default).mockResolvedValue({ packageManager: "pnpm" });

    await runAddCommand(["popover"], { skipConfig: true });

    expect(vi.mocked(prompts.default)).toHaveBeenCalledWith(
      expect.objectContaining({ name: "packageManager", type: "select" })
    );
  });

  it("does not call getUIConfig when skipConfig is set", async () => {
    const { fetchComponents } = await import("../../src/utils/fetchComponents");
    const { detectNuxtVersion } = await import("../../src/utils/detectNuxtVersion");
    const { getUIConfig } = await import("../../src/utils/config");
    const { fileExists } = await import("../../src/utils/fileExists");
    const prompts = await import("prompts");

    vi.mocked(fetchComponents).mockResolvedValue([mockComponent]);
    vi.mocked(detectNuxtVersion).mockReturnValue(4);
    vi.mocked(fileExists).mockResolvedValue(false);
    vi.mocked(prompts.default).mockResolvedValue({});

    await runAddCommand(["popover"], { skipConfig: true, packageManager: "npm" });

    expect(vi.mocked(getUIConfig)).not.toHaveBeenCalled();
  });
});

describe("commands/add nuxt.config updates", () => {
  const runWithComponent = async (value: string, config: Record<string, any>) => {
    const { fetchComponents } = await import("../../src/utils/fetchComponents");
    const { detectNuxtVersion } = await import("../../src/utils/detectNuxtVersion");
    const { fileExists } = await import("../../src/utils/fileExists");
    const { updateConfig } = await import("c12/update");
    const prompts = await import("prompts");

    vi.mocked(fetchComponents).mockResolvedValue([{ ...mockComponent, name: value, value }]);
    vi.mocked(detectNuxtVersion).mockReturnValue(4);
    vi.mocked(fileExists).mockResolvedValue(false);
    vi.mocked(prompts.default).mockResolvedValue({});

    await runAddCommand([value], { skipConfig: true, packageManager: "npm" });

    for (const [opts] of vi.mocked(updateConfig).mock.calls) {
      await (opts as any).onUpdate(config);
    }
    return config;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("adds the sonner auto-import when imports has no nested imports array", async () => {
    const config = await runWithComponent("sonner", { imports: { scan: false } });

    expect(config.imports.scan).toBe(false);
    expect(config.imports.imports).toEqual([
      { from: "vue-sonner", name: "toast", as: "useSonner" },
    ]);
  });

  it("does not duplicate the sonner auto-import", async () => {
    const config = await runWithComponent("sonner", {
      imports: { imports: [{ from: "vue-sonner", name: "toast", as: "useSonner" }] },
    });

    expect(config.imports.imports).toHaveLength(1);
  });
});

describe("commands/add install order", () => {
  it("installs packages before registering Nuxt modules, then prepares once", async () => {
    vi.clearAllMocks();
    const { fetchComponents } = await import("../../src/utils/fetchComponents");
    const { detectNuxtVersion } = await import("../../src/utils/detectNuxtVersion");
    const { fileExists } = await import("../../src/utils/fileExists");
    const { addModuleToConfig } = await import("../../src/utils/config");
    const { installPackages, runNuxtPrepare } = await import("../../src/utils/installPackages");

    vi.mocked(fetchComponents).mockResolvedValue([
      {
        ...mockComponent,
        name: "Datepicker",
        value: "datepicker",
        devDeps: ["@yuta-inoue-ph/nuxt-vcalendar"],
        nuxtModules: ["@yuta-inoue-ph/nuxt-vcalendar"],
      },
    ]);
    vi.mocked(detectNuxtVersion).mockReturnValue(4);
    vi.mocked(fileExists).mockResolvedValue(false);

    await runAddCommand(["datepicker"], { skipConfig: true, packageManager: "bun", yes: true });

    expect(installPackages).toHaveBeenCalledWith("bun", [], ["@yuta-inoue-ph/nuxt-vcalendar"], {
      prepare: false,
    });
    expect(addModuleToConfig).toHaveBeenCalledWith(["@yuta-inoue-ph/nuxt-vcalendar"]);
    expect(runNuxtPrepare).toHaveBeenCalledWith("bun");
    const order = (fn: unknown) => vi.mocked(fn as () => void).mock.invocationCallOrder[0];
    expect(order(installPackages)).toBeLessThan(order(addModuleToConfig));
    expect(order(addModuleToConfig)).toBeLessThan(order(runNuxtPrepare));
  });
});

describe("commands/add --dry-run", () => {
  it("prints the full plan, including nested dependencies, and writes nothing", async () => {
    vi.clearAllMocks();
    const { fetchComponents } = await import("../../src/utils/fetchComponents");
    const { loadConfigOrDefaults, getUIConfig } = await import("../../src/utils/config");
    const { writeFile } = await import("../../src/utils/writeFile");
    const { installPackages } = await import("../../src/utils/installPackages");
    const { DEFAULT_CONFIG_NUXT4 } = await import("../../src/utils/constants");
    const { captureJson } = await import("../helpers/tmp");

    const make = (value: string, extra: Partial<Component> = {}): Component => ({
      ...mockComponent,
      name: value,
      value,
      files: [{ fileName: `${value}.vue`, dirPath: "", fileContent: "<div />" }],
      ...extra,
    });
    vi.mocked(fetchComponents).mockResolvedValue([
      make("a", { components: ["b"], deps: ["pkg-a"] }),
      make("b", { components: ["c"], nuxtModules: ["mod-b"] }),
      make("c", { devDeps: ["dev-c"], askValidator: true }),
    ]);
    vi.mocked(loadConfigOrDefaults).mockResolvedValue({
      config: { ...DEFAULT_CONFIG_NUXT4, packageManager: "pnpm" },
      fromFile: true,
    });

    const plan = await captureJson(() =>
      runAddCommand(["a", "nope"], { dryRun: true, json: true, validator: "zod" })
    );

    expect(plan.components).toEqual(["a", "b", "c"]);
    expect(plan.notFound).toEqual(["nope"]);
    expect(plan.files.map((f: any) => f.path)).toEqual([
      "app/components/Ui/a.vue",
      "app/components/Ui/b.vue",
      "app/components/Ui/c.vue",
    ]);
    expect(plan.dependencies).toEqual(["pkg-a"]);
    expect(plan.devDependencies).toEqual(["dev-c"]);
    expect(plan.nuxtModules).toEqual(["mod-b"]);
    expect(plan.validator).toBe("zod");
    expect(plan.packageManager).toBe("pnpm");
    expect(getUIConfig).not.toHaveBeenCalled();
    expect(writeFile).not.toHaveBeenCalled();
    expect(installPackages).not.toHaveBeenCalled();
  });
});

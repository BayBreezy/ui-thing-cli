import { describe, expect, it } from "vitest";

import { resolveTargetPath, toAbsoluteInside } from "../../src/registry/paths";
import { DEFAULT_CONFIG, DEFAULT_CONFIG_NUXT4 } from "../../src/utils/constants";

describe("registry/paths resolveTargetPath", () => {
  it("maps nxui targets into the Nuxt 4 components folder and keeps nesting", () => {
    expect(
      resolveTargetPath(
        {
          path: "registry/new-york/fluid-glass/FluidGlass.vue",
          type: "registry:ui",
          target: "components/ui/fluid-glass/FluidGlass.vue",
        },
        DEFAULT_CONFIG_NUXT4
      )
    ).toBe("app/components/Ui/fluid-glass/FluidGlass.vue");
  });

  it("maps targets for Nuxt 3 layouts", () => {
    expect(
      resolveTargetPath(
        { path: "x.vue", type: "registry:ui", target: "components/ui/a/A.vue" },
        DEFAULT_CONFIG
      )
    ).toBe("components/Ui/a/A.vue");
  });

  it("places target-less components (vue-bits) by type", () => {
    expect(
      resolveTargetPath(
        { path: "HoloMosaic/HoloMosaic.vue", type: "registry:component" },
        DEFAULT_CONFIG_NUXT4
      )
    ).toBe("app/components/Ui/HoloMosaic/HoloMosaic.vue");
  });

  it("puts lib files under srcDir/lib so ~/lib/utils resolves", () => {
    expect(
      resolveTargetPath(
        { path: "utils.ts", type: "registry:lib", target: "lib/utils.ts" },
        DEFAULT_CONFIG_NUXT4
      )
    ).toBe("app/lib/utils.ts");
    expect(resolveTargetPath({ path: "utils.ts", type: "registry:lib" }, DEFAULT_CONFIG)).toBe(
      "lib/utils.ts"
    );
  });

  it("maps hooks and composables to composablesLocation", () => {
    expect(
      resolveTargetPath({ path: "useX.ts", type: "registry:composable" }, DEFAULT_CONFIG_NUXT4)
    ).toBe("app/composables/useX.ts");
  });

  it("treats ~/ targets as project root", () => {
    expect(
      resolveTargetPath(
        { path: "a", type: "registry:file", target: "~/server/api/x.ts" },
        DEFAULT_CONFIG_NUXT4
      )
    ).toBe("server/api/x.ts");
  });

  it("requires a target for pages and files", () => {
    expect(() =>
      resolveTargetPath({ path: "a.vue", type: "registry:page" }, DEFAULT_CONFIG)
    ).toThrow(/needs a "target"/);
  });

  it("rejects traversal and absolute targets", () => {
    for (const target of [
      "../../etc/passwd",
      "components/ui/../../../x",
      "/etc/passwd",
      "~/../x",
    ]) {
      expect(() =>
        resolveTargetPath({ path: "a", type: "registry:ui", target }, DEFAULT_CONFIG)
      ).toThrow();
    }
    expect(() =>
      resolveTargetPath({ path: "../evil.vue", type: "registry:ui" }, DEFAULT_CONFIG)
    ).toThrow();
  });

  it("toAbsoluteInside refuses paths outside cwd", () => {
    expect(() => toAbsoluteInside("/proj", "../x")).toThrow();
    expect(toAbsoluteInside("/proj", "a/b.vue")).toBe("/proj/a/b.vue");
  });
});

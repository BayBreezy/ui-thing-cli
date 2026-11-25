import { afterEach, describe, expect, it } from "vitest";

import { collectProjectInfo } from "../../src/commands/info";
import { makeProject } from "../helpers/tmp";

const cwd = process.cwd();

describe("commands/info", () => {
  let cleanup = () => {};
  afterEach(() => {
    process.chdir(cwd);
    cleanup();
  });

  it("reports an uninitialized project with defaults and warnings", async () => {
    const project = makeProject({
      "package.json": JSON.stringify({ dependencies: { nuxt: "^4.2.0" } }),
      "bun.lock": "",
      "node_modules/typescript/package.json": JSON.stringify({ version: "7.0.2" }),
    });
    cleanup = project.cleanup;
    process.chdir(project.dir);

    const info = await collectProjectInfo(project.dir);

    expect(info.initialized).toBe(false);
    expect(info.framework).toEqual({ name: "nuxt", version: "^4.2.0", major: 4 });
    expect(info.packageManager).toEqual({ configured: null, detected: "bun" });
    expect(info.paths.components).toBe("app/components/Ui");
    expect(info.warnings.join("\n")).toMatch(/not initialized/);
    expect(info.warnings.join("\n")).toMatch(/TypeScript 7\.0\.2.*typescript@\^6/);
    expect(info.registries["@vue-bits"]).toBe("https://vue-bits.dev/r/{name}.json");
  });

  it("reads config, installed components, registry items and nuxt modules", async () => {
    const project = makeProject({
      "package.json": JSON.stringify({ dependencies: { nuxt: "^4.2.0" } }),
      "ui-thing.config.ts": `export default ${JSON.stringify({
        theme: "zinc",
        tailwindCSSLocation: "app/assets/css/tailwind.css",
        componentsLocation: "app/components/Ui",
        composablesLocation: "app/composables",
        pluginsLocation: "app/plugins",
        utilsLocation: "app/utils",
        force: true,
        useDefaultFilename: true,
        packageManager: "pnpm",
        registries: { "@acme": "https://acme.dev/r/{name}.json" },
      })}`,
      "app/assets/css/tailwind.css": "",
      "app/components/Ui/Button.vue": "",
      "app/components/Ui/Card/Card.vue": "",
      "app/components/Ui/Apexchart.client.vue": "",
      "ui-thing.lock.json": JSON.stringify({
        items: {
          HoloMosaic: {
            source: "https://x/r/HoloMosaic.json",
            type: "registry:component",
            files: ["a.vue"],
            installedAt: "",
          },
        },
      }),
      "nuxt.config.ts": `export default defineNuxtConfig({ modules: ["@nuxt/icon", ["@nuxtjs/color-mode", {}]] });`,
    });
    cleanup = project.cleanup;
    process.chdir(project.dir);

    const info = await collectProjectInfo(project.dir);

    expect(info.initialized).toBe(true);
    expect(info.packageManager.configured).toBe("pnpm");
    expect(info.tailwind.exists).toBe(true);
    expect(info.installed.components).toEqual(["Apexchart", "Button", "Card"]);
    expect(info.installed.registryItems.map((i) => i.name)).toEqual(["HoloMosaic"]);
    expect(info.nuxtModules).toEqual(["@nuxt/icon", "@nuxtjs/color-mode"]);
    expect(info.registries["@acme"]).toBe("https://acme.dev/r/{name}.json");
    expect(info.warnings).toEqual([]);
  });
});

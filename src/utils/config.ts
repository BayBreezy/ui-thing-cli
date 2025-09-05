import { join } from "node:path";
import { loadConfig } from "c12";
import fse from "fs-extra";
import _ from "lodash";
import { loadFile, writeFile } from "magicast";
import { addNuxtModule } from "magicast/helpers";
import prompts from "prompts";

import { InitOptions, UIConfig } from "../types";
import { DEFAULT_CONFIG, DEFAULT_CONFIG_NUXT4, UI_CONFIG_FILENAME } from "./constants";
import { detectNuxtVersion } from "./detectNuxtVersion";
import { initPrompts } from "./uiConfigPrompt";

const currentDir = process.cwd();

/**
 * Creates or retrieves the UI Thing config.
 */
export const getUIConfig = async (options?: InitOptions): Promise<UIConfig> => {
  const configExists = fse.existsSync(UI_CONFIG_FILENAME);
  let uiConfig: UIConfig = {} as UIConfig;
  const nuxtVersion = Number(options?.nuxtVersion) || detectNuxtVersion();

  // Force creation or first-time setup
  if (!configExists || options?.force) {
    uiConfig = options?.yes
      ? nuxtVersion === 4
        ? DEFAULT_CONFIG_NUXT4
        : DEFAULT_CONFIG
      : await initPrompts(nuxtVersion);

    await fse.writeFile(UI_CONFIG_FILENAME, `export default ${JSON.stringify(uiConfig, null, 2)}`);

    // Handle pnpm special case
    if (uiConfig.packageManager === "pnpm") {
      const npmrcExists = fse.existsSync(".npmrc");
      let shouldWrite = true;

      if (npmrcExists) {
        const { confirmCreateNpmrc } = await prompts({
          type: "confirm",
          name: "confirmCreateNpmrc",
          message: "A .npmrc file already exists. Overwrite it?",
          initial: false,
        });
        shouldWrite = confirmCreateNpmrc;
      }

      if (shouldWrite) {
        await fse.writeFile(".npmrc", "shamefully-hoist=true\nstrict-peer-dependencies=false\n");
      }
    }
  } else {
    const data = await loadConfig<UIConfig>({
      configFile: UI_CONFIG_FILENAME.replace(".ts", ""),
    });
    uiConfig = data.config as UIConfig;
  }

  // Ensure valid config
  if (_.isEmpty(uiConfig)) return getUIConfig({ force: true });

  createConfigPaths(uiConfig);
  return uiConfig;
};

/**
 * Ensures all required paths exist for UI Thing.
 */
const createConfigPaths = (uiConfig: UIConfig) => {
  const ensureFileOrDir = (pathValue?: string, isDir = false) => {
    if (!pathValue) return;
    if (isDir) {
      fse.ensureDirSync(pathValue);
    } else {
      fse.ensureFileSync(pathValue);
    }
  };

  ensureFileOrDir(uiConfig.tailwindCSSLocation);
  ensureFileOrDir(uiConfig.pluginsLocation, true);
  ensureFileOrDir(uiConfig.componentsLocation, true);
  ensureFileOrDir(uiConfig.composablesLocation, true);
  ensureFileOrDir(uiConfig.utilsLocation, true);
};

/**
 * Adds one or multiple Nuxt modules to nuxt.config.ts safely.
 */
export const addModuleToConfig = async (modules: string[] | string) => {
  if (!modules) return;
  const modulesArray = typeof modules === "string" ? [modules] : modules;

  const proxy = await loadFile(join(currentDir, "nuxt.config.ts"));
  modulesArray.forEach((m) => addNuxtModule(proxy, m));
  await writeFile(proxy, join(currentDir, "nuxt.config.ts"));
};

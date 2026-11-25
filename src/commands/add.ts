import path from "node:path";
import { updateConfig } from "c12/update";
import { Command } from "commander";
import { consola } from "consola";
import kleur from "kleur";
import _ from "lodash";
import prompts from "prompts";

import { isRegistryRef } from "../registry/fetch";
import { installRegistryRefs } from "../registry/install";
import { AddCommand, Component, UIConfig } from "../types";
import { compareUIConfig } from "../utils/compareUIConfig";
import { addModuleToConfig, getUIConfig } from "../utils/config";
import { DEFAULT_CONFIG, DEFAULT_CONFIG_NUXT4, PACKAGE_MANAGER_CHOICES } from "../utils/constants";
import { detectNuxtVersion } from "../utils/detectNuxtVersion";
import { fetchComponents } from "../utils/fetchComponents";
import { installPackages } from "../utils/installPackages";
import { installValidator } from "../utils/installValidator";
import { logger } from "../utils/logger";
import { printFancyBoxMessage } from "../utils/printFancyBoxMessage";
import { promptUserForComponents } from "../utils/promptForComponents";
import { safeWriteFile } from "../utils/safeWriteFile";

let allComponents: Component[] = [];
const currentDirectory = process.cwd();

/**
 * Finds a component definition by its name (case-insensitive).
 */
const findComponent = (name: string) =>
  allComponents.find((c) => c.value.toLowerCase() === name.toLowerCase());

/**
 * Writes all files in a given category (utils, composables, plugins).
 */
async function writeCategoryFiles(
  category: string,
  items: Array<{ fileName: string; fileContent: string; dirPath?: string }>,
  baseDir: string,
  forceOverwrite: boolean
) {
  for (const item of items) {
    const targetPath = path.join(currentDirectory, baseDir, item.fileName);
    await safeWriteFile(
      targetPath,
      item.fileContent,
      forceOverwrite,
      `The ${category} file ${kleur.bold(item.fileName)} already exists. Overwrite?`
    );
  }
}

/**
 * Main command logic for adding components.
 */
export const runAddCommand = async (components: string[], options: AddCommand) => {
  // Step 1 — Load and verify UI config
  let uiConfig: UIConfig;

  if (options.skipConfig) {
    const nuxtVersion = detectNuxtVersion();
    const base = nuxtVersion === 4 ? DEFAULT_CONFIG_NUXT4 : DEFAULT_CONFIG;
    let pm: string = options.packageManager ?? "npm";
    if (!options.packageManager) {
      const { packageManager } = await prompts({
        type: "select",
        name: "packageManager",
        message: "Which package manager are you using?",
        choices: PACKAGE_MANAGER_CHOICES,
      });
      pm = packageManager ?? "npm";
    }
    uiConfig = { ...base, packageManager: pm };
  } else {
    uiConfig = await getUIConfig();
    if (!(await compareUIConfig())) {
      uiConfig = await getUIConfig({ force: true });
    }
    if (_.isEmpty(uiConfig)) {
      consola.error("Config file not set. Exiting...");
      process.exit(1);
    }
  }

  // Step 2 — Install registry items (URLs, @namespace/name, local .json files)
  const registryRefs = components.filter(isRegistryRef);
  const slugArgs = components.filter((c) => !isRegistryRef(c));
  let registryDeps: string[] = [];
  let registryDevDeps: string[] = [];
  let registryDocs: string[] = [];
  let registryConfirmed = false;

  if (registryRefs.length > 0) {
    try {
      const result = await installRegistryRefs(registryRefs, uiConfig, { yes: options.yes });
      if (!result.confirmed) process.exit(0);
      registryConfirmed = true;
      registryDeps = result.deps;
      registryDevDeps = result.devDeps;
      registryDocs = result.docs;
      // Plain-name registryDependencies are ui-thing components
      slugArgs.push(...result.bareDeps);
    } catch (error) {
      consola.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  }

  // Step 3 — Fetch the ui-thing catalog when it is needed
  let componentNames = slugArgs;
  if (components.length === 0 || slugArgs.length > 0) {
    allComponents = await fetchComponents();
  }

  // If no components were passed, prompt user to select them
  if (components.length === 0) {
    const response = await promptUserForComponents(options.all, allComponents);
    if (!response || response.length === 0) {
      consola.info("No components selected. Exiting...");
      process.exit(0);
    }
    componentNames = response;
  }

  // Step 4 — Validate component names
  const notFound = componentNames.filter((name) => !findComponent(name));
  if (notFound.length > 0) {
    consola.error(`Not found: ${kleur.bgRed(notFound.join(", "))}`);
  }

  // Step 5 — Collect found components and their dependencies
  const found: Component[] = componentNames
    .map((name) => findComponent(name))
    .filter(Boolean) as Component[];

  for (const comp of [...found]) {
    for (const dep of comp.components ?? []) {
      if (found.find((c) => c.value === dep)) continue;
      const depComponent = findComponent(dep);
      if (depComponent) found.push(depComponent);
      else consola.warn(`Dependency not found: ${kleur.yellow(dep)}`);
    }
  }

  // Step 6 — Write files for each component
  for (const component of found) {
    for (const file of component.files) {
      let dirPath = uiConfig.componentsLocation;
      let filePath = path.join(currentDirectory, dirPath, file.fileName);

      // Ask for custom location if not using default
      if (!uiConfig.useDefaultFilename) {
        const { value: newDir } = await prompts({
          type: "text",
          name: "value",
          message: `Where should we add the file ${kleur.cyan(file.fileName)}?`,
          initial: dirPath,
        });
        if (newDir) {
          dirPath = newDir;
          filePath = path.join(currentDirectory, dirPath, file.fileName);
        }
      }

      const fileWritten = await safeWriteFile(
        filePath,
        file.fileContent,
        uiConfig.force,
        `The file ${kleur.bold(file.fileName)} already exists. Overwrite?`
      );
      if (!fileWritten) continue;

      // Component-specific logic hooks
      if (component.value === "vue-sonner" || component.value === "sonner") await addSonner();

      // Write related files
      await writeCategoryFiles("utils", component.utils, uiConfig.utilsLocation, uiConfig.force);
      await writeCategoryFiles(
        "composables",
        component.composables,
        uiConfig.composablesLocation,
        uiConfig.force
      );
      await writeCategoryFiles(
        "plugins",
        component.plugins,
        uiConfig.pluginsLocation ?? "",
        uiConfig.force
      );
    }
  }

  // Step 7 — Add Nuxt modules
  const nuxtModules = _.uniq(found.flatMap((c) => c.nuxtModules || []));
  if (nuxtModules.length > 0 || registryRefs.length === 0) {
    await addModuleToConfig(nuxtModules);
  }

  // Step 8 — Install dependencies if necessary
  const deps = _.uniq([...found.flatMap((c) => c.deps || []), ...registryDeps]);
  const devDeps = _.uniq([...found.flatMap((c) => c.devDeps || []), ...registryDevDeps]);
  if (deps.length > 0 || devDeps.length > 0) {
    if (options.all || options.yes || registryConfirmed) {
      await installPackages(uiConfig.packageManager, deps, devDeps);
    } else {
      const { confirmInstall } = await prompts({
        type: "confirm",
        name: "confirmInstall",
        message: `Install packages: ${kleur.cyan([...deps, ...devDeps].join(", "))}?`,
        initial: true,
      });
      if (confirmInstall) {
        await installPackages(uiConfig.packageManager, deps, devDeps);
      }
    }
  }

  // Step 9 — Install validator if required
  if (found.some((c) => c.askValidator)) {
    await installValidator(uiConfig.packageManager);
  }

  // Step 10 — Success message & instructions
  printFancyBoxMessage(
    "All Done!",
    `Run the ${kleur.cyan("ui-thing@latest --help")} command to learn more.\n`,
    { box: { title: "Components Added" } }
  );

  found
    .filter((c) => c.docsPath)
    .forEach((c) => consola.info(`Docs: https://uithing.com${c.docsPath}`));

  registryDocs.forEach((doc) => consola.info(doc));

  const instructions = _.compact(found.flatMap((c) => c.instructions));
  if (instructions.length > 0) {
    logger.info("Instructions:");
    instructions.forEach((i) => logger.info(`- ${i}`));
  }
};

/**
 * CLI Command Registration
 */
export const add = new Command()
  .name("add")
  .command("add")
  .description("Add a list of components to your project.")
  .option("-a --all", "Add all components to your project.", false)
  .option(
    "--skip-config",
    "Add components without a ui-thing config file. Uses auto-detected Nuxt defaults."
  )
  .option("--package-manager <pm>", "Package manager to use when --skip-config is set.")
  .option("-y --yes", "Skip confirmation prompts.", false)
  .argument(
    "[componentNames...]",
    "Components to add. Accepts ui-thing names, registry URLs (https://.../r/item.json) or @namespace/item."
  )
  .action(runAddCommand);

/**
 * Component-specific setup helpers
 */
async function addSonner() {
  await updateConfig({
    configFile: "nuxt.config",
    cwd: currentDirectory,
    onUpdate(config: any) {
      config.imports ||= {};
      config.imports.imports ||= [];
      if (!config.imports.imports.find((i: any) => i.from === "vue-sonner" && i.name === "toast")) {
        config.imports.imports.push({ from: "vue-sonner", name: "toast", as: "useSonner" });
      }
    },
  });
}

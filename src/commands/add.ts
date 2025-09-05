import path from "node:path";
import { updateConfig } from "c12/update";
import { Command } from "commander";
import { consola } from "consola";
import kleur from "kleur";
import _ from "lodash";
import prompts from "prompts";

import { AddCommand, Component } from "../types";
import { compareUIConfig } from "../utils/compareUIConfig";
import { addModuleToConfig, getUIConfig } from "../utils/config";
import { fetchComponents } from "../utils/fetchComponents";
import { fileExists } from "../utils/fileExists";
import { installPackages } from "../utils/installPackages";
import { installValidator } from "../utils/installValidator";
import { printFancyBoxMessage } from "../utils/printFancyBoxMessage";
import { promptUserForComponents } from "../utils/promptForComponents";
import { writeFile } from "../utils/writeFile";

let allComponents: Component[] = [];
const currentDirectory = process.cwd();

/**
 * Finds a component definition by its name (case-insensitive).
 */
const findComponent = (name: string) =>
  allComponents.find((c) => c.value.toLowerCase() === name.toLowerCase());

/**
 * Handles writing a file with overwrite checks.
 */
async function safeWriteFile(
  targetPath: string,
  content: string,
  forceOverwrite: boolean,
  promptMessage: string
) {
  const exists = await fileExists(targetPath);

  if (exists && !forceOverwrite) {
    const { value: overwrite } = await prompts({
      type: "confirm",
      name: "value",
      message: promptMessage,
      initial: false,
    });
    if (!overwrite) {
      consola.info(`Skipped: ${kleur.cyan(path.basename(targetPath))}`);
      return false;
    }
  }

  await writeFile(targetPath, content);
  return true;
}

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
const runAddCommand = async (components: string[], options: AddCommand) => {
  // Step 1 — Load and verify UI config
  let uiConfig = await getUIConfig();
  if (!(await compareUIConfig())) {
    uiConfig = await getUIConfig({ force: true });
  }
  if (_.isEmpty(uiConfig)) {
    consola.info("Config file not set. Exiting...");
    process.exit(0);
  }

  // Step 2 — Fetch all available components
  allComponents = await fetchComponents();

  // Step 3 — If no components were passed, prompt user to select them
  let componentNames = components;
  if (componentNames.length === 0) {
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
    if (comp.components) {
      comp.components.forEach((dep) => {
        if (!found.find((c) => c.value === dep)) {
          found.push(findComponent(dep)!);
        }
      });
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
      if (component.value === "datatable") await addDataTable();

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
  await addModuleToConfig(_.uniq(found.flatMap((c) => c.nuxtModules || [])));

  // Step 8 — Install dependencies if necessary
  const deps = _.uniq(found.flatMap((c) => c.deps || []));
  const devDeps = _.uniq(found.flatMap((c) => c.devDeps || []));
  if (deps.length > 0 || devDeps.length > 0) {
    if (options.all) {
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

  const instructions = _.compact(found.flatMap((c) => c.instructions));
  if (instructions.length > 0) {
    console.log("");
    console.log(kleur.bgCyan(" Instructions "));
    instructions.forEach((i) => console.log(`${kleur.cyan("-")} ${i}`));
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
  .argument("[componentNames...]", "Components that you want to add.")
  .action(runAddCommand);

/**
 * Component-specific setup helpers
 */
async function addSonner() {
  await updateConfig({
    configFile: "nuxt.config",
    cwd: currentDirectory,
    onUpdate(config: any) {
      config.imports ||= { imports: [] };
      if (!config.imports.imports.find((i: any) => i.from === "vue-sonner" && i.name === "toast")) {
        config.imports.imports.push({ from: "vue-sonner", name: "toast", as: "useSonner" });
      }
    },
  });
}

async function addDataTable() {
  await updateConfig({
    configFile: "nuxt.config",
    cwd: currentDirectory,
    onUpdate(cfg: any) {
      cfg.app ||= { head: { script: [] } };
      const scripts = [
        "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.12/pdfmake.min.js",
        "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.12/vfs_fonts.min.js",
      ];
      scripts.forEach((src) => {
        if (!cfg.app.head.script.find((i: any) => i.src === src)) {
          cfg.app.head.script.push({ src, defer: true });
        }
      });
    },
  });
}

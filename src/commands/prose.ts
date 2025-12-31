import { spawnSync } from "node:child_process";
import path from "node:path";
import { Command } from "commander";
import { consola } from "consola";
import kleur from "kleur";
import _ from "lodash";
import prompts from "prompts";

import { AddCommand, ProseComponent, TemplateFile } from "../types";
import { compareUIConfig } from "../utils/compareUIConfig";
import { addModuleToConfig, getUIConfig } from "../utils/config";
import { fetchProseComponents } from "../utils/fetchProseComponents";
import { fileExists } from "../utils/fileExists";
import { installPackages } from "../utils/installPackages";
import { printFancyBoxMessage } from "../utils/printFancyBoxMessage";
import { promptUserForComponents } from "../utils/promptForComponents";
import { writeFile } from "../utils/writeFile";

let allProse: ProseComponent[] = [];
const currentDirectory = process.cwd();

const findProse = (name: string) =>
  allProse.find((c) => c.value.toLowerCase() === name.toLowerCase());

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

async function writeCategoryFiles(
  category: string,
  items: TemplateFile[] | undefined,
  baseDir: string,
  forceOverwrite: boolean
) {
  if (!items || items.length === 0) return;
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

const runProseCommand = async (components: string[], options: AddCommand) => {
  let uiConfig = await getUIConfig();
  if (!(await compareUIConfig())) {
    uiConfig = await getUIConfig({ force: true });
  }
  if (_.isEmpty(uiConfig)) {
    consola.info("Config file not set. Exiting...");
    process.exit(0);
  }

  allProse = await fetchProseComponents();

  let componentNames = components;
  if (componentNames.length === 0) {
    const response = await promptUserForComponents(options.all, allProse);
    if (!response || response.length === 0) {
      consola.info("No components selected. Exiting...");
      process.exit(0);
    }
    componentNames = response;
  }

  const notFound = componentNames.filter((name) => !findProse(name));
  if (notFound.length > 0) {
    consola.error(`Not found: ${kleur.bgRed(notFound.join(", "))}`);
  }

  const found: ProseComponent[] = componentNames
    .map((name) => findProse(name))
    .filter(Boolean) as ProseComponent[];

  // Handle prose dependencies
  for (const comp of [...found]) {
    if (comp.prose && comp.prose.length > 0) {
      comp.prose.forEach((proseName) => {
        if (!found.find((c) => c.value === proseName)) {
          const proseComp = findProse(proseName);
          if (proseComp) {
            found.push(proseComp);
          }
        }
      });
    }
  }

  for (const component of found) {
    const componentFile = component.file;
    let dirPath = uiConfig.componentsLocation;
    let filePath = path.join(currentDirectory, dirPath, componentFile.fileName);

    if (!uiConfig.useDefaultFilename) {
      const { value: newDir } = await prompts({
        type: "text",
        name: "value",
        message: `Where should we add the file ${kleur.cyan(componentFile.fileName)}?`,
        initial: dirPath,
      });
      if (newDir) {
        dirPath = newDir;
        filePath = path.join(currentDirectory, dirPath, componentFile.fileName);
      }
    }

    const fileWritten = await safeWriteFile(
      filePath,
      componentFile.fileContent,
      uiConfig.force,
      `The file ${kleur.bold(componentFile.fileName)} already exists. Overwrite?`
    );
    if (!fileWritten) continue;

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

  await addModuleToConfig(_.uniq(found.flatMap((c) => c.modules || [])));

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

  // Collect and add components via the add command
  const componentsToAdd = _.uniq(found.flatMap((c) => c.components || []));
  if (componentsToAdd.length > 0) {
    consola.info(`Adding ${componentsToAdd.length} component(s) required by prose...`);
    const result = spawnSync("npx", ["ui-thing@latest", "add", ...componentsToAdd], {
      cwd: currentDirectory,
      stdio: "inherit",
    });
    if (result.error) {
      consola.error("Failed to add components:", result.error.message);
    }
  }

  printFancyBoxMessage(
    "Prose added!",
    `Run the ${kleur.cyan("ui-thing@latest --help")} command to learn more.\n`,
    { box: { title: "Prose Components Added" } }
  );
};

export const prose = new Command()
  .name("prose")
  .command("prose")
  .description("Add prose components to your project.")
  .option("-a --all", "Add all prose components to your project.", false)
  .argument("[componentNames...]")
  .action(runProseCommand);

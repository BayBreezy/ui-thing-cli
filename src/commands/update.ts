import path from "node:path";
import { Command } from "commander";
import prompts from "prompts";

import { Component } from "../types";
import { getUIConfig } from "../utils/config";
import { fetchComponents } from "../utils/fetchComponents";
import { fileExists } from "../utils/fileExists";
import { logger } from "../utils/logger";
import { printFancyBoxMessage } from "../utils/printFancyBoxMessage";
import { writeFile } from "../utils/writeFile";

export const runUpdateCommand = async (componentNames: string[]) => {
  const uiConfig = await getUIConfig();
  const allComponents = await fetchComponents();
  const currentDirectory = process.cwd();

  let toUpdate = componentNames;

  if (toUpdate.length === 0) {
    const installed = (
      await Promise.all(
        allComponents.map(async (c) => {
          if (!c.files || c.files.length === 0) return null;
          const targetPath = path.join(
            currentDirectory,
            uiConfig.componentsLocation,
            c.files[0].fileName
          );
          return (await fileExists(targetPath)) ? c : null;
        })
      )
    ).filter(Boolean) as Component[];

    if (installed.length === 0) {
      logger.info("No installed components found.");
      return;
    }

    const { selected } = await prompts({
      type: "autocompleteMultiselect",
      name: "selected",
      message: "Select components to update",
      choices: installed.map((c) => ({ title: c.name, value: c.value })),
    });

    if (!selected || selected.length === 0) {
      logger.info("No components selected. Exiting...");
      process.exit(0);
    }
    toUpdate = selected;
  }

  const notFound = toUpdate.filter(
    (name) => !allComponents.find((c) => c.value.toLowerCase() === name.toLowerCase())
  );
  if (notFound.length > 0) {
    logger.warn(`Component(s) not found in registry: ${notFound.join(", ")}`);
  }

  const found = toUpdate
    .map((name) => allComponents.find((c) => c.value.toLowerCase() === name.toLowerCase()))
    .filter(Boolean) as Component[];

  for (const component of found) {
    for (const file of component.files) {
      const targetPath = path.join(currentDirectory, uiConfig.componentsLocation, file.fileName);
      await writeFile(targetPath, file.fileContent);
      logger.success(`Updated: ${file.fileName}`);
    }
  }

  printFancyBoxMessage("Updated!", undefined, { box: { title: "Components Updated" } });
};

export const update = new Command()
  .command("update")
  .name("update")
  .description("Re-fetch and overwrite installed components with the latest version.")
  .argument("[componentNames...]", "Components to update.")
  .action(runUpdateCommand);

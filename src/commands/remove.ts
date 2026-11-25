import fs from "node:fs/promises";
import path from "node:path";
import { Command } from "commander";
import prompts from "prompts";

import { readLock, removeFromLock } from "../registry/lock";
import { Component } from "../types";
import { getUIConfig } from "../utils/config";
import { fetchComponents } from "../utils/fetchComponents";
import { fileExists } from "../utils/fileExists";
import { logger } from "../utils/logger";
import { printFancyBoxMessage } from "../utils/printFancyBoxMessage";

export const runRemoveCommand = async (componentNames: string[]) => {
  const uiConfig = await getUIConfig();
  const allComponents = await fetchComponents();
  const currentDirectory = process.cwd();

  const lock = readLock(currentDirectory);
  let toRemove = componentNames;

  if (toRemove.length === 0) {
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

    const registryChoices = Object.keys(lock.items).map((name) => ({
      title: `${name} (registry)`,
      value: name,
    }));

    if (installed.length === 0 && registryChoices.length === 0) {
      logger.info("No installed components found.");
      return;
    }

    const { selected } = await prompts({
      type: "autocompleteMultiselect",
      name: "selected",
      message: "Select components to remove",
      choices: [...installed.map((c) => ({ title: c.name, value: c.value })), ...registryChoices],
    });

    if (!selected || selected.length === 0) {
      logger.info("No components selected. Exiting...");
      process.exit(0);
    }
    toRemove = selected;
  }

  // Registry items: delete exactly the files recorded in the lockfile.
  const registryNames = toRemove.filter((name) => lock.items[name]);
  toRemove = toRemove.filter((name) => !lock.items[name]);

  const found = toRemove
    .map((name) => allComponents.find((c) => c.value.toLowerCase() === name.toLowerCase()))
    .filter(Boolean) as Component[];

  if (found.length === 0 && registryNames.length === 0) {
    logger.error("None of the specified components were found in the registry.");
    process.exit(1);
  }

  const result = await prompts({
    type: "confirm",
    name: "confirmed",
    message: `Remove ${[...found.map((c) => c.name), ...registryNames].join(", ")}?`,
    initial: false,
  });

  if (!result?.confirmed) {
    logger.info("Cancelled.");
    return;
  }

  for (const component of found) {
    const allFiles = [
      ...component.files.map((f) =>
        path.join(currentDirectory, uiConfig.componentsLocation, f.fileName)
      ),
      ...component.utils.map((f) =>
        path.join(currentDirectory, uiConfig.utilsLocation, f.fileName)
      ),
      ...(component.composables ?? []).map((f) =>
        path.join(currentDirectory, uiConfig.composablesLocation, f.fileName)
      ),
    ];

    for (const filePath of allFiles) {
      const exists = await fileExists(filePath);
      if (!exists) {
        logger.warn(`Skipped (not found): ${path.basename(filePath)}`);
        continue;
      }
      await fs.unlink(filePath);
      logger.success(`Removed: ${path.basename(filePath)}`);
    }
  }

  for (const name of registryNames) {
    for (const rel of lock.items[name].files) {
      const filePath = path.resolve(currentDirectory, rel);
      // Never delete outside the project, even if the lockfile was edited.
      if (path.relative(currentDirectory, filePath).startsWith("..")) continue;
      if (!(await fileExists(filePath))) {
        logger.warn(`Skipped (not found): ${rel}`);
        continue;
      }
      await fs.unlink(filePath);
      logger.success(`Removed: ${rel}`);
      // Tidy up folders left empty by the removal (e.g. nested registry folders).
      let dir = path.dirname(filePath);
      while (dir !== currentDirectory && (await fs.readdir(dir)).length === 0) {
        await fs.rmdir(dir);
        dir = path.dirname(dir);
      }
    }
  }
  removeFromLock(registryNames, currentDirectory);

  printFancyBoxMessage("Removed!", undefined, { box: { title: "Components Removed" } });
};

export const remove = new Command()
  .command("remove")
  .name("remove")
  .description(
    "Remove installed components from your project.\nNote: shared utility files used by multiple components are deleted — other components depending on them may break."
  )
  .argument("[componentNames...]", "Components to remove.")
  .action(runRemoveCommand);

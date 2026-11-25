import path from "node:path";
import { Command } from "commander";

import { readLock } from "../registry/lock";
import { Component } from "../types";
import { getUIConfig } from "../utils/config";
import { fetchComponents } from "../utils/fetchComponents";
import { fileExists } from "../utils/fileExists";
import { logger } from "../utils/logger";

type ListOptions = { installed: boolean };

export const runListCommand = async (options: ListOptions) => {
  const uiConfig = await getUIConfig();
  const components = await fetchComponents();
  const currentDirectory = process.cwd();

  let display: Component[] = components;

  if (options.installed) {
    const results = await Promise.all(
      components.map(async (c) => {
        if (!c.files || c.files.length === 0) return false;
        const targetPath = path.join(
          currentDirectory,
          uiConfig.componentsLocation,
          c.files[0].fileName
        );
        return fileExists(targetPath);
      })
    );
    display = components.filter((_, i) => results[i]);
  }

  const registryItems = options.installed ? Object.entries(readLock(currentDirectory).items) : [];

  if (display.length === 0 && registryItems.length === 0) {
    logger.info(options.installed ? "No components installed." : "No components available.");
    return;
  }

  display.forEach((c) => logger.log(`${c.name} (${c.value})`));
  registryItems.forEach(([name, entry]) => logger.log(`${name} (registry: ${entry.source})`));
  logger.success(`${display.length + registryItems.length} component(s) found.`);
};

export const list = new Command()
  .command("list")
  .name("list")
  .description("List available or installed components.")
  .option("-i --installed", "Only show installed components.", false)
  .action(runListCommand);

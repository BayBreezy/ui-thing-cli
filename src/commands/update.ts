import path from "node:path";
import { Command } from "commander";
import kleur from "kleur";
import prompts from "prompts";

import { installRegistryRefs } from "../registry/install";
import { readLock } from "../registry/lock";
import { Component } from "../types";
import { computeChanges, summarize } from "../utils/changes";
import { getUIConfig, loadConfigOrDefaults } from "../utils/config";
import { fetchComponents } from "../utils/fetchComponents";
import { fileExists } from "../utils/fileExists";
import { logger } from "../utils/logger";
import { printFancyBoxMessage } from "../utils/printFancyBoxMessage";
import { printJson } from "../utils/printJson";
import { writeFile } from "../utils/writeFile";

type UpdateOptions = { dryRun?: boolean; json?: boolean };

/**
 * `update --dry-run`: what would change, without writing anything.
 */
const previewUpdate = async (names: string[], options: UpdateOptions) => {
  const { config } = await loadConfigOrDefaults();
  const { items, missing } = await computeChanges(names, config, await fetchComponents());
  if (options.json) return printJson({ items, missing, summary: summarize(items) });

  if (missing.length > 0) logger.warn(`Not installed or unknown: ${missing.join(", ")}`);
  for (const item of items) {
    for (const file of item.files.filter((f) => f.status !== "unchanged")) {
      const label = file.status === "missing" ? "would create" : "would overwrite";
      logger.log(`${label.padEnd(16)} ${file.path} ${kleur.dim(`(${item.name})`)}`);
    }
  }
  const s = summarize(items);
  logger.info(
    s.itemsWithChanges === 0
      ? "Everything matches upstream. Nothing to update."
      : `${s.modified} file(s) would be overwritten and ${s.missing} created. Run \`ui-thing diff\` to see the changes.`
  );
};

export const runUpdateCommand = async (componentNames: string[], options: UpdateOptions = {}) => {
  if (options.dryRun || options.json) return previewUpdate(componentNames, options);

  const uiConfig = await getUIConfig();
  const allComponents = await fetchComponents();
  const currentDirectory = process.cwd();

  const lock = readLock(currentDirectory);
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
      message: "Select components to update",
      choices: [...installed.map((c) => ({ title: c.name, value: c.value })), ...registryChoices],
    });

    if (!selected || selected.length === 0) {
      logger.info("No components selected. Exiting...");
      process.exit(0);
    }
    toUpdate = selected;
  }

  // Items installed from a registry are re-fetched from the source recorded in the lockfile.
  const registryNames = toUpdate.filter((name) => lock.items[name]);
  if (registryNames.length > 0) {
    try {
      await installRegistryRefs(
        registryNames.map((name) => lock.items[name].source),
        uiConfig,
        { yes: true, overwrite: true }
      );
      registryNames.forEach((name) => logger.success(`Updated: ${name}`));
    } catch (error) {
      logger.error(error instanceof Error ? error.message : String(error));
    }
    toUpdate = toUpdate.filter((name) => !lock.items[name]);
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
  .option("--dry-run", "Show which files would change without writing anything")
  .option("--json", "With --dry-run: print machine-readable JSON")
  .action(runUpdateCommand);

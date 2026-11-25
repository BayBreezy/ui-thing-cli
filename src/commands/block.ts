import path from "node:path";
import { Command } from "commander";
import { consola } from "consola";
import kleur from "kleur";
import _ from "lodash";
import prompts from "prompts";

import { BlockComponent, UIConfig } from "../types";
import { blockId, extractPackageImports, findBlocks, missingPackages } from "../utils/blockHelpers";
import { compareUIConfig } from "../utils/compareUIConfig";
import { getUIConfig } from "../utils/config";
import { fetchBlockCategories } from "../utils/fetchBlockCategories";
import { fetchBlocks } from "../utils/fetchBlocks";
import { describeInstallError, installPackages } from "../utils/installPackages";
import { logger } from "../utils/logger";
import { printFancyBoxMessage } from "../utils/printFancyBoxMessage";
import { safeWriteFile } from "../utils/safeWriteFile";
import { runAddCommand } from "./add";

type BlockOptions = {
  category?: string;
  list?: boolean;
  json?: boolean;
  dir?: string;
  yes?: boolean;
};

/**
 * Default blocks directory based on the Nuxt layout in the config.
 */
function getDefaultBlocksDir(uiConfig: UIConfig): string {
  const isNuxt4 = uiConfig.componentsLocation?.startsWith("app/");
  return isNuxt4 ? "app/components/Blocks" : "components/Blocks";
}

const pascal = (segment: string) =>
  segment
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join("");

/**
 * The tag Nuxt registers for a block written under a `components/` folder
 * (`app/components/Blocks/Hero/BlockHero1.vue` → `BlocksHeroBlockHero1`).
 * Returns undefined when the folder is not inside `components/`.
 */
export const nuxtComponentName = (blocksDir: string, block: BlockComponent) => {
  const dir = blocksDir.replace(/\\/g, "/");
  const marker = dir.lastIndexOf("components");
  if (marker === -1) return undefined;
  const prefix = dir
    .slice(marker + "components".length)
    .split("/")
    .filter(Boolean);
  const folders = path.posix
    .dirname(block.path)
    .split("/")
    .filter((p) => p && p !== ".");
  const file = block.fileName.replace(/\.vue$/, "").replace(/\.client$/, "");
  return [...prefix, ...folders].map(pascal).join("") + file;
};

const inCategory = (blocks: BlockComponent[], category?: string) =>
  category && category.toLowerCase() !== "all"
    ? blocks.filter((b) => b.category.toLowerCase() === category.toLowerCase())
    : blocks;

/**
 * `block --list` / `block --json`: browse the catalog without prompts or a config file.
 */
const listBlocks = async (options: BlockOptions) => {
  const blocks = inCategory(await fetchBlocks(), options.category);

  if (options.json) {
    const items = blocks.map((b) => ({
      id: blockId(b),
      name: b.name,
      category: b.category,
      description: b.description ?? "",
      components: b.components ?? [],
    }));
    console.log(JSON.stringify(items, null, 2));
    return;
  }

  if (blocks.length === 0) {
    logger.warn(`No blocks found for category "${options.category}".`);
    return;
  }

  if (!options.category) {
    const counts = _.countBy(blocks, "category");
    Object.keys(counts)
      .sort()
      .forEach((category) =>
        logger.log(`${kleur.cyan(category)} ${kleur.dim(`(${counts[category]})`)}`)
      );
    logger.info(
      `${blocks.length} blocks in ${Object.keys(counts).length} categories. List one with: ui-thing block --list --category <name>`
    );
    return;
  }

  for (const b of blocks) {
    const desc = b.description ? kleur.dim(` - ${b.description.split(".")[0].slice(0, 90)}`) : "";
    logger.log(`${kleur.cyan(blockId(b))}${desc}`);
  }
  logger.info(`Add with: ui-thing block ${blockId(blocks[0])} --yes`);
};

/**
 * Interactive selection: category, then blocks.
 */
const pickBlocks = async (allBlocks: BlockComponent[], options: BlockOptions) => {
  let selectedCategory = options.category;
  if (!selectedCategory) {
    const categories = await fetchBlockCategories();
    if (categories?.length) {
      const { category } = await prompts({
        type: "select",
        name: "category",
        message: "Choose a block category",
        choices: [
          { title: "All", value: "all" },
          ...categories.map((c) => ({ title: c, value: c })),
        ],
        initial: 0,
      });
      selectedCategory = category;
    }
  }

  let blocksToSelect = inCategory(allBlocks, selectedCategory);
  if (blocksToSelect.length === 0) {
    consola.warn(
      `No blocks found for category ${kleur.cyan(String(selectedCategory))}. Falling back to all.`
    );
    blocksToSelect = allBlocks;
  }

  const { selectedBlocks } = await prompts({
    type: "autocompleteMultiselect",
    name: "selectedBlocks",
    message: "Select the blocks you want to add",
    choices: blocksToSelect.map((b) => ({ title: b.name, value: b })),
  });
  return (selectedBlocks ?? []) as BlockComponent[];
};

export const runBlockCommand = async (names: string[], options: BlockOptions) => {
  if (options.list || options.json) return listBlocks(options);

  if (options.yes && names.length === 0) {
    consola.error(
      "Pass the blocks to add when using --yes, for example: ui-thing block BlockHero1 --yes. Find names with: ui-thing block --list"
    );
    process.exit(1);
  }

  let uiConfig = await getUIConfig();
  if (!(await compareUIConfig())) {
    uiConfig = await getUIConfig({ force: true });
  }
  if (_.isEmpty(uiConfig)) {
    consola.error("Config file not set. Exiting...");
    process.exit(1);
  }

  const allBlocks = await fetchBlocks();

  // Step 1: Which blocks
  let found: BlockComponent[];
  if (names.length > 0) {
    const result = findBlocks(names, allBlocks);
    if (result.missing.length > 0) {
      consola.error(
        `Block(s) not found: ${kleur.red(result.missing.join(", "))}. Find names with: ui-thing block --list`
      );
      process.exit(1);
    }
    found = result.found;
  } else {
    found = await pickBlocks(allBlocks, options);
  }

  if (found.length === 0) {
    consola.info("No blocks selected. Exiting...");
    process.exit(0);
  }

  // Step 2: Where
  const defaultBlocksDir = getDefaultBlocksDir(uiConfig);
  let blocksDirPath = options.dir ?? defaultBlocksDir;
  if (!options.dir && !options.yes) {
    const { blocksDir } = await prompts({
      type: "text",
      name: "blocksDir",
      message: "Where should we add the blocks?",
      initial: defaultBlocksDir,
    });
    blocksDirPath = blocksDir || defaultBlocksDir;
  }

  // Step 3: Write block files
  const cwd = process.cwd();
  const written: string[] = [];
  for (const block of found) {
    const relPath = path.join(blocksDirPath, block.path);
    const ok = await safeWriteFile(
      path.join(cwd, relPath),
      block.file,
      uiConfig.force,
      `The block file ${kleur.bold(block.fileName)} already exists. Overwrite?`,
      !options.yes
    );
    if (ok) written.push(relPath);
  }

  // Step 4: UI Thing components the blocks use (installed in-process, same CLI version)
  const componentsToAdd = _.uniq(found.flatMap((b) => b.components ?? []));
  if (componentsToAdd.length > 0) {
    consola.info(`Adding ${componentsToAdd.length} component(s) used by the blocks...`);
    await runAddCommand(componentsToAdd, { yes: options.yes });
  }

  // Step 5: npm packages the blocks import directly (gsap, dayjs, @faker-js/faker, ...)
  const packages = missingPackages(_.uniq(found.flatMap((b) => extractPackageImports(b.file))));
  if (packages.length > 0) {
    let install = Boolean(options.yes);
    if (!install) {
      const { confirmInstall } = await prompts({
        type: "confirm",
        name: "confirmInstall",
        message: `The blocks import ${kleur.cyan(packages.join(", "))}. Install them?`,
        initial: true,
      });
      install = Boolean(confirmInstall);
    }
    if (install) {
      try {
        await installPackages(uiConfig.packageManager, packages);
      } catch (error) {
        consola.error(
          `Installing packages failed:\n${describeInstallError(error)}\nInstall them yourself: ${packages.join(" ")}`
        );
        process.exitCode = 1;
      }
    } else {
      consola.warn(`Install these packages before using the blocks: ${packages.join(", ")}`);
    }
  }

  const tags = found
    .map((b) => nuxtComponentName(blocksDirPath, b))
    .filter(Boolean)
    .map((name) => `<${name} />`);
  printFancyBoxMessage(
    "Blocks added!",
    `${written.map((f) => `• ${f}`).join("\n")}${
      tags.length ? `\n\nUse them as: ${tags.join(", ")}` : ""
    }\n\nReplace the placeholder content before shipping.`,
    { box: { title: "Blocks Added" } }
  );
};

export const block = new Command()
  .name("block")
  .command("block")
  .description("Add UI Thing blocks to your project.")
  .argument(
    "[blockNames...]",
    "Blocks to add, for example BlockHero1 or 'Hero 1'. Omit to pick interactively."
  )
  .option("-c --category <category>", "Filter blocks by category")
  .option("-l --list", "List block categories, or the blocks in --category, and exit")
  .option("--json", "Print the block catalog (or one --category) as JSON and exit")
  .option("-d --dir <path>", "Folder to write the blocks to (default: app/components/Blocks)")
  .option(
    "-y --yes",
    "Skip all prompts: use the default folder, skip existing files, install components and packages"
  )
  .action(runBlockCommand);

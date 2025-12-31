import { spawnSync } from "node:child_process";
import path from "node:path";
import { Command } from "commander";
import { consola } from "consola";
import kleur from "kleur";
import _ from "lodash";
import prompts from "prompts";

import { AddCommand, BlockComponent } from "../types";
import { compareUIConfig } from "../utils/compareUIConfig";
import { getUIConfig } from "../utils/config";
import { fetchBlockCategories } from "../utils/fetchBlockCategories";
import { fetchBlocks } from "../utils/fetchBlocks";
import { fileExists } from "../utils/fileExists";
import { printFancyBoxMessage } from "../utils/printFancyBoxMessage";
import { writeFile } from "../utils/writeFile";

type BlockOptions = AddCommand & { category?: string };

let allBlocks: BlockComponent[] = [];
const currentDirectory = process.cwd();

/**
 * Get the default blocks directory based on Nuxt version from config
 */
function getDefaultBlocksDir(uiConfig: any): string {
  const isNuxt4 = uiConfig.componentsLocation?.startsWith("app/");
  return isNuxt4 ? "app/components/Blocks" : "components/Blocks";
}

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

const runBlockCommand = async (components: string[], options: BlockOptions) => {
  let uiConfig = await getUIConfig();
  if (!(await compareUIConfig())) {
    uiConfig = await getUIConfig({ force: true });
  }
  if (_.isEmpty(uiConfig)) {
    consola.info("Config file not set. Exiting...");
    process.exit(0);
  }

  // Step 1: Fetch categories
  const categories = await fetchBlockCategories();

  // Step 2: Ask user to select category
  let selectedCategory = options.category;
  if (!selectedCategory && categories?.length) {
    const { category } = await prompts({
      type: "select",
      name: "category",
      message: "Choose a block category",
      choices: [{ title: "All", value: "all" }, ...categories.map((c) => ({ title: c, value: c }))],
      initial: 0,
    });
    selectedCategory = category;
  }

  // Step 3: Fetch all blocks
  allBlocks = await fetchBlocks();

  // Step 4: Filter blocks by category if not "all"
  let blocksToSelect = allBlocks;
  if (selectedCategory && selectedCategory !== "all") {
    blocksToSelect = allBlocks.filter((b) => b.category === selectedCategory);
    if (blocksToSelect.length === 0) {
      consola.warn(
        `No blocks found for category ${kleur.cyan(selectedCategory)}. Falling back to all.`
      );
      blocksToSelect = allBlocks;
    }
  }

  // Step 5: Let user select blocks via autocomplete multi-select
  const { selectedBlocks } = await prompts({
    type: "autocompleteMultiselect",
    name: "selectedBlocks",
    message: "Select the blocks you want to add",
    choices: blocksToSelect.map((b) => ({ title: b.name, value: b })),
  });

  if (!selectedBlocks || selectedBlocks.length === 0) {
    consola.info("No blocks selected. Exiting...");
    process.exit(0);
  }

  const found: BlockComponent[] = selectedBlocks;

  // Step 6: Ask user where to add blocks (with default based on Nuxt version)
  const defaultBlocksDir = getDefaultBlocksDir(uiConfig);
  const { blocksDir } = await prompts({
    type: "text",
    name: "blocksDir",
    message: "Where should we add the blocks?",
    initial: defaultBlocksDir,
  });

  const blocksDirPath = blocksDir || defaultBlocksDir;

  // Step 7: Write block files
  for (const block of found) {
    // Create full path: blocksDirPath + block.path + block.fileName
    const fullPath = path.join(blocksDirPath, block.path);
    const targetPath = path.join(currentDirectory, fullPath);

    const fileWritten = await safeWriteFile(
      targetPath,
      block.file,
      uiConfig.force,
      `The block file ${kleur.bold(block.fileName)} already exists. Overwrite?`
    );

    if (!fileWritten) continue;
  }

  // Step 8: Handle components if present
  const componentsToAdd = _.uniq(found.flatMap((b) => b.components || []));
  if (componentsToAdd.length > 0) {
    consola.info(`Adding ${componentsToAdd.length} component(s) required by blocks...`);
    const result = spawnSync("npx", ["ui-thing@latest", "add", ...componentsToAdd], {
      cwd: currentDirectory,
      stdio: "inherit",
    });
    if (result.error) {
      consola.error("Failed to add components:", result.error.message);
    }
  }

  // Step 9: Success message
  printFancyBoxMessage(
    "Blocks added!",
    `Run the ${kleur.cyan("ui-thing@latest --help")} command to learn more.\n`,
    { box: { title: "Blocks Added" } }
  );
};

export const block = new Command()
  .name("block")
  .command("block")
  .description("Add UI Thing blocks to your project.")
  .option("-c --category <category>", "Filter blocks by category before selection")
  .action(runBlockCommand);

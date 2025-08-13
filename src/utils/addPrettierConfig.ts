import { join } from "node:path";
import { $ } from "execa";
import fse from "fs-extra";
import ora from "ora";
import prompts from "prompts";

import { PRETTIER_CONFIG } from "../templates/prettier";

/**
 * Adds or merges a Prettier configuration into the project.
 *
 * - If `.prettierrc` doesn't exist, creates it with `PRETTIER_CONFIG`.
 * - If it exists, merges keys instead of overwriting, unless user chooses overwrite.
 *
 * @param cwd - The working directory of the project.
 * @param format - Whether to run `prettier --write .` after adding/merging.
 */
export const addPrettierConfig = async (cwd = process.cwd(), format: boolean = true) => {
  const prettierLocation = join(cwd, ".prettierrc");
  let finalConfig = PRETTIER_CONFIG;

  if (fse.existsSync(prettierLocation)) {
    // Read existing config
    const existingRaw = await fse.readFile(prettierLocation, "utf-8");
    let existingConfig: Record<string, any> = {};

    try {
      existingConfig = JSON.parse(existingRaw);
    } catch {
      console.warn("⚠️ Existing .prettierrc is not valid JSON — will prompt for overwrite.");
    }

    const res = await prompts({
      name: "merge",
      type: "select",
      message: "A prettier config file already exists. What would you like to do?",
      choices: [
        { title: "Merge configs", value: "merge" },
        { title: "Overwrite with new config", value: "overwrite" },
        { title: "Cancel", value: "cancel" },
      ],
      initial: 0,
    });

    if (res.merge === "merge") {
      // Merge existing config with PRETTIER_CONFIG
      finalConfig = {
        ...existingConfig,
        ...PRETTIER_CONFIG,
      };
    } else if (res.merge === "overwrite") {
      finalConfig = PRETTIER_CONFIG;
    } else {
      return false; // Cancelled
    }
  }

  // Save merged or new config
  await fse.writeFile(prettierLocation, JSON.stringify(finalConfig, null, 2), "utf-8");

  if (!format) return true;

  // Format project files
  const spinner = ora("Formatting files with prettier...").start();
  await $`npx prettier --write .`;
  spinner.succeed("Files formatted with prettier");

  return true;
};

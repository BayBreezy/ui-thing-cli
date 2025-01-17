import { join } from "node:path";
import { $ } from "execa";
import fse from "fs-extra";
import ora from "ora";
import prompts from "prompts";

import { PRETTIER_CONFIG } from "../templates/prettier";

export const addPrettierConfig = async (cwd = process.cwd(), format: boolean = true) => {
  const prettierLocation = join(cwd, ".prettierrc");
  if (fse.existsSync(prettierLocation)) {
    const res = await prompts({
      name: "overwrite",
      type: "confirm",
      message: "A prettier config file already exists. Overwrite?",
      initial: true,
    });
    if (!res.overwrite) return false;
  }
  await fse.writeFile(prettierLocation, PRETTIER_CONFIG, "utf-8");
  if (!format) return true;
  const spinner = ora("Formatting files with prettier...").start();
  await $`npx prettier --write .`;
  spinner.succeed("Files formatted with prettier");
  return true;
};

import { join } from "node:path";
import fse from "fs-extra";

import { DEFINE_SHORTCUT } from "../templates/shortcuts";
import { loadConfigOrDefaults } from "./config";

/**
 * Adds shortcut files to the specified directory.
 */
export const addShortcutFiles = async (cwd = process.cwd()) => {
  // Read the config (or defaults) without prompting.
  const { config: userConfig } = await loadConfigOrDefaults();
  const composablesLocation = join(cwd, userConfig.composablesLocation);
  // ensure that the composable folder exists
  await fse.ensureDir(composablesLocation);
  // write the defineShortcuts composable
  await fse.writeFile(join(composablesLocation, "shortcuts.ts"), DEFINE_SHORTCUT, "utf-8");
  return join(userConfig.composablesLocation, "shortcuts.ts");
};

import { join } from "node:path";
import fse from "fs-extra";

import { DEFINE_SHORTCUT } from "../templates/shortcuts";
import { UIConfig } from "../types";
import { getUIConfig } from "./config";

/**
 * Adds shortcut files to the specified directory.
 */
export const addShortcutFiles = async (cwd = process.cwd()) => {
  // get config
  let userConfig: UIConfig = await getUIConfig();
  const composablesLocation = join(cwd, userConfig.composablesLocation);
  // ensure that the composable folder exists
  await fse.ensureDir(composablesLocation);
  // write the defineShortcuts composable
  await fse.writeFile(join(composablesLocation, "shortcuts.ts"), DEFINE_SHORTCUT, "utf-8");
};

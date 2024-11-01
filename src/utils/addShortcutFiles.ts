import { join } from "node:path";
import fse from "fs-extra";

import { DEFINE_SHORTCUT, USE_SHORTCUTS } from "../templates/shortcuts";
import { UIConfig } from "../types";
import { getUIConfig } from "./config";

export const addShortcutFiles = async (cwd = process.cwd()) => {
  // get config
  let userConfig: UIConfig = await getUIConfig();
  const composablesLocation = join(cwd, userConfig.composablesLocation);
  // ensure that the composable folder exists
  await fse.ensureDir(composablesLocation);
  // write the defineShortcuts composable
  await fse.writeFile(join(composablesLocation, "defineShortcuts.ts"), DEFINE_SHORTCUT, "utf-8");
  // write the useShortcuts composable
  await fse.writeFile(join(composablesLocation, "useShortcuts.ts"), USE_SHORTCUTS, "utf-8");
};

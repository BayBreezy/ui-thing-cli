import fse from "fs-extra";

import { DEFINE_SHORTCUT, USE_SHORTCUTS } from "../templates/shortcuts";

export const addShortcutFiles = async (cwd = process.cwd()) => {
  // ensure that the composable folder exists
  await fse.ensureDir(`${cwd}/composables`);
  // write the defineShortcuts composable
  await fse.writeFile(`${cwd}/composables/defineShortcuts.ts`, DEFINE_SHORTCUT, "utf-8");
  // write the useShortcuts composable
  await fse.writeFile(`${cwd}/composables/useShortcuts.ts`, USE_SHORTCUTS, "utf-8");
};

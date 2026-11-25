import fs from "node:fs";
import path from "node:path";
import { Command } from "commander";
import { consola } from "consola";

import { addShortcutFiles } from "../utils/addShortcutFiles";
import { addModuleToConfig, loadConfigOrDefaults } from "../utils/config";
import { describeInstallError, installPackages } from "../utils/installPackages";
import { printFancyBoxMessage } from "../utils/printFancyBoxMessage";

const hasDependency = (name: string, cwd = process.cwd()) => {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(cwd, "package.json"), "utf-8"));
    return Boolean(pkg.dependencies?.[name] ?? pkg.devDependencies?.[name]);
  } catch {
    return false;
  }
};

/**
 * Adds the shortcuts composables to the project. Never prompts: the package manager comes
 * from the config or the lockfile, and the VueUse Nuxt module is only installed if missing.
 */
export const addShortcuts = new Command()
  .command("shortcuts")
  .name("shortcuts")
  .description("Add the shortcuts composables to your project.")
  .option("-y --yes", "Accepted for consistency; this command never prompts", false)
  .option("--package-manager <pm>", "Package manager to use (default: from config or lockfile)")
  .action(async (options: { packageManager?: string }) => {
    const { config } = await loadConfigOrDefaults();
    const pm = options.packageManager ?? config.packageManager;
    const file = await addShortcutFiles();

    try {
      if (!hasDependency("@vueuse/nuxt")) await installPackages(pm, ["@vueuse/nuxt"]);
      if (fs.existsSync(path.join(process.cwd(), "nuxt.config.ts"))) {
        await addModuleToConfig(["@vueuse/nuxt"]);
      } else {
        consola.warn('Add "@vueuse/nuxt" to the modules in your nuxt.config.');
      }
    } catch (error) {
      consola.error(
        `Installing @vueuse/nuxt failed:\n${describeInstallError(error)}\nInstall it yourself and add it to nuxt.config modules.`
      );
      process.exitCode = 1;
    }

    printFancyBoxMessage("All Done!", `Added ${file} with defineShortcuts and useKbd.`, {
      box: { title: "Composable Added" },
    });
  });

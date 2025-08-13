import { Command } from "commander";
import prompts from "prompts";

import { addShortcutFiles } from "../utils/addShortcutFiles";
import { addModuleToConfig, getNuxtConfig, updateConfig } from "../utils/config";
import { PACKAGE_MANAGER_CHOICES } from "../utils/constants";
import { installPackages } from "../utils/installPackages";
import { printFancyBoxMessage } from "../utils/printFancyBoxMessage";

export const addShortcuts = new Command()
  .command("shortcuts")
  .name("shortcuts")
  .description("Add the defineShortcuts & useShortcuts composables to your project.")
  .action(async () => {
    await addShortcutFiles();

    // Get nuxt config
    const cfg = await getNuxtConfig();
    addModuleToConfig(cfg.nuxtConfig, ["@vueuse/nuxt"]);
    // Write changes to nuxt config
    await updateConfig(cfg.nuxtConfig, "nuxt.config.ts");

    const { pkgManager } = await prompts({
      name: "pkgManager",
      type: "select",
      message: "Which package manager are you using?",
      choices: PACKAGE_MANAGER_CHOICES,
    });
    if (!pkgManager) return process.exit(0);

    // install prettier dep
    await installPackages(pkgManager, undefined, ["@vueuse/math", "@vueuse/nuxt"]);
    printFancyBoxMessage(
      "All Done!",
      `Check the composables folder for the defineShortcuts & useShortcuts composables.`,
      { box: { title: "Shortcuts Added" } }
    );
  });

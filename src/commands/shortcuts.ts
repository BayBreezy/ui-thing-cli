import { Command } from "commander";
import { execa } from "execa";
import ora from "ora";
import prompts from "prompts";

import { addShortcutFiles } from "../utils/addShortcutFiles";
import { PACKAGE_MANAGER_CHOICES } from "../utils/constants";
import { printFancyBoxMessage } from "../utils/printFancyBoxMessage";

/**
 * Adds the shortcuts composables to the project.
 */
export const addShortcuts = new Command()
  .command("shortcuts")
  .name("shortcuts")
  .description("Add the shortcuts composables to your project.")
  .action(async () => {
    await addShortcutFiles();

    const { pkgManager } = await prompts({
      name: "pkgManager",
      type: "select",
      message: "Which package manager are you using?",
      choices: PACKAGE_MANAGER_CHOICES,
    });
    if (!pkgManager) return process.exit(0);

    const spinner = ora("Installing vueuse module...").start();
    // install vueuse for nuxt
    await execa`npx -y nuxi@latest module add vueuse`;
    spinner.succeed("VueUse module installed successfully!");

    printFancyBoxMessage(
      "All Done!",
      `Check the composables folder for the shortcuts composables.`,
      { box: { title: "Composable Added" } }
    );
  });

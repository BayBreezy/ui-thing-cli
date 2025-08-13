import { Command } from "commander";
import prompts from "prompts";

import { addPrettierConfig } from "../utils/addPrettierConfig";
import { PACKAGE_MANAGER_CHOICES } from "../utils/constants";
import { installPackages } from "../utils/installPackages";
import { printFancyBoxMessage } from "../utils/printFancyBoxMessage";

export const addPrettier = new Command()
  .command("prettier")
  .name("prettier")
  .description("Add prettier to your project.")
  .action(async () => {
    const added = await addPrettierConfig(undefined, false);
    if (!added) {
      printFancyBoxMessage("Not Added", `Prettier config was not added.`, {
        box: { title: "Prettier Not Added", borderColor: "red" },
      });
      return;
    }

    const { pkgManager } = await prompts({
      name: "pkgManager",
      type: "select",
      message: "Which package manager are you using?",
      choices: PACKAGE_MANAGER_CHOICES,
    });
    if (!pkgManager) return process.exit(0);

    // install prettier dep
    await installPackages(pkgManager, undefined, [
      "prettier",
      "prettier-plugin-tailwindcss",
      "@ianvs/prettier-plugin-sort-imports",
    ]);
    printFancyBoxMessage(
      "All Done!",
      `A .prettierrc file has been added to your project and the code formatted. Enjoy!`,
      { box: { title: "Prettier Added" } }
    );
  });

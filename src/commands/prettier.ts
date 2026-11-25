import { Command } from "commander";
import { consola } from "consola";

import { addPrettierConfig } from "../utils/addPrettierConfig";
import { loadConfigOrDefaults } from "../utils/config";
import { INIT_DEV_DEPS_PRETTIER } from "../utils/constants";
import { describeInstallError, installPackages } from "../utils/installPackages";
import { printFancyBoxMessage } from "../utils/printFancyBoxMessage";

export const addPrettier = new Command()
  .command("prettier")
  .name("prettier")
  .description("Adds prettier config to your project.")
  .option("-y --yes", "Do not ask: merge into an existing .prettierrc", false)
  .option("--package-manager <pm>", "Package manager to use (default: from config or lockfile)")
  .action(async (options: { yes?: boolean; packageManager?: string }) => {
    const added = await addPrettierConfig(undefined, false, options.yes ? "merge" : undefined);
    if (!added) {
      printFancyBoxMessage("Not Added", `Prettier config was not added.`, {
        box: { title: "Prettier Not Added", borderColor: "red" },
      });
      return;
    }

    const pkgManager =
      options.packageManager ?? (await loadConfigOrDefaults()).config.packageManager;

    // install prettier dep
    try {
      await installPackages(pkgManager, undefined, INIT_DEV_DEPS_PRETTIER);
    } catch (error) {
      consola.error(
        `Installing Prettier failed:\n${describeInstallError(error)}\nInstall them yourself: ${INIT_DEV_DEPS_PRETTIER.join(" ")}`
      );
      process.exitCode = 1;
      return;
    }
    printFancyBoxMessage(
      "All Done!",
      `A .prettierrc file has been added and its dev dependencies installed with ${pkgManager}. Run "npx prettier --write ." to format your project.`,
      { box: { title: "Prettier Added" } }
    );
  });

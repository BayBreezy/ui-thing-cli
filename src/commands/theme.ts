import { Command } from "commander";
import fse from "fs-extra";
import kleur from "kleur";
import _ from "lodash";
import prompts from "prompts";

import { createCSS } from "../templates/css";
import { compareUIConfig } from "../utils/compareUIConfig";
import { getUIConfig } from "../utils/config";
import { CSS_THEME_OPTIONS } from "../utils/constants";
import { printFancyBoxMessage } from "../utils/printFancyBoxMessage";

/**
 * Adds a new theme to the project.
 */
export const theme = new Command()
  .command("theme")
  .name("theme")
  .description("Add a new theme to your project.")
  .action(async () => {
    // Get ui config
    let uiConfig = await getUIConfig();
    const uiConfigIsCorrect = await compareUIConfig();
    if (!uiConfigIsCorrect) {
      uiConfig = await getUIConfig({ force: true });
    }
    if (_.isEmpty(uiConfig)) {
      console.log(kleur.red("Config file not set. Exiting..."));
      process.exit(0);
    }
    const { theme } = await prompts([
      {
        name: "theme",
        type: "autocomplete",
        message: "Which theme do you want to add?",
        choices: CSS_THEME_OPTIONS,
      },
    ]);
    if (!theme) {
      console.log(kleur.red("No theme selected. Exiting..."));
      process.exit(0);
    }
    if (fse.existsSync(uiConfig.tailwindCSSLocation)) {
      const { force } = await prompts([
        {
          name: "force",
          type: "confirm",
          message: "Do you want to overwrite your current css file?",
          initial: true,
        },
      ]);
      if (!force) {
        console.log("Exiting...");
        return process.exit(0);
      }
    }
    fse.writeFileSync(uiConfig.tailwindCSSLocation, createCSS(theme.toUpperCase() as any), "utf-8");

    printFancyBoxMessage(
      `${_.capitalize(theme)}`,
      `${_.capitalize(theme)} theme has been added to ${uiConfig.tailwindCSSLocation}`,
      { box: { title: "New Theme Added" } }
    );
  });

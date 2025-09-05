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
 * Validates if a theme name exists in the predefined options.
 */
const validateThemeName = (name: string) => {
  return CSS_THEME_OPTIONS.some((option) => option.value === name?.toLowerCase());
};

/**
 * Adds a new theme to the project.
 */
export const theme = new Command()
  .command("theme")
  .name("theme")
  .description("Add a new theme to your project.")
  .argument("[themeName]", "The name of the theme you would like to add")
  .action(async (themeName?: string) => {
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

    let selectedTheme =
      themeName && validateThemeName(themeName) ? themeName.toLowerCase() : undefined;

    if (!selectedTheme) {
      // Prompt for theme if not provided or invalid
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
      selectedTheme = theme;
    }

    // Check if the file exists
    if (fse.existsSync(uiConfig.tailwindCSSLocation)) {
      const { force } = await prompts([
        {
          name: "force",
          type: "confirm",
          message: "The Tailwind CSS file already exists. Overwrite?",
          initial: false,
        },
      ]);
      if (!force) {
        console.log("Exiting...");
        return process.exit(0);
      }
    }

    fse.writeFileSync(
      uiConfig.tailwindCSSLocation,
      createCSS(selectedTheme!.toUpperCase() as any),
      "utf-8"
    );

    printFancyBoxMessage(
      `${_.capitalize(selectedTheme!)}`,
      `${_.capitalize(selectedTheme!)} theme has been added to ${uiConfig.tailwindCSSLocation}`,
      { box: { title: "New Theme Added" } }
    );
  });

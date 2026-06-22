import { Command } from "commander";
import fse from "fs-extra";
import _ from "lodash";
import prompts from "prompts";

import { createCSS } from "../templates/css";
import { compareUIConfig } from "../utils/compareUIConfig";
import { getUIConfig } from "../utils/config";
import { CSS_THEME_OPTIONS } from "../utils/constants";
import { logger } from "../utils/logger";
import { printFancyBoxMessage } from "../utils/printFancyBoxMessage";

const validateThemeName = (name: string) => {
  return CSS_THEME_OPTIONS.some((option) => option.value === name?.toLowerCase());
};

export const theme = new Command()
  .command("theme")
  .name("theme")
  .description("Add a new theme to your project.")
  .argument("[themeName]", "The name of the theme you would like to add")
  .action(async (themeName?: string) => {
    let uiConfig = await getUIConfig();
    const uiConfigIsCorrect = await compareUIConfig();
    if (!uiConfigIsCorrect) {
      uiConfig = await getUIConfig({ force: true });
    }
    if (_.isEmpty(uiConfig)) {
      logger.error("Config file not set. Exiting...");
      process.exit(1);
    }

    let selectedTheme =
      themeName && validateThemeName(themeName) ? themeName.toLowerCase() : undefined;

    if (!selectedTheme) {
      const { theme } = await prompts([
        {
          name: "theme",
          type: "autocomplete",
          message: "Which theme do you want to add?",
          choices: CSS_THEME_OPTIONS,
        },
      ]);
      if (!theme) {
        logger.warn("No theme selected. Exiting...");
        process.exit(0);
      }
      selectedTheme = theme;
    }

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
        logger.info("Exiting...");
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

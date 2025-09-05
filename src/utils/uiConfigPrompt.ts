/* eslint-disable @typescript-eslint/no-unused-vars */
import kleur from "kleur";
import prompts from "prompts";

import { CSS_THEME_OPTIONS, PACKAGE_MANAGER_CHOICES } from "./constants";

/**
 * Prompts the user for UI configuration values.
 */
export const initPrompts = async (nuxtVersion: number) => {
  const response = await prompts([
    {
      name: "theme",
      type: "autocomplete",
      message: "Which theme do you want to start with?",
      choices: CSS_THEME_OPTIONS,
    },
    {
      name: "tailwindCSSLocation",
      type: "text",
      message: "Where is your tailwind.css file located?",
      initial: (_, v) =>
        nuxtVersion == 3 ? "assets/css/tailwind.css" : "app/assets/css/tailwind.css",
    },
    {
      name: "componentsLocation",
      type: "text",
      message: "Where should your components be stored?",
      initial: (_, v) => (nuxtVersion == 3 ? "components/Ui" : "app/components/Ui"),
    },
    {
      name: "composablesLocation",
      type: "text",
      message: "Where should your composables be stored?",
      initial: (_, v) => (nuxtVersion == 3 ? "composables" : "app/composables"),
    },
    {
      name: "pluginsLocation",
      type: "text",
      message: "Where should your plugins be stored?",
      initial: (_, v) => (nuxtVersion == 3 ? "plugins" : "app/plugins"),
    },
    {
      name: "utilsLocation",
      type: "text",
      message: "Where should your utils be stored?",
      initial: (_, v) => (nuxtVersion == 3 ? "utils" : "app/utils"),
    },
    {
      name: "force",
      type: "confirm",
      message: "Should we just replace component files if they already exist?",
      initial: true,
    },
    {
      name: "useDefaultFilename",
      type: "confirm",
      message: "Would you like to use the default filename when adding components?",
      initial: true,
    },
    {
      name: "packageManager",
      type: "select",
      message: "Which package manager do you use?",
      choices: PACKAGE_MANAGER_CHOICES,
    },
  ]);

  if (!response || Object.keys(response).length < 9) {
    console.log(kleur.red(kleur.bold("Incomplete configuration submitted. Exiting...")));
    return process.exit(0);
  }
  return response;
};

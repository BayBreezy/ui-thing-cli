import { UIConfig } from "../types";

/**
 * The filename of the UI Thing configuration file.
 */
export const UI_CONFIG_FILENAME = "ui-thing.config.ts";
/**
 * The default UI Thing configuration.
 *
 * Used when Nuxt 3 is detected
 */
export const DEFAULT_CONFIG: UIConfig = {
  theme: "zinc",
  tailwindCSSLocation: "assets/css/tailwind.css",
  componentsLocation: "components/Ui",
  composablesLocation: "composables",
  pluginsLocation: "plugins",
  utilsLocation: "utils",
  force: true,
  useDefaultFilename: true,
  packageManager: "npm",
};

/**
 * The default UI Thing configuration.
 *
 * Used when Nuxt 4 is detected
 */
export const DEFAULT_CONFIG_NUXT4: UIConfig = {
  theme: "zinc",
  tailwindCSSLocation: "app/assets/css/tailwind.css",
  componentsLocation: "app/components/Ui",
  composablesLocation: "app/composables",
  pluginsLocation: "app/plugins",
  utilsLocation: "app/utils",
  force: true,
  useDefaultFilename: true,
  packageManager: "npm",
};

/**
 * The initial core dependencies
 */
export const INIT_DEPS = [
  "tailwindcss",
  "motion-v",
  "@tailwindcss/vite",
  "reka-ui",
  "tailwind-variants",
  "tailwind-merge",
  "@nuxt/fonts",
  "@nuxtjs/color-mode",
  "@nuxt/icon",
  "@vueuse/nuxt",
  "@tailwindcss/forms",
];

/**
 * The initial development dependencies
 */
export const INIT_DEV_DEPS = ["typescript", "tw-animate-css"];
/**
 * The initial development dependencies for prettier stuff
 */
export const INIT_DEV_DEPS_PRETTIER = [
  "prettier-plugin-tailwindcss",
  "prettier",
  "@ianvs/prettier-plugin-sort-imports",
];

/**
 * Initial modules that are needed
 */
export const INIT_MODULES = [
  "@nuxtjs/color-mode",
  "motion-v/nuxt",
  "@vueuse/nuxt",
  "@nuxt/icon",
  "@nuxt/fonts",
];

/**
 * List of available package managers to chose from
 */
export const PACKAGE_MANAGER_CHOICES = [
  { title: "Npm", value: "npm" },
  { title: "Yarn", value: "yarn" },
  { title: "Pnpm", value: "pnpm" },
  { title: "Bun", value: "bun" },
];

/**
 * List of available CSS themes to choose from
 */
export const CSS_THEME_OPTIONS = [
  { title: "Zinc", value: "zinc" },
  { title: "Slate", value: "slate" },
  { title: "Stone", value: "stone" },
  { title: "Gray", value: "gray" },
  { title: "Neutral", value: "neutral" },
  { title: "Red", value: "red" },
  { title: "Rose", value: "rose" },
  { title: "Orange", value: "orange" },
  { title: "Green", value: "green" },
  { title: "Blue", value: "blue" },
  { title: "Yellow", value: "yellow" },
  { title: "Violet", value: "violet" },
];

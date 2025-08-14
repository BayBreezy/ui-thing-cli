import path from "node:path";
import { updateConfig } from "c12/update";
import { Command } from "commander";
import fse from "fs-extra";
import kleur from "kleur";
import ora from "ora";

import { createCSS } from "../templates/css";
import { TW_HELPER } from "../templates/tw-helper";
import { InitOptions, UIConfig } from "../types";
import { addPrettierConfig } from "../utils/addPrettierConfig";
import { addTailwindVitePlugin } from "../utils/addTailwindVitePlugin";
import { addVSCodeFiles } from "../utils/addVSCodeFiles";
import { getUIConfig } from "../utils/config";
import { INIT_DEPS, INIT_DEV_DEPS, INIT_MODULES } from "../utils/constants";
import { installPackages } from "../utils/installPackages";
import { printFancyBoxMessage } from "../utils/printFancyBoxMessage";

/**
 * Runs the initialization command.
 */
export const runInitCommand = async (options: InitOptions) => {
  // Get or create the initial configuration file
  let uiConfig: UIConfig = await getUIConfig(options);
  const spinner = ora("Updating nuxt.config...").start();
  // Get nuxt config
  await updateConfig({
    cwd: process.cwd(),
    configFile: "nuxt.config",
    async onUpdate(config: any) {
      // Create modules array if it does not exist
      if (!config.modules) config.modules = [];
      // Create imports object if it does not exist
      if (!config.imports) config.imports = { imports: [] };
      for (const mod of INIT_MODULES) {
        if (!config.modules.includes(mod)) {
          config.modules.push(mod);
        }
      }
      // Add color mode config to nuxt.config file
      if (!config.colorMode) {
        // get the name of the folder(project name)
        const projectName = path.basename(process.cwd());
        config.colorMode = { storageKey: `${projectName}-color-mode` };
      }
      // Add icon config if not present
      if (!config.icon) {
        config.icon = {
          clientBundle: { scan: true, sizeLimitKb: 0 },
          mode: "svg",
          class: "shrink-0",
          fetchTimeout: 2000,
          serverBundle: "local",
        };
      }
      // Add `tv` auto-import to the config file if it does not exists
      if (
        !config.imports.imports.find((i: any) => i.from === "tailwind-variants" && i.name === "tv")
      ) {
        config.imports.imports.push({ from: "tailwind-variants", name: "tv" });
      }
      // Add `VariantProps` auto-import to the config file if it does not exists
      if (
        !config.imports.imports.find(
          (i: any) => i.from === "tailwind-variants" && i.name === "VariantProps"
        )
      ) {
        config.imports.imports.push({
          from: "tailwind-variants",
          name: "VariantProps",
          type: true,
        });
      }
      // Add css path to config
      config.css ||= [];
      config.css.push(`~/${uiConfig.tailwindCSSLocation?.split("app/")[1]}`);
    },
  });
  await addTailwindVitePlugin();
  spinner.succeed("Updated nuxt.config!");
  spinner.start("Adding initial Tailwind CSS file...");
  fse.writeFileSync(
    uiConfig.tailwindCSSLocation,
    createCSS(uiConfig.theme.toUpperCase() as any),
    "utf-8"
  );
  spinner.succeed("Added initial Tailwind CSS file!");
  spinner.start("Adding Autocomplete helper...");
  // Add Autocomplete helper
  fse.writeFileSync(uiConfig.utilsLocation + "/tw-helper.ts", TW_HELPER, "utf-8");
  spinner.succeed("Added Autocomplete helper!");
  spinner.start("Merging VS Code settings...");
  // Add .vscode folder with recommendations & settings
  addVSCodeFiles();
  spinner.succeed("Merged VS Code settings!");
  // Install deps
  await installPackages(uiConfig.packageManager, INIT_DEPS, INIT_DEV_DEPS);
  // Add prettier config
  await addPrettierConfig();
  printFancyBoxMessage(
    "Initialized",
    `Feel free to start adding components with the ${kleur.bgWhite(" add ")} command.`,
    { box: { title: "Complete" } }
  );
};

/**
 * Command to initialize UI Thing in a Nuxt project.
 */
export const init = new Command()
  .command("init")
  .name("init")
  .summary("Initialize UI Thing in your Nuxt project.")
  .description(
    `${kleur.bold("Initialize UI Thing in your Nuxt project.")}

  ✅ Add tailwindcss to your project
  ✅ Update your nuxt.config file
  ✅ Add the necessary dependencies
  ✅ Create a ${kleur.bold("ui-thing.config")} file with the default configuration`
  )
  .option("-f --force", "Overwrite config file if it exists.", false)
  .option("-y --yes", "Skip prompts and use default values.", false)
  .option("-n --nuxtVersion <number>", "Specify the Nuxt version you are using.")
  .action(runInitCommand);

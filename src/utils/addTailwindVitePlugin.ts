import { join } from "node:path";
import { builders, loadFile, writeFile } from "magicast";
import { getDefaultExportOptions } from "magicast/helpers";

/**
 * Adds the Tailwind CSS Vite plugin to the Nuxt config.
 */
export const addTailwindVitePlugin = async () => {
  // Get the path to nuxt config
  const CONFIG_PATH = join(process.cwd(), "nuxt.config.ts");
  // Load the nuxt config file
  const cfg = await loadFile(CONFIG_PATH);
  // check if `tailwindcss()` is already present in the code

  if (!cfg.$code.includes("tailwindcss()")) {
    // get the exported config object
    const defaultExport = getDefaultExportOptions(cfg);
    // ensure vite and plugins are defined
    defaultExport.vite ||= {};
    defaultExport.vite.plugins ||= [];
    // push the function to the plugins array
    defaultExport.vite.plugins.push(builders.functionCall("tailwindcss"));
  }
  // check if tailwind plugin is already imported
  if (!cfg.imports.$items.find((i) => i.local === "tailwindcss")) {
    // prepend the import for tailwindcss
    cfg.imports.$prepend({
      from: "@tailwindcss/vite",
      local: "tailwindcss",
      imported: "default",
    });
  }
  // write the changes to the `nuxt.config.ts` file
  await writeFile(cfg, CONFIG_PATH);
};

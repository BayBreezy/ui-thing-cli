import fs from "node:fs";
import path from "node:path";
import { Command } from "commander";
import kleur from "kleur";
import { loadFile } from "magicast";
import { getDefaultExportOptions } from "magicast/helpers";

import { version as cliVersion } from "../../package.json";
import { DEFAULT_REGISTRIES } from "../registry/fetch";
import { readLock } from "../registry/lock";
import { loadConfigOrDefaults } from "../utils/config";
import { UI_CONFIG_FILENAME } from "../utils/constants";
import { detectPackageManager } from "../utils/detectPackageManager";
import { logger } from "../utils/logger";
import { printJson } from "../utils/printJson";

const readJson = (file: string): Record<string, any> | null => {
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch {
    return null;
  }
};

/** Installed version of a package, read from node_modules. */
const installedVersion = (cwd: string, name: string): string | null =>
  readJson(path.join(cwd, "node_modules", name, "package.json"))?.version ?? null;

/** Top-level components in a folder: `.vue` files (without extension) and sub-folders. */
const listComponents = (dir: string): string[] => {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() || entry.name.endsWith(".vue"))
    .map((entry) => entry.name.replace(/\.client\.vue$|\.vue$/, ""))
    .sort((a, b) => a.localeCompare(b));
};

/** Module names registered in nuxt.config, or null when the file cannot be read. */
const readNuxtModules = async (cwd: string): Promise<string[] | null> => {
  const file = ["nuxt.config.ts", "nuxt.config.js", "nuxt.config.mjs"]
    .map((name) => path.join(cwd, name))
    .find((candidate) => fs.existsSync(candidate));
  if (!file) return null;
  try {
    const mod = await loadFile(file);
    const options = getDefaultExportOptions(mod);
    const modules: unknown[] = options.modules ? [...options.modules] : [];
    return modules.map((m) => (Array.isArray(m) ? String(m[0]) : String(m)));
  } catch {
    return null;
  }
};

/**
 * Collects everything an agent (or a human) needs to know before changing a UI Thing project.
 * Read-only: never prompts and never writes.
 */
export const collectProjectInfo = async (cwd = process.cwd()) => {
  const pkg = readJson(path.join(cwd, "package.json"));
  const deps = { ...pkg?.dependencies, ...pkg?.devDependencies } as Record<string, string>;
  const { config, fromFile } = await loadConfigOrDefaults();

  const nuxtSpec = deps.nuxt ?? null;
  const nuxtInstalled = installedVersion(cwd, "nuxt");
  const nuxtMajor =
    Number((nuxtInstalled ?? nuxtSpec ?? "").replace(/^[^0-9]*/, "").split(".")[0]) || null;
  const tsInstalled = installedVersion(cwd, "typescript");
  const nuxtModules = await readNuxtModules(cwd);
  const lock = readLock(cwd);

  const exists = (rel?: string) => Boolean(rel && fs.existsSync(path.join(cwd, rel)));
  const componentsDir = path.join(cwd, config.componentsLocation);

  const warnings: string[] = [];
  if (!pkg) warnings.push("No package.json found. Run this inside a Nuxt project.");
  if (pkg && !nuxtSpec) warnings.push("Nuxt is not a dependency of this project.");
  if (!fromFile) {
    warnings.push(
      `${UI_CONFIG_FILENAME} not found: UI Thing is not initialized. Run \`ui-thing init --yes\`. Paths below are the defaults.`
    );
  }
  if (tsInstalled && Number(tsInstalled.split(".")[0]) >= 7) {
    warnings.push(
      `TypeScript ${tsInstalled} is installed. Vue's compiler needs TypeScript 6: install typescript@^6.`
    );
  }
  if (fromFile && !exists(config.tailwindCSSLocation)) {
    warnings.push(`Tailwind CSS file ${config.tailwindCSSLocation} is missing.`);
  }
  if (fromFile && nuxtModules && !nuxtModules.includes("@nuxtjs/color-mode")) {
    warnings.push("@nuxtjs/color-mode is not in nuxt.config modules; dark mode will not work.");
  }

  return {
    cli: { version: cliVersion },
    cwd,
    initialized: fromFile,
    framework: nuxtSpec
      ? { name: "nuxt", version: nuxtInstalled ?? nuxtSpec, major: nuxtMajor }
      : null,
    packageManager: {
      configured: fromFile ? config.packageManager : null,
      detected: detectPackageManager(cwd),
    },
    typescript: tsInstalled,
    tailwind: {
      cssFile: config.tailwindCSSLocation,
      exists: exists(config.tailwindCSSLocation),
      version: installedVersion(cwd, "tailwindcss"),
    },
    paths: {
      components: config.componentsLocation,
      composables: config.composablesLocation,
      utils: config.utilsLocation,
      plugins: config.pluginsLocation ?? null,
    },
    config: fromFile ? config : null,
    installed: {
      components: listComponents(componentsDir),
      registryItems: Object.entries(lock.items).map(([name, entry]) => ({
        name,
        source: entry.source,
        files: entry.files,
      })),
    },
    nuxtModules,
    registries: Object.fromEntries(
      Object.entries({ ...DEFAULT_REGISTRIES, ...(config.registries ?? {}) }).map(([ns, value]) => [
        ns,
        typeof value === "string" ? value : value.url,
      ])
    ),
    warnings,
  };
};

const runInfoCommand = async (options: { json?: boolean }) => {
  const info = await collectProjectInfo();
  if (options.json) return printJson(info);

  const row = (label: string, value: unknown) =>
    logger.log(`${kleur.bold(label.padEnd(16))} ${value ?? kleur.dim("none")}`);
  row("ui-thing", info.cli.version);
  row("Nuxt", info.framework ? `${info.framework.version}` : null);
  row("Initialized", info.initialized ? "yes" : "no");
  row(
    "Package manager",
    info.packageManager.configured ?? `${info.packageManager.detected} (detected)`
  );
  row("TypeScript", info.typescript);
  row(
    "Tailwind CSS",
    `${info.tailwind.cssFile}${info.tailwind.exists ? "" : kleur.red(" (missing)")}`
  );
  row("Components dir", info.paths.components);
  row("Components", info.installed.components.join(", ") || null);
  row("Registry items", info.installed.registryItems.map((i) => i.name).join(", ") || null);
  row("Nuxt modules", info.nuxtModules?.join(", ") || null);
  row("Registries", Object.keys(info.registries).join(", "));
  info.warnings.forEach((w) => logger.warn(w));
};

export const info = new Command()
  .name("info")
  .command("info")
  .description("Show the project's UI Thing setup: versions, paths, installed components, modules.")
  .option("--json", "Print machine-readable JSON")
  .action(runInfoCommand);

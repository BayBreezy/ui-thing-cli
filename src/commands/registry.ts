import { updateConfig } from "c12/update";
import { Command } from "commander";
import { consola } from "consola";
import fse from "fs-extra";
import kleur from "kleur";

import { DEFAULT_REGISTRIES, fetchRegistryIndex } from "../registry/fetch";
import { RegistriesConfig } from "../registry/schema";
import { loadConfigOrDefaults } from "../utils/config";
import { UI_CONFIG_FILENAME } from "../utils/constants";
import { logger } from "../utils/logger";
import { printJson } from "../utils/printJson";

const MAX_ROWS = 50;

/** Reads `registries` from the config without forcing the init prompts when it is missing. */
const loadRegistries = async (): Promise<RegistriesConfig> => {
  try {
    const { config } = await loadConfigOrDefaults();
    return { ...DEFAULT_REGISTRIES, ...(config.registries ?? {}) };
  } catch {
    return { ...DEFAULT_REGISTRIES };
  }
};

type JsonOption = { json?: boolean };

const toJsonItems = (
  namespace: string,
  items: { name: string; type?: string; title?: string; description?: string }[]
) =>
  items.map((item) => ({
    ref: namespace ? `${namespace}/${item.name}` : item.name,
    name: item.name,
    type: item.type ?? null,
    title: item.title ?? null,
    description: item.description ?? null,
  }));

const printItems = (
  namespace: string,
  items: { name: string; type?: string; title?: string; description?: string }[]
) => {
  const shown = items.slice(0, MAX_ROWS);
  for (const item of shown) {
    const desc = item.description ? kleur.dim(` - ${item.description.slice(0, 80)}`) : "";
    logger.log(`${kleur.cyan(`${namespace}/${item.name}`)}${desc}`);
  }
  if (items.length > shown.length) {
    logger.log(
      kleur.dim(`...and ${items.length - shown.length} more. Narrow it with "registry search".`)
    );
  }
};

const runRegistryListCommand = async (source: string | undefined, options: JsonOption = {}) => {
  const registries = await loadRegistries();

  if (!source && options.json) {
    printJson(
      Object.fromEntries(
        Object.entries(registries).map(([ns, value]) => [
          ns,
          typeof value === "string" ? value : value.url,
        ])
      )
    );
    return;
  }

  if (!source) {
    logger.info("Configured registries:");
    for (const [ns, value] of Object.entries(registries)) {
      logger.log(`${kleur.cyan(ns)}  ${typeof value === "string" ? value : value.url}`);
    }
    logger.log(kleur.dim("\nBrowse one with: ui-thing registry list @namespace"));
    return;
  }

  try {
    const { index, url } = await fetchRegistryIndex(source, registries);
    if (options.json) {
      printJson(toJsonItems(source.startsWith("@") ? source : "", index.items));
      return;
    }
    logger.info(`${index.items.length} item(s) in ${url}`);
    printItems(source.startsWith("@") ? source : "", index.items);
  } catch (error) {
    logger.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
};

const runRegistrySearchCommand = async (
  query: string,
  source: string | undefined,
  options: JsonOption = {}
) => {
  const registries = await loadRegistries();
  const sources = source ? [source] : Object.keys(registries);
  const needle = query.toLowerCase();
  let total = 0;
  const jsonResults: ReturnType<typeof toJsonItems> = [];

  for (const src of sources) {
    try {
      const { index } = await fetchRegistryIndex(src, registries);
      const matches = index.items.filter((i) =>
        [i.name, i.title, i.description].some((v) => v?.toLowerCase().includes(needle))
      );
      if (matches.length === 0) continue;
      total += matches.length;
      if (options.json) jsonResults.push(...toJsonItems(src.startsWith("@") ? src : "", matches));
      else printItems(src.startsWith("@") ? src : "", matches);
    } catch (error) {
      logger.warn(`${src}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (options.json) {
    printJson(jsonResults);
    return;
  }
  if (total === 0) logger.info(`No items matching "${query}".`);
  else logger.success(`${total} match(es). Install with: ui-thing add @namespace/name`);
};

const runRegistryAddNamespaceCommand = async (namespace: string, url: string) => {
  if (!/^@[a-zA-Z0-9][\w.-]*$/.test(namespace)) {
    logger.error('Namespace must start with "@", e.g. @acme');
    process.exit(1);
  }
  if (!url.includes("{name}")) {
    logger.error(
      "The URL must contain the {name} placeholder, e.g. https://acme.dev/r/{name}.json"
    );
    process.exit(1);
  }
  if (!/^https?:\/\//i.test(url)) {
    logger.error("The URL must start with http:// or https://");
    process.exit(1);
  }

  if (!fse.existsSync(UI_CONFIG_FILENAME)) {
    logger.error(
      "ui-thing.config.ts not found. Run `ui-thing init` (or `ui-thing init --yes`) first."
    );
    process.exit(1);
  }
  await updateConfig({
    configFile: "ui-thing.config",
    cwd: process.cwd(),
    onUpdate(config: Record<string, any>) {
      config.registries ||= {};
      config.registries[namespace] = url;
    },
  });
  consola.success(`Added ${namespace}. Try: ui-thing add ${namespace}/<item>`);
};

export const registry = new Command()
  .name("registry")
  .command("registry")
  .description("Browse and configure shadcn-style component registries.");

registry
  .command("list")
  .description("List configured registries, or the items in one (@namespace or URL).")
  .argument("[source]", "A @namespace or a registry URL.")
  .option("--json", "Print machine-readable JSON")
  .action(runRegistryListCommand);

registry
  .command("search")
  .description("Search registry items by name or description.")
  .argument("<query>", "Text to look for.")
  .argument(
    "[source]",
    "A @namespace or a registry URL. Searches all configured registries if omitted."
  )
  .option("--json", "Print machine-readable JSON")
  .action(runRegistrySearchCommand);

registry
  .command("add-namespace")
  .description("Add a registry namespace to ui-thing.config.ts.")
  .argument("<namespace>", "Namespace, e.g. @acme")
  .argument("<url>", "URL template containing {name}, e.g. https://acme.dev/r/{name}.json")
  .action(runRegistryAddNamespaceCommand);

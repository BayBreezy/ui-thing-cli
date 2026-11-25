import path from "node:path";
import { Command } from "commander";
import { consola } from "consola";
import kleur from "kleur";

import { isRegistryRef } from "../registry/fetch";
import { resolveTargetPath } from "../registry/paths";
import { resolveRegistryTree } from "../registry/resolve";
import { Component, UIConfig } from "../types";
import { blockId, extractPackageImports, findBlocks } from "../utils/blockHelpers";
import { componentTargets, findCatalogComponent } from "../utils/componentFiles";
import { loadConfigOrDefaults } from "../utils/config";
import { fetchBlocks } from "../utils/fetchBlocks";
import { fetchComponents } from "../utils/fetchComponents";
import { logger } from "../utils/logger";
import { printJson } from "../utils/printJson";
import { getDefaultBlocksDir } from "./block";

type ViewFile = { path: string; content: string };

type ViewResult = {
  kind: "component" | "block" | "registry";
  ref: string;
  name: string;
  docs: string | null;
  dependencies: string[];
  devDependencies: string[];
  nuxtModules: string[];
  components: string[];
  files: ViewFile[];
};

const viewComponent = (component: Component, uiConfig: UIConfig): ViewResult => ({
  kind: "component",
  ref: component.value,
  name: component.name,
  docs: component.docsPath ? `https://uithing.com${component.docsPath}` : null,
  dependencies: component.deps ?? [],
  devDependencies: component.devDeps ?? [],
  nuxtModules: component.nuxtModules ?? [],
  components: component.components ?? [],
  files: componentTargets(component, uiConfig).map(({ path: p, content }) => ({
    path: p,
    content,
  })),
});

/**
 * Resolves names to library items without installing anything. Order: registry refs (URL,
 * @namespace/item, ./file.json), then UI Thing components, then blocks.
 */
export const resolveViews = async (names: string[], uiConfig: UIConfig) => {
  const results: ViewResult[] = [];
  const missing: string[] = [];
  let catalog: Component[] | undefined;
  let blocks: Awaited<ReturnType<typeof fetchBlocks>> | undefined;

  for (const name of names) {
    if (isRegistryRef(name)) {
      const { items } = await resolveRegistryTree([name], uiConfig.registries);
      const { item, source } = items[items.length - 1];
      results.push({
        kind: "registry",
        ref: source,
        name: item.name,
        docs: null,
        dependencies: item.dependencies ?? [],
        devDependencies: item.devDependencies ?? [],
        nuxtModules: [],
        components: item.registryDependencies ?? [],
        files: (item.files ?? []).map((file) => {
          let target = file.target ?? file.path;
          try {
            target = resolveTargetPath(file, uiConfig);
          } catch {
            // keep the original path when it cannot be mapped (for example a missing target)
          }
          return { path: target.replace(/\\/g, "/"), content: file.content ?? "" };
        }),
      });
      continue;
    }

    catalog ??= await fetchComponents();
    const component = findCatalogComponent(catalog, name);
    if (component) {
      results.push(viewComponent(component, uiConfig));
      continue;
    }

    blocks ??= await fetchBlocks();
    const [block] = findBlocks([name], blocks).found;
    if (block) {
      results.push({
        kind: "block",
        ref: blockId(block),
        name: block.name,
        docs: null,
        dependencies: extractPackageImports(block.file),
        devDependencies: [],
        nuxtModules: [],
        components: block.components ?? [],
        files: [
          {
            path: path.posix.join(getDefaultBlocksDir(uiConfig), block.path),
            content: block.file,
          },
        ],
      });
      continue;
    }

    missing.push(name);
  }
  return { results, missing };
};

const runViewCommand = async (names: string[], options: { json?: boolean }) => {
  const { config } = await loadConfigOrDefaults();
  let resolved;
  try {
    resolved = await resolveViews(names, config);
  } catch (error) {
    consola.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
  const { results, missing } = resolved;

  if (missing.length > 0) {
    consola.error(
      `Not found: ${missing.join(", ")}. Find names with \`ui-thing list\` or \`ui-thing block --list\`.`
    );
    if (results.length === 0) process.exit(1);
    process.exitCode = 1;
  }

  if (options.json) return printJson(results);

  for (const r of results) {
    logger.log(kleur.bold().cyan(`${r.name} (${r.kind}: ${r.ref})`));
    if (r.docs) logger.log(`Docs: ${r.docs}`);
    const list = (label: string, values: string[]) =>
      values.length && logger.log(`${label}: ${values.join(", ")}`);
    list("Dependencies", r.dependencies);
    list("Dev dependencies", r.devDependencies);
    list("Nuxt modules", r.nuxtModules);
    list(r.kind === "registry" ? "Registry dependencies" : "Uses components", r.components);
    for (const file of r.files) {
      logger.log(kleur.dim(`\n── ${file.path} ──`));
      logger.log(file.content);
    }
    logger.log("");
  }
};

export const view = new Command()
  .name("view")
  .command("view")
  .description(
    "Show the source, dependencies and target paths of components, blocks or registry items without installing them."
  )
  .argument(
    "<names...>",
    "Component names (button), block ids (BlockHero1) or registry refs (@vue-bits/HoloMosaic, URLs)"
  )
  .option("--json", "Print machine-readable JSON")
  .action(runViewCommand);

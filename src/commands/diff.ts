import { Command } from "commander";
import { consola } from "consola";
import kleur from "kleur";

import { computeChanges, summarize } from "../utils/changes";
import { loadConfigOrDefaults } from "../utils/config";
import { fetchComponents } from "../utils/fetchComponents";
import { logger } from "../utils/logger";
import { printJson } from "../utils/printJson";

const colorPatch = (patch: string) =>
  patch
    .split("\n")
    .map((line) => {
      if (line.startsWith("+++") || line.startsWith("---")) return kleur.bold(line);
      if (line.startsWith("+")) return kleur.green(line);
      if (line.startsWith("-")) return kleur.red(line);
      if (line.startsWith("@@")) return kleur.cyan(line);
      return line;
    })
    .join("\n");

const runDiffCommand = async (names: string[], options: { json?: boolean }) => {
  const { config } = await loadConfigOrDefaults();
  const catalog = await fetchComponents();
  let result;
  try {
    result = await computeChanges(names, config, catalog);
  } catch (error) {
    consola.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
  const { items, missing } = result;
  if (missing.length > 0) {
    consola.error(`Not installed or unknown: ${missing.join(", ")}`);
    process.exitCode = 1;
  }

  if (options.json) return printJson({ items, missing, summary: summarize(items) });

  if (items.length === 0) {
    logger.info("No installed components to compare.");
    return;
  }

  for (const item of items) {
    const changed = item.files.filter((f) => f.status !== "unchanged");
    if (changed.length === 0) continue;
    logger.log(kleur.bold().cyan(`\n${item.name}`) + kleur.dim(` (${item.kind})`));
    for (const file of changed) {
      if (file.status === "missing") logger.log(kleur.yellow(`  missing locally: ${file.path}`));
      else if (file.patch) logger.log(colorPatch(file.patch));
    }
  }

  const s = summarize(items);
  if (s.itemsWithChanges === 0) {
    logger.success(`All ${items.length} installed item(s) match upstream.`);
  } else {
    logger.info(
      `${s.modified} modified and ${s.missing} missing file(s) in ${s.itemsWithChanges} item(s); ${s.unchanged} unchanged. "-" is your copy, "+" is upstream.`
    );
  }
};

export const diff = new Command()
  .name("diff")
  .command("diff")
  .description(
    "Compare installed components and registry items with upstream before updating. Shows a unified diff of every changed file."
  )
  .argument(
    "[names...]",
    "Components or registry items to compare. Omit to check everything installed."
  )
  .option("--json", "Print machine-readable JSON (files, status and patches)")
  .action(runDiffCommand);

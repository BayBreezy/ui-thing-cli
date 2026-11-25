#!/usr/bin/env node
import { Command } from "commander";

import { version } from "../package.json";
import { add } from "./commands/add";
import { block } from "./commands/block";
import { diff } from "./commands/diff";
import { info } from "./commands/info";
import { init } from "./commands/init";
import { list } from "./commands/list";
import { mcp } from "./commands/mcp";
import { addPrettier } from "./commands/prettier";
import { registry } from "./commands/registry";
import { remove } from "./commands/remove";
import { addShortcuts } from "./commands/shortcuts";
import { theme } from "./commands/theme";
import { update } from "./commands/update";
import { view } from "./commands/view";
import { printFancyBoxMessage } from "./utils/printFancyBoxMessage";

process.on("SIGINT", () => process.exit(0));
process.on("SIGTERM", () => process.exit(0));
process.on("SIGTSTP", () => process.exit(0));

const program = new Command();

// Keep stdout clean for machines: no screen clear or banner when output is piped or JSON is requested.
const machineOutput = !process.stdout.isTTY || process.argv.includes("--json");
if (!machineOutput) {
  console.clear();
  printFancyBoxMessage("UI Thing", undefined, { box: { title: "Welcome" } });
  console.log();
}

program
  .name("ui-thing")
  .description("CLI for adding ui-thing components to your Nuxt application")
  .version(version)
  .addCommand(init)
  .addCommand(info)
  .addCommand(add)
  .addCommand(registry)
  .addCommand(block)
  .addCommand(theme)
  .addCommand(list)
  .addCommand(view)
  .addCommand(diff)
  .addCommand(update)
  .addCommand(remove)
  .addCommand(addShortcuts)
  .addCommand(addPrettier)
  .addCommand(mcp);

program.parse(process.argv);

#!/usr/bin/env node
import { Command } from "commander";

import { version } from "../package.json";
import { add } from "./commands/add";
import { init } from "./commands/init";
import { addPrettier } from "./commands/prettier";
import { addShortcuts } from "./commands/shortcuts";
import { theme } from "./commands/theme";
import { printFancyBoxMessage } from "./utils/printFancyBoxMessage";

process.on("SIGINT", () => process.exit(0));
process.on("SIGTERM", () => process.exit(0));
process.on("SIGTSTP", () => process.exit(0));

const program = new Command();

console.clear();

printFancyBoxMessage("UI Thing", undefined, { box: { title: "Welcome" } });
console.log();

program
  .name("ui-thing")
  .description("CLI for adding ui-thing components to your Nuxt application")
  .version(version)
  .addCommand(init)
  .addCommand(add)
  .addCommand(theme)
  .addCommand(addShortcuts)
  .addCommand(addPrettier);

program.parse(process.argv);

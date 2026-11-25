import fs from "node:fs";
import path from "node:path";
import { Command } from "commander";
import { consola } from "consola";
import kleur from "kleur";
import prompts from "prompts";

import { logger } from "../utils/logger";

export const MCP_URL = "https://uithing.com/mcp";
const SERVER_NAME = "ui-thing";

type ProjectClient = { file: string; key: "mcpServers" | "servers"; label: string };

/** Clients configured per project: the CLI writes their config file. */
const PROJECT_CLIENTS: Record<string, ProjectClient> = {
  claude: { file: ".mcp.json", key: "mcpServers", label: "Claude Code" },
  cursor: { file: ".cursor/mcp.json", key: "mcpServers", label: "Cursor" },
  vscode: { file: ".vscode/mcp.json", key: "servers", label: "VS Code" },
};

/** Clients configured globally: the CLI prints what to run or paste instead of editing home files. */
const GLOBAL_CLIENTS: Record<string, { label: string; instructions: (url: string) => string }> = {
  codex: {
    label: "Codex",
    instructions: (url) =>
      `Run:\n  codex mcp add ${SERVER_NAME} --url ${url}\n\nor add to ~/.codex/config.toml:\n  [mcp_servers.${SERVER_NAME}]\n  url = "${url}"`,
  },
  windsurf: {
    label: "Windsurf",
    instructions: (url) =>
      `Add to ~/.codeium/windsurf/mcp_config.json:\n${JSON.stringify(
        { mcpServers: { [SERVER_NAME]: { type: "http", url } } },
        null,
        2
      )}`,
  },
  "claude-desktop": {
    label: "Claude Desktop",
    instructions: (url) =>
      `Add to claude_desktop_config.json:\n${JSON.stringify(
        { mcpServers: { [SERVER_NAME]: { command: "npx", args: ["mcp-remote", url] } } },
        null,
        2
      )}`,
  },
};

export const MCP_CLIENTS = [...Object.keys(PROJECT_CLIENTS), ...Object.keys(GLOBAL_CLIENTS)];

/**
 * Adds the UI Thing server to a project-level MCP config file, keeping every other server
 * and setting. Returns the path written (relative to cwd).
 */
export const writeProjectMcpConfig = (client: string, url = MCP_URL, cwd = process.cwd()) => {
  const target = PROJECT_CLIENTS[client];
  const file = path.join(cwd, target.file);
  let data: Record<string, any> = {};
  if (fs.existsSync(file)) {
    try {
      data = JSON.parse(fs.readFileSync(file, "utf-8"));
    } catch {
      throw new Error(`${target.file} is not valid JSON. Fix it, then run this again.`);
    }
  }
  data[target.key] = { ...data[target.key], [SERVER_NAME]: { type: "http", url } };
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
  return target.file;
};

const runMcpInit = async (options: { client?: string; url?: string; yes?: boolean }) => {
  let client = options.client?.toLowerCase();
  const url = options.url ?? MCP_URL;

  if (!client) {
    if (options.yes) {
      consola.error(`Pass --client (${MCP_CLIENTS.join(", ")}) when using --yes.`);
      process.exit(1);
    }
    ({ client } = await prompts({
      type: "select",
      name: "client",
      message: "Which MCP client do you use?",
      choices: [
        ...Object.entries(PROJECT_CLIENTS).map(([value, c]) => ({ title: c.label, value })),
        ...Object.entries(GLOBAL_CLIENTS).map(([value, c]) => ({ title: c.label, value })),
      ],
    }));
    if (!client) process.exit(0);
  }

  if (PROJECT_CLIENTS[client]) {
    try {
      const file = writeProjectMcpConfig(client, url);
      consola.success(
        `Added the UI Thing MCP server (${url}) to ${kleur.cyan(file)} for ${PROJECT_CLIENTS[client].label}.`
      );
      logger.info("Restart or reload your editor so it picks up the server.");
    } catch (error) {
      consola.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
    return;
  }

  if (GLOBAL_CLIENTS[client]) {
    logger.info(`${GLOBAL_CLIENTS[client].label} keeps MCP servers in a global config file.`);
    logger.log(GLOBAL_CLIENTS[client].instructions(url));
    return;
  }

  consola.error(`Unknown client "${client}". Use one of: ${MCP_CLIENTS.join(", ")}.`);
  process.exit(1);
};

export const mcp = new Command()
  .name("mcp")
  .command("mcp")
  .description("Connect your AI editor to the UI Thing MCP server.");

mcp
  .command("init")
  .description(
    "Add the UI Thing MCP server to your editor's config (writes .mcp.json, .cursor/mcp.json or .vscode/mcp.json; prints instructions for global clients)."
  )
  .option("-c --client <client>", `MCP client: ${MCP_CLIENTS.join(", ")}`)
  .option(
    "--url <url>",
    "Server URL (default https://uithing.com/mcp; use http://localhost:3000/mcp for local dev)"
  )
  .option("-y --yes", "Do not prompt (requires --client)", false)
  .action(runMcpInit);

import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { mcp, MCP_CLIENTS, MCP_URL, writeProjectMcpConfig } from "../../src/commands/mcp";
import { makeProject } from "../helpers/tmp";

vi.mock("../../src/utils/logger");

describe("commands/mcp", () => {
  let cleanup = () => {};
  afterEach(() => cleanup());

  it("writes .mcp.json for Claude Code and keeps other servers", () => {
    const project = makeProject({
      ".mcp.json": JSON.stringify({ mcpServers: { other: { type: "http", url: "https://o" } } }),
    });
    cleanup = project.cleanup;

    expect(writeProjectMcpConfig("claude", MCP_URL, project.dir)).toBe(".mcp.json");

    const data = JSON.parse(fs.readFileSync(path.join(project.dir, ".mcp.json"), "utf-8"));
    expect(data.mcpServers).toEqual({
      other: { type: "http", url: "https://o" },
      "ui-thing": { type: "http", url: "https://uithing.com/mcp" },
    });
  });

  it("uses the servers key for VS Code and creates the folder", () => {
    const project = makeProject();
    cleanup = project.cleanup;
    writeProjectMcpConfig("vscode", "http://localhost:3000/mcp", project.dir);
    const data = JSON.parse(fs.readFileSync(path.join(project.dir, ".vscode/mcp.json"), "utf-8"));
    expect(data).toEqual({
      servers: { "ui-thing": { type: "http", url: "http://localhost:3000/mcp" } },
    });
  });

  it("refuses to overwrite an invalid JSON file", () => {
    const project = makeProject({ ".cursor/mcp.json": "{ nope" });
    cleanup = project.cleanup;
    expect(() => writeProjectMcpConfig("cursor", MCP_URL, project.dir)).toThrow(/not valid JSON/);
  });

  it("prints instructions for global clients instead of editing home files", async () => {
    const { logger } = await import("../../src/utils/logger");
    await mcp.parseAsync(["init", "--client", "codex", "--yes"], { from: "user" });
    expect(vi.mocked(logger.log).mock.calls.flat().join("\n")).toContain(
      "codex mcp add ui-thing --url https://uithing.com/mcp"
    );
  });

  it("knows every client", () => {
    expect(MCP_CLIENTS).toEqual([
      "claude",
      "cursor",
      "vscode",
      "codex",
      "windsurf",
      "claude-desktop",
    ]);
  });
});

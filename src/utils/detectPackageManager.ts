import fs from "node:fs";
import path from "node:path";

type PackageManager = "npm" | "yarn" | "pnpm" | "bun" | "deno";

const LOCKFILES: Array<[string, PackageManager]> = [
  ["bun.lock", "bun"],
  ["bun.lockb", "bun"],
  ["pnpm-lock.yaml", "pnpm"],
  ["yarn.lock", "yarn"],
  ["package-lock.json", "npm"],
  ["deno.lock", "deno"],
];

const KNOWN = new Set<string>(["npm", "yarn", "pnpm", "bun", "deno"]);

/**
 * Works out which package manager a project uses, so non-interactive runs
 * (`init --yes`) do not fall back to npm in a bun or pnpm project.
 *
 * Order: lockfile, then the `packageManager` field in package.json, then the
 * runner that launched the CLI (`npm_config_user_agent`), then npm.
 */
export const detectPackageManager = (cwd = process.cwd()): PackageManager => {
  for (const [file, pm] of LOCKFILES) {
    if (fs.existsSync(path.join(cwd, file))) return pm;
  }

  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(cwd, "package.json"), "utf-8"));
    const name = String(pkg.packageManager ?? "").split("@")[0];
    if (KNOWN.has(name)) return name as PackageManager;
  } catch {
    // no readable package.json: fall through
  }

  const agent = (process.env.npm_config_user_agent ?? "").split("/")[0];
  if (KNOWN.has(agent)) return agent as PackageManager;

  return "npm";
};

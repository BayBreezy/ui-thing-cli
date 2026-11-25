import { execa } from "execa";
import _ from "lodash";
import ora from "ora";

const PM_ADD_CMD: Record<string, string> = {
  yarn: "add",
  bun: "add",
  pnpm: "add",
  npm: "install",
  deno: "add",
};

const PM_DEV_FLAG: Record<string, string> = {
  yarn: "-D",
  bun: "-D",
  pnpm: "-D",
  npm: "-D",
  deno: "--dev",
};

// Deno 2.x requires `npm:` prefix for npm packages
const formatPkgs = (pm: string, pkgs: string[]) =>
  pm === "deno" ? pkgs.map((p) => (p.startsWith("npm:") ? p : `npm:${p}`)) : pkgs;

/**
 * Runs `nuxt prepare` so types and auto-imports pick up new files, packages and modules.
 */
export const runNuxtPrepare = async (packageManager: string) => {
  if (packageManager === "deno") {
    await execa("deno", ["run", "-A", "npm:nuxt", "prepare"]);
  } else {
    await execa`npx -y nuxt prepare`;
  }
};

/**
 * Short, readable reason for a failed install (execa errors include the full output).
 */
export const describeInstallError = (error: unknown) => {
  const err = error as {
    shortMessage?: string;
    message?: string;
    stderr?: string;
    stdout?: string;
  };
  const output = `${err.stderr ?? ""}\n${err.stdout ?? ""}`;
  const reason = output
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /error|ERR!|failed/i.test(line))
    .slice(-3)
    .join("\n");
  return reason || err.shortMessage || err.message || String(error);
};

export const installPackages = async (
  packageManager: string,
  deps?: string[] | string,
  devDeps?: string | string[],
  options: { prepare?: boolean } = {}
) => {
  if (typeof deps === "string") {
    deps = [deps];
  }
  if (typeof devDeps === "string") {
    devDeps = [devDeps];
  }

  const addCmd = PM_ADD_CMD[packageManager] ?? "install";
  const devFlag = PM_DEV_FLAG[packageManager] ?? "-D";

  const depsSpinner = ora("Installing dependencies...").start();
  if (!_.isUndefined(deps) && !_.isEmpty(deps)) {
    await execa(packageManager, [addCmd, ...formatPkgs(packageManager, deps)]);
  }
  depsSpinner.text = "Installing dev dependencies...";
  if (!_.isUndefined(devDeps) && !_.isEmpty(devDeps)) {
    await execa(packageManager, [addCmd, devFlag, ...formatPkgs(packageManager, devDeps)]);
  }

  if (options.prepare !== false) {
    depsSpinner.text = "Running nuxt prepare...";
    await runNuxtPrepare(packageManager);
  }

  depsSpinner.succeed("Installed dependencies!");
};

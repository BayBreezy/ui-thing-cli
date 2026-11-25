import { consola } from "consola";
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

/**
 * pnpm 10+ blocks dependency build scripts by default and pnpm 11+ exits with
 * ERR_PNPM_IGNORED_BUILDS even though the packages were installed and saved. That is a
 * project policy decision, not a failed install, so warn and carry on.
 */
export const isIgnoredBuildsOnly = (packageManager: string, error: unknown) => {
  if (packageManager !== "pnpm") return false;
  const err = error as { stderr?: string; stdout?: string; message?: string };
  return /ERR_PNPM_IGNORED_BUILDS/.test(
    `${err.stderr ?? ""}${err.stdout ?? ""}${err.message ?? ""}`
  );
};

const ignoredScripts = (error: unknown) => {
  const err = error as { stderr?: string; stdout?: string };
  return `${err.stderr ?? ""}\n${err.stdout ?? ""}`
    .match(/Ignored build scripts:\s*([^\n]+)/)?.[1]
    ?.trim();
};

const runInstall = async (packageManager: string, args: string[]) => {
  try {
    await execa(packageManager, args);
  } catch (error) {
    if (!isIgnoredBuildsOnly(packageManager, error)) throw error;
    const scripts = ignoredScripts(error);
    consola.warn(
      `pnpm installed the packages but skipped build scripts${scripts ? ` (${scripts})` : ""}. Run "pnpm approve-builds" if they need them.`
    );
  }
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
  try {
    if (!_.isUndefined(deps) && !_.isEmpty(deps)) {
      await runInstall(packageManager, [addCmd, ...formatPkgs(packageManager, deps)]);
    }
    depsSpinner.text = "Installing dev dependencies...";
    if (!_.isUndefined(devDeps) && !_.isEmpty(devDeps)) {
      await runInstall(packageManager, [addCmd, devFlag, ...formatPkgs(packageManager, devDeps)]);
    }

    if (options.prepare !== false) {
      depsSpinner.text = "Running nuxt prepare...";
      await runNuxtPrepare(packageManager);
    }
  } catch (error) {
    depsSpinner.fail("Installing dependencies failed.");
    throw error;
  }

  depsSpinner.succeed("Installed dependencies!");
};

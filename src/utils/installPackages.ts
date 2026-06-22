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

export const installPackages = async (
  packageManager: string,
  deps?: string[] | string,
  devDeps?: string | string[]
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

  depsSpinner.text = "Running nuxt prepare...";
  if (packageManager === "deno") {
    await execa("deno", ["run", "-A", "npm:nuxt", "prepare"]);
  } else {
    await execa`npx -y nuxt prepare`;
  }

  depsSpinner.succeed("Installed dependencies!");
};

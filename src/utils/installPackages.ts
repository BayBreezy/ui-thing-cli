import * as fs from "fs";
import * as path from "path";
import { execa } from "execa";
import _ from "lodash";
import ora from "ora";

function checkPackageJson() {
  const packageJsonPath = path.join(process.cwd(), "package.json");
  let scriptExists = false;

  // Check if package.json file exists
  if (fs.existsSync(packageJsonPath)) {
    // Read the package.json file
    const packageJsonContent = fs.readFileSync(packageJsonPath, "utf-8");
    const packageJson = JSON.parse(packageJsonContent);

    // Check if "postinstall" script is defined
    const postinstallScript = packageJson.scripts?.postinstall;
    if (postinstallScript) {
      scriptExists = true;
    }
  }
  return scriptExists;
}

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

  const depsSpinner = ora("Installing dependencies...").start();
  if (!_.isUndefined(deps) && !_.isEmpty(deps)) {
    await execa(packageManager, [packageManager === "yarn" ? "add" : "install", ...deps]);
  }
  depsSpinner.text = "Installing dev dependencies...";
  if (!_.isUndefined(devDeps) && !_.isEmpty(devDeps)) {
    await execa(packageManager, [packageManager === "yarn" ? "add" : "install", "-D", ...devDeps]);
  }

  // Check if package.json file exists
  if (checkPackageJson()) {
    // we should check to see if there is a postinstall script and run it
    depsSpinner.text = "Running postinstall script...";
    await execa(packageManager, ["run", "postinstall"]);
  }

  depsSpinner.succeed("Installed dependencies!");
};

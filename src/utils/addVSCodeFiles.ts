import fse from "fs-extra";

import { VS_CODE_RECOMMENDATIONS, VS_CODE_SETTINGS } from "../templates/vs-code";
import { mergeJsonFile } from "./mergeJsonFile";

/**
 * Adds the necessary VS Code configuration files.
 */
export const addVSCodeFiles = (VS_CODE_FOLDER = ".vscode") => {
  fse.ensureDirSync(VS_CODE_FOLDER);
  mergeJsonFile(`${VS_CODE_FOLDER}/extensions.json`, VS_CODE_RECOMMENDATIONS);
  mergeJsonFile(`${VS_CODE_FOLDER}/settings.json`, VS_CODE_SETTINGS);
};

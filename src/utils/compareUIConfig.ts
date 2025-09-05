import { UIConfig } from "../types";
import { getUIConfig } from "./config";

/**
 * Compares the UI config with a temporary config to see if any properties are missing
 * @returns {boolean} - Returns true if all properties are present
 */
export const compareUIConfig = async () => {
  // Get ui config
  const userConfig: UIConfig = await getUIConfig();
  const tempConfig: UIConfig = {
    nuxtVersion: 3,
    theme: "string",
    tailwindCSSLocation: "string",
    componentsLocation: "string",
    composablesLocation: "string",
    utilsLocation: "string",
    force: true,
    useDefaultFilename: true,
    packageManager: "string",
  };

  const missingProperties: string[] = [];

  for (const key of Object.keys(tempConfig)) {
    if (userConfig[key as keyof UIConfig] === undefined) {
      missingProperties.push(key);
    }
  }

  if (missingProperties.length > 1) {
    return false;
  }
  return true;
};

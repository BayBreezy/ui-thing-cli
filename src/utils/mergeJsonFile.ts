import { merge } from "es-toolkit";
import fse from "fs-extra";

/**
 * Merges JSON data into a file without overwriting existing keys.
 * Creates the file if it does not exist.
 *
 * @param filePath - Path to the JSON file to update.
 * @param newData - The new JSON data to merge in.
 */
export function mergeJsonFile(filePath: string, newData: Record<string, any>) {
  let currentData: Record<string, any> = {};

  // Read current JSON if it exists
  if (fse.existsSync(filePath)) {
    try {
      currentData = fse.readJsonSync(filePath);
    } catch {
      console.warn(`⚠️ Could not parse ${filePath}, starting fresh.`);
    }
  }

  // Merge existing and new data
  const merged = merge(currentData, newData);

  // Write merged JSON with pretty formatting
  fse.writeJsonSync(filePath, merged, { spaces: 2 });
}

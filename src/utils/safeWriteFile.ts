import path from "node:path";
import { consola } from "consola";
import kleur from "kleur";
import prompts from "prompts";

import { fileExists } from "./fileExists";
import { writeFile } from "./writeFile";

/**
 * Writes a file, asking before overwriting an existing one unless `forceOverwrite` is set.
 * Returns whether the file was written.
 */
export async function safeWriteFile(
  targetPath: string,
  content: string,
  forceOverwrite: boolean,
  promptMessage: string
) {
  const exists = await fileExists(targetPath);

  if (exists && !forceOverwrite) {
    const { value: overwrite } = await prompts({
      type: "confirm",
      name: "value",
      message: promptMessage,
      initial: false,
    });
    if (!overwrite) {
      consola.info(`Skipped: ${kleur.cyan(path.basename(targetPath))}`);
      return false;
    }
  }

  await writeFile(targetPath, content);
  return true;
}

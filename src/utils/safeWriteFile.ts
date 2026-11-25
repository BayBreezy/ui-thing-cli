import path from "node:path";
import { consola } from "consola";
import kleur from "kleur";
import prompts from "prompts";

import { fileExists } from "./fileExists";
import { writeFile } from "./writeFile";

/**
 * Writes a file, asking before overwriting an existing one unless `forceOverwrite` is set.
 * With `interactive: false` (for `--yes` runs) it never prompts: existing files are skipped
 * with a warning instead, so unattended runs cannot hang or silently destroy local edits.
 * Returns whether the file was written.
 */
export async function safeWriteFile(
  targetPath: string,
  content: string,
  forceOverwrite: boolean,
  promptMessage: string,
  interactive = true
) {
  const exists = await fileExists(targetPath);

  if (exists && !forceOverwrite && !interactive) {
    consola.warn(
      `Skipped existing file ${kleur.cyan(path.basename(targetPath))} (set "force: true" in ui-thing.config.ts to overwrite).`
    );
    return false;
  }

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

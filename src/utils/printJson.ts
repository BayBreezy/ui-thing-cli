/**
 * Writes machine-readable output to stdout. Human messages go through consola/ora, so
 * `--json` output can be piped straight into a JSON parser.
 */
export const printJson = (data: unknown) => {
  process.stdout.write(`${JSON.stringify(data, null, 2)}\n`);
};

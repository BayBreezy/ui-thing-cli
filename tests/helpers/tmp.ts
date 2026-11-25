import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/** Creates a throwaway project folder and writes the given files into it. */
export const makeProject = (files: Record<string, string> = {}) => {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ui-thing-test-")));
  for (const [rel, content] of Object.entries(files)) {
    const abs = path.join(dir, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content);
  }
  return { dir, cleanup: () => fs.rmSync(dir, { recursive: true, force: true }) };
};

/** Captures what a function writes to stdout and parses it as JSON. */
export const captureJson = async (fn: () => Promise<unknown>) => {
  const { vi } = await import("vitest");
  const write = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  try {
    await fn();
    return JSON.parse(write.mock.calls.map((c) => String(c[0])).join(""));
  } finally {
    write.mockRestore();
  }
};

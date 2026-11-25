import fs from "node:fs";
import path from "node:path";

export const LOCK_FILENAME = "ui-thing.lock.json";

export type LockEntry = {
  /** URL or file the item was installed from. */
  source: string;
  type: string;
  /** Paths relative to the project root. */
  files: string[];
  installedAt: string;
};

export type Lock = { items: Record<string, LockEntry> };

const lockPath = (cwd: string) => path.join(cwd, LOCK_FILENAME);

export const readLock = (cwd = process.cwd()): Lock => {
  try {
    const parsed = JSON.parse(fs.readFileSync(lockPath(cwd), "utf-8"));
    if (parsed && typeof parsed.items === "object") return parsed as Lock;
  } catch {
    // missing or unreadable: start fresh
  }
  return { items: {} };
};

export const writeLock = (lock: Lock, cwd = process.cwd()) => {
  if (Object.keys(lock.items).length === 0) {
    fs.rmSync(lockPath(cwd), { force: true });
    return;
  }
  fs.writeFileSync(lockPath(cwd), JSON.stringify(lock, null, 2) + "\n");
};

export const recordInstalled = (
  entries: Record<string, Omit<LockEntry, "installedAt">>,
  cwd = process.cwd()
) => {
  const lock = readLock(cwd);
  const installedAt = new Date().toISOString();
  for (const [name, entry] of Object.entries(entries)) {
    lock.items[name] = { ...entry, installedAt };
  }
  writeLock(lock, cwd);
};

export const removeFromLock = (names: string[], cwd = process.cwd()) => {
  const lock = readLock(cwd);
  for (const name of names) delete lock.items[name];
  writeLock(lock, cwd);
};

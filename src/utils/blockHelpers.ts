import fs from "node:fs";
import path from "node:path";

import { BlockComponent } from "../types";

/**
 * Normalizes a block reference so `BlockHero1`, `BlockHero1.vue`, `Hero 1`, `hero-1` and
 * `BlockChartBar.client.vue` / `Chart Bar` all compare equal.
 */
export const normalizeBlockName = (value: string) =>
  value
    .toLowerCase()
    .replace(/\.vue$/, "")
    .replace(/\.client$/, "")
    .replace(/^block/, "")
    .replace(/[^a-z0-9]/g, "");

/** The id agents should use: the file name without `.vue` (for example `BlockHero1`). */
export const blockId = (block: BlockComponent) => block.fileName.replace(/\.vue$/, "");

/**
 * Resolves the requested names against the block catalog.
 */
export const findBlocks = (names: string[], blocks: BlockComponent[]) => {
  const index = new Map<string, BlockComponent>();
  for (const block of blocks) {
    index.set(normalizeBlockName(block.fileName), block);
    index.set(normalizeBlockName(block.name), block);
  }

  const found: BlockComponent[] = [];
  const missing: string[] = [];
  for (const name of names) {
    const block = index.get(normalizeBlockName(name));
    if (!block) missing.push(name);
    else if (!found.includes(block)) found.push(block);
  }
  return { found, missing };
};

/** A valid npm package name (optionally scoped). */
const NPM_NAME = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;

/** Imports Nuxt already provides, plus aliases and relative paths. */
const PROVIDED = new Set(["vue", "vue-router", "nuxt", "#app", "#imports", "#components"]);

/**
 * Returns the npm packages a block's source imports (package roots, such as `@tiptap/vue-3`
 * for `@tiptap/vue-3/menus` and `swiper` for `swiper/modules`).
 */
export const extractPackageImports = (source: string): string[] => {
  const specifiers = new Set<string>();
  // Only real statements: `import ... from "x"` / `export ... from "x"` starting a line (the
  // clause may span lines), side-effect `import "x"`, and dynamic `import("x")`. This keeps
  // copy text ("Copied from 'clipboard'") and template strings (`from: colorFrom`) out.
  const patterns = [
    /^\s*(?:import|export)\s[^;]*?\bfrom\s*["']([^"'\n]+)["']/gm,
    /^\s*import\s*["']([^"'\n]+)["']/gm,
    /\bimport\s*\(\s*["']([^"'\n]+)["']\s*\)/g,
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) specifiers.add(match[1]);
  }

  const packages = new Set<string>();
  for (const spec of specifiers) {
    if (/^(\.|\/|~|@\/|#|node:)/.test(spec)) continue;
    const parts = spec.split("/");
    const root = spec.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
    if (!root || PROVIDED.has(root) || !NPM_NAME.test(root)) continue;
    packages.add(root);
  }
  return [...packages].sort();
};

/**
 * Packages from the list that the project cannot use yet: not in package.json and not
 * resolvable from node_modules (packages installed as a dependency of something else count
 * as present).
 */
export const missingPackages = (packages: string[], cwd = process.cwd()) => {
  let installed: Record<string, string> = {};
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(cwd, "package.json"), "utf-8"));
    installed = { ...pkg.dependencies, ...pkg.devDependencies };
  } catch {
    // no package.json: rely on node_modules only
  }
  return packages.filter(
    (name) =>
      !installed[name] && !fs.existsSync(path.join(cwd, "node_modules", name, "package.json"))
  );
};

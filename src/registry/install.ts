import fs from "node:fs";
import path from "node:path";
import { consola } from "consola";
import kleur from "kleur";
import _ from "lodash";
import prompts from "prompts";

import { CN_HELPER } from "../templates/cn";
import { UIConfig } from "../types";
import { safeWriteFile } from "../utils/safeWriteFile";
import { buildCssAdditions, mergeEnv } from "./css";
import { recordInstalled } from "./lock";
import { getSrcDir, resolveTargetPath, toAbsoluteInside } from "./paths";
import { resolveRegistryTree } from "./resolve";
import { KNOWN_FILE_TYPES, ResolvedItem } from "./schema";

export type InstallRegistryOptions = {
  /** Skip the confirmation prompt. */
  yes?: boolean;
  /** Overwrite existing files without asking. */
  overwrite?: boolean;
  /** Project root. Defaults to `process.cwd()`. */
  cwd?: string;
};

export type InstallRegistryResult = {
  /** False if the user declined. Nothing was written in that case. */
  confirmed: boolean;
  deps: string[];
  devDeps: string[];
  /** Plain-name registryDependencies the caller should install from the ui-thing catalog. */
  bareDeps: string[];
  docs: string[];
  written: string[];
};

type PlannedFile = { item: ResolvedItem; relPath: string; content: string };

const CN_IMPORT_RE = /import\s*\{[^}]*\bcn\b[^}]*\}\s*from\s*['"](?:~|@)\/lib\/utils['"]/;
const CN_EXPORT_RE = /export\s+(?:const|function)\s+cn\b|export\s*\{[^}]*\bcn\b[^}]*\}/;
const BROWSER_API_RE = /getContext\(|<canvas|\bwindow\.|\bdocument\.|requestAnimationFrame|WebGL/;

const hasPackage = (cwd: string, name: string) => {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(cwd, "package.json"), "utf-8"));
    return Boolean(pkg.dependencies?.[name] ?? pkg.devDependencies?.[name]);
  } catch {
    return false;
  }
};

const planFiles = (items: ResolvedItem[], uiConfig: UIConfig) => {
  const planned: PlannedFile[] = [];
  const skipped: string[] = [];
  const seen = new Map<string, string>();

  for (const resolved of items) {
    for (const file of resolved.item.files ?? []) {
      if (!(KNOWN_FILE_TYPES as readonly string[]).includes(file.type)) {
        skipped.push(`${file.path} (unsupported type ${file.type})`);
        continue;
      }
      if (file.content === undefined) {
        skipped.push(`${file.path} (no inline content)`);
        continue;
      }
      const relPath = resolveTargetPath(file, uiConfig);
      if (seen.has(relPath)) continue;
      seen.set(relPath, resolved.item.name);
      planned.push({ item: resolved, relPath, content: file.content });
    }
  }
  return { planned, skipped };
};

/**
 * Installs registry items (URLs, `@ns/name` refs or local files) into the project:
 * files, css/cssVars, env vars and, if needed, a `cn` helper. npm dependencies are
 * returned rather than installed so the caller can batch them with everything else.
 */
/**
 * Resolves registry refs and works out exactly what installing them would do, without
 * writing anything. Used by `installRegistryRefs` and by `add --dry-run`.
 */
export const planRegistryRefs = async (refs: string[], uiConfig: UIConfig, cwd = process.cwd()) => {
  const { items, bareDeps } = await resolveRegistryTree(refs, uiConfig.registries);
  const { planned, skipped } = planFiles(items, uiConfig);

  // Validate every destination up front so nothing is written if one is unsafe.
  for (const file of planned) toAbsoluteInside(cwd, file.relPath);

  const srcDir = getSrcDir(uiConfig);
  const cnRelPath = path.join(srcDir, "lib", "utils.ts");
  const usesCn = planned.some((f) => CN_IMPORT_RE.test(f.content));
  const cnAbsPath = toAbsoluteInside(cwd, cnRelPath);
  const cnExists = fs.existsSync(cnAbsPath);
  const cnHasExport = cnExists && CN_EXPORT_RE.test(fs.readFileSync(cnAbsPath, "utf-8"));
  const createCn = usesCn && !cnExists;

  const deps = _.uniq(items.flatMap((r) => r.item.dependencies ?? []));
  const devDeps = _.uniq(items.flatMap((r) => r.item.devDependencies ?? []));
  if (createCn) {
    for (const pkg of ["clsx", "tailwind-merge"]) {
      if (!hasPackage(cwd, pkg) && !deps.includes(pkg)) deps.push(pkg);
    }
  }

  return {
    items,
    bareDeps,
    planned,
    skipped,
    deps,
    devDeps,
    usesCn,
    createCn,
    cnRelPath,
    cnAbsPath,
    cnHasExport,
    changesCss: items.some((r) => r.item.css || r.item.cssVars),
    envVars: _.uniq(items.flatMap((r) => Object.keys(r.item.envVars ?? {}))),
  };
};

export const installRegistryRefs = async (
  refs: string[],
  uiConfig: UIConfig,
  options: InstallRegistryOptions = {}
): Promise<InstallRegistryResult> => {
  const cwd = options.cwd ?? process.cwd();
  const {
    items,
    bareDeps,
    planned,
    skipped,
    deps,
    devDeps,
    usesCn,
    createCn,
    cnRelPath,
    cnAbsPath,
    cnHasExport,
  } = await planRegistryRefs(refs, uiConfig, cwd);

  const result: InstallRegistryResult = {
    confirmed: true,
    deps,
    devDeps,
    bareDeps,
    docs: _.compact(items.map((r) => r.item.docs)),
    written: [],
  };

  // Registry items are remote code: show exactly what will happen first.
  consola.log("");
  consola.log(kleur.bold("About to install:"));
  for (const { item, source } of items) {
    consola.log(`  ${kleur.cyan(item.name)} ${kleur.dim(`(${source})`)}`);
  }
  consola.log(kleur.bold("Files:"));
  planned.forEach((f) => consola.log(`  ${f.relPath}`));
  if (createCn) consola.log(`  ${cnRelPath} ${kleur.dim("(cn helper)")}`);
  skipped.forEach((s) => consola.warn(`Skipping ${s}`));
  if (deps.length || devDeps.length) {
    consola.log(`${kleur.bold("Packages:")} ${[...deps, ...devDeps].join(", ")}`);
  }
  if (bareDeps.length) {
    consola.log(`${kleur.bold("ui-thing components:")} ${bareDeps.join(", ")}`);
  }

  if (!options.yes) {
    const { proceed } = await prompts({
      type: "confirm",
      name: "proceed",
      message: "This code comes from a remote registry. Continue?",
      initial: true,
    });
    if (!proceed) {
      consola.info("Cancelled.");
      return { ...result, confirmed: false, deps: [], devDeps: [], bareDeps: [], docs: [] };
    }
  }

  const force = Boolean(uiConfig.force || options.overwrite);
  const writtenByItem: Record<string, string[]> = {};

  for (const file of planned) {
    const abs = toAbsoluteInside(cwd, file.relPath);
    const ok = await safeWriteFile(
      abs,
      file.content,
      force,
      `The file ${kleur.bold(file.relPath)} already exists. Overwrite?`,
      !options.yes
    );
    if (!ok) continue;
    result.written.push(file.relPath);
    (writtenByItem[file.item.item.name] ||= []).push(file.relPath);
  }

  if (createCn) {
    await safeWriteFile(
      cnAbsPath,
      CN_HELPER,
      force,
      `${cnRelPath} already exists. Overwrite?`,
      !options.yes
    );
  } else if (usesCn && !cnHasExport) {
    consola.warn(
      `${cnRelPath} exists but does not export "cn". Add: export const cn = (...i: ClassValue[]) => twMerge(clsx(i))`
    );
  }

  // Tailwind css / cssVars
  const cssItems = items.map((r) => r.item);
  if (cssItems.some((i) => i.css || i.cssVars)) {
    const cssPath = toAbsoluteInside(cwd, uiConfig.tailwindCSSLocation);
    const existing = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, "utf-8") : "";
    const additions = buildCssAdditions(cssItems, existing);
    if (additions) {
      fs.mkdirSync(path.dirname(cssPath), { recursive: true });
      fs.writeFileSync(cssPath, `${existing.trimEnd()}\n\n${additions}\n`);
      consola.success(`Updated ${uiConfig.tailwindCSSLocation}`);
    }
  }

  // Env vars (never overwrites existing keys)
  const envVars = Object.assign({}, ...items.map((r) => r.item.envVars ?? {}));
  if (Object.keys(envVars).length) {
    const envPath = path.join(cwd, ".env");
    const existing = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf-8") : "";
    const merged = mergeEnv(existing, envVars);
    if (merged !== existing) {
      fs.writeFileSync(envPath, merged);
      consola.success("Updated .env");
    }
  }

  if (items.some((r) => r.item.tailwind)) {
    consola.warn(
      "This item ships a Tailwind v3 `tailwind.config` block, which is not applied (ui-thing uses Tailwind v4 CSS config)."
    );
  }

  if (planned.some((f) => f.relPath.endsWith(".vue") && BROWSER_API_RE.test(f.content))) {
    consola.info(
      `Uses browser APIs (canvas/WebGL/window). If you see SSR errors, wrap it in ${kleur.cyan("<ClientOnly>")}.`
    );
  }

  recordInstalled(
    Object.fromEntries(
      items.map(({ item, source }) => [
        item.name,
        { source, type: item.type, files: writtenByItem[item.name] ?? [] },
      ])
    ),
    cwd
  );

  return result;
};

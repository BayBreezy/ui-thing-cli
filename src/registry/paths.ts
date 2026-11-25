import path from "node:path";

import { UIConfig } from "../types";
import { RegistryFile } from "./schema";

/**
 * The directory Nuxt's `~` alias points to, relative to the project root.
 * `app` for Nuxt 4 style layouts, `src` for custom srcDir, otherwise the root.
 */
export const getSrcDir = (uiConfig: UIConfig): string => {
  const first = uiConfig.componentsLocation.replace(/\\/g, "/").split("/")[0];
  return first === "app" || first === "src" ? first : "";
};

const toPosix = (p: string) => p.replace(/\\/g, "/");

const join = (...parts: string[]) => path.posix.join(...parts.filter(Boolean));

/** Rejects absolute paths and anything that tries to climb out with `..`. */
const assertSafeRelative = (p: string) => {
  const posix = toPosix(p);
  if (posix.startsWith("/") || /^[a-zA-Z]:/.test(posix) || path.isAbsolute(p)) {
    throw new Error(`Refusing to write to absolute path: ${p}`);
  }
  if (posix.split("/").includes("..")) {
    throw new Error(`Refusing to write outside the project: ${p}`);
  }
};

/** Top-level folders that live inside Nuxt's srcDir (`app/` in Nuxt 4). */
const SRC_DIR_FOLDERS = new Set([
  "components",
  "composables",
  "utils",
  "plugins",
  "pages",
  "layouts",
  "middleware",
  "assets",
  "lib",
  "stores",
]);

/**
 * Drops the `registry/<style>/<type>/` prefix some registries keep in `path`,
 * and a leading `ui`/`components`/`lib` style folder.
 */
const stripRegistryPrefix = (p: string) => {
  let parts = toPosix(p).split("/");
  if (parts[0] === "registry" && parts.length > 2) parts = parts.slice(2);
  if (
    ["ui", "components", "lib", "hooks", "composables", "blocks"].includes(parts[0]) &&
    parts.length > 1
  ) {
    parts = parts.slice(1);
  }
  return parts.join("/");
};

const placeholderRoots = (uiConfig: UIConfig, srcDir: string): Record<string, string> => ({
  "@ui": uiConfig.componentsLocation,
  "@components": join(srcDir, "components"),
  "@lib": join(srcDir, "lib"),
  "@hooks": uiConfig.composablesLocation,
  "@composables": uiConfig.composablesLocation,
});

/**
 * Maps a registry file to a path relative to the project root.
 *
 * `target` wins when present. shadcn targets are written for a React-ish layout
 * (`components/ui/...`, `lib/...`), so they are remapped onto the user's ui-thing
 * config and Nuxt's srcDir. Without a `target`, the file `type` decides.
 */
export const resolveTargetPath = (file: RegistryFile, uiConfig: UIConfig): string => {
  const srcDir = getSrcDir(uiConfig);
  let result: string;

  if (file.target) {
    const target = toPosix(file.target).replace(/^\.\//, "");
    assertSafeRelative(target.replace(/^~\//, ""));
    const placeholders = placeholderRoots(uiConfig, srcDir);
    const [first, ...rest] = target.split("/");

    if (target.startsWith("~/")) {
      result = target.slice(2);
    } else if (placeholders[first]) {
      result = join(placeholders[first], ...rest);
    } else if (target.startsWith("components/ui/")) {
      result = join(uiConfig.componentsLocation, target.slice("components/ui/".length));
    } else if (first === "hooks" || first === "composables") {
      result = join(uiConfig.composablesLocation, ...rest);
    } else if (first === "utils") {
      result = join(uiConfig.utilsLocation, ...rest);
    } else if (first === "plugins" && uiConfig.pluginsLocation) {
      result = join(uiConfig.pluginsLocation, ...rest);
    } else if (SRC_DIR_FOLDERS.has(first)) {
      result = join(srcDir, target);
    } else {
      result = target;
    }
  } else {
    assertSafeRelative(file.path);
    const rel = stripRegistryPrefix(file.path);
    switch (file.type) {
      case "registry:ui":
      case "registry:component":
      case "registry:block":
        result = join(uiConfig.componentsLocation, rel);
        break;
      case "registry:lib":
        result = join(srcDir, "lib", rel);
        break;
      case "registry:hook":
      case "registry:composable":
        result = join(uiConfig.composablesLocation, rel);
        break;
      default:
        throw new Error(`File "${file.path}" (${file.type}) needs a "target" to be installed.`);
    }
  }

  assertSafeRelative(result);
  return path.normalize(result);
};

/** Throws unless `relative` stays inside `cwd`. Returns the absolute path. */
export const toAbsoluteInside = (cwd: string, relative: string): string => {
  const absolute = path.resolve(cwd, relative);
  const rel = path.relative(cwd, absolute);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error(`Refusing to write outside the project: ${relative}`);
  }
  return absolute;
};

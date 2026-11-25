import { RegistryItem } from "./schema";

/** At-rules that are single statements: `@import "x";` is `{ '@import "x"': {} }`. */
const STATEMENT_RULES = /^@(import|plugin|source|config|custom-variant)\b/;

type CssNode = Record<string, unknown>;

const serialize = (node: CssNode, depth = 0): string => {
  const pad = "  ".repeat(depth);
  const out: string[] = [];

  for (const [key, value] of Object.entries(node)) {
    if (typeof value === "string" || typeof value === "number") {
      out.push(`${pad}${key}: ${value};`);
    } else if (value && typeof value === "object") {
      const children = value as CssNode;
      if (STATEMENT_RULES.test(key) && Object.keys(children).length === 0) {
        out.push(`${pad}${key};`);
      } else {
        out.push(`${pad}${key} {`, serialize(children, depth + 1), `${pad}}`);
      }
    }
  }
  return out.join("\n");
};

const block = (selector: string, vars: Record<string, string>) =>
  `${selector} {\n${Object.entries(vars)
    .map(([name, value]) => `  --${name.replace(/^--/, "")}: ${value};`)
    .join("\n")}\n}`;

/** Drops variables whose name is already defined in the stylesheet. */
const newVars = (vars: Record<string, string> | undefined, existing: string) =>
  Object.fromEntries(
    Object.entries(vars ?? {}).filter(([name]) => {
      const clean = name.replace(/^--/, "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return !new RegExp(`--${clean}\\s*:`).test(existing);
    })
  );

/**
 * Builds the CSS an item contributes (css rules and cssVars) and skips anything
 * already present, so installing the same item twice does not duplicate rules.
 * Returns an empty string when there is nothing to add.
 */
export const buildCssAdditions = (
  items: Pick<RegistryItem, "css" | "cssVars">[],
  existingCss: string
): string => {
  const chunks: string[] = [];
  let current = existingCss;

  const push = (chunk: string) => {
    chunks.push(chunk);
    current += `\n${chunk}`;
  };

  for (const item of items) {
    for (const [key, value] of Object.entries(item.css ?? {})) {
      if (current.includes(key)) continue;
      push(serialize({ [key]: value }));
    }

    // Compare against the CSS from before this item's vars, so a name that appears in
    // both :root and .dark is not mistaken for "already defined" by the second block.
    const before = current;
    const theme = newVars(item.cssVars?.theme, before);
    if (Object.keys(theme).length) push(block("@theme inline", theme));
    const light = newVars(item.cssVars?.light, before);
    if (Object.keys(light).length) push(block(":root", light));
    const dark = newVars(item.cssVars?.dark, before);
    if (Object.keys(dark).length) push(block(".dark", dark));
  }

  return chunks.join("\n\n");
};

/**
 * Appends env vars that are not already defined. Existing keys are never overwritten.
 */
export const mergeEnv = (existing: string, vars: Record<string, string>): string => {
  const missing = Object.entries(vars).filter(
    ([key]) => !new RegExp(`^\\s*${key}\\s*=`, "m").test(existing)
  );
  if (missing.length === 0) return existing;
  const separator = existing && !existing.endsWith("\n") ? "\n" : "";
  return existing + separator + missing.map(([k, v]) => `${k}=${v}`).join("\n") + "\n";
};

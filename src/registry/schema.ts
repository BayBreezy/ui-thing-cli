import { z } from "zod";

/**
 * Registry item file types we know how to place inside a Nuxt project.
 * `registry:composable` is the shadcn-vue addition on top of the shadcn-ui list.
 */
export const KNOWN_FILE_TYPES = [
  "registry:ui",
  "registry:component",
  "registry:block",
  "registry:lib",
  "registry:hook",
  "registry:composable",
  "registry:page",
  "registry:file",
  "registry:theme",
  "registry:style",
] as const;

const stringRecord = z.record(z.string(), z.string());

const registryFileSchema = z.object({
  path: z.string().min(1),
  type: z.string(),
  content: z.string().optional(),
  target: z.string().optional(),
});

export const registryItemSchema = z.object({
  name: z.string().min(1),
  type: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  dependencies: z.array(z.string()).optional(),
  devDependencies: z.array(z.string()).optional(),
  registryDependencies: z.array(z.string()).optional(),
  files: z.array(registryFileSchema).optional(),
  cssVars: z
    .object({
      theme: stringRecord.optional(),
      light: stringRecord.optional(),
      dark: stringRecord.optional(),
    })
    .optional(),
  css: z.record(z.string(), z.unknown()).optional(),
  envVars: stringRecord.optional(),
  tailwind: z.unknown().optional(),
  docs: z.string().optional(),
});

export const registryIndexSchema = z.object({
  name: z.string().optional(),
  homepage: z.string().optional(),
  items: z.array(
    z.object({
      name: z.string(),
      type: z.string().optional(),
      title: z.string().optional(),
      description: z.string().optional(),
    })
  ),
});

export type RegistryFile = z.infer<typeof registryFileSchema>;
export type RegistryItem = z.infer<typeof registryItemSchema>;
export type RegistryIndex = z.infer<typeof registryIndexSchema>;

/**
 * A registry namespace entry as stored in `ui-thing.config.ts`.
 * Either a URL template containing `{name}` or an object with headers/params.
 */
export type RegistryNamespaceConfig =
  string | { url: string; headers?: Record<string, string>; params?: Record<string, string> };

export type RegistriesConfig = Record<string, RegistryNamespaceConfig>;

/** An item together with where it was fetched from (URL or absolute file path). */
export type ResolvedItem = { item: RegistryItem; source: string };

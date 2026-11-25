import fs from "node:fs/promises";
import path from "node:path";
import axios from "axios";

import {
  RegistriesConfig,
  RegistryIndex,
  registryIndexSchema,
  RegistryItem,
  registryItemSchema,
  RegistryNamespaceConfig,
} from "./schema";

/**
 * Registries the user does not have to configure. Anything in `ui-thing.config.ts`
 * under `registries` takes precedence.
 */
export const DEFAULT_REGISTRIES: RegistriesConfig = {
  "@vue-bits": "https://vue-bits.dev/r/{name}.json",
  "@nxui": "https://nxui.geoql.in/r/{name}.json",
};

export type RefKind = "url" | "namespace" | "local" | "bare";

const NAMESPACE_RE = /^@[a-zA-Z0-9][\w.-]*\/.+$/;

/**
 * Works out what a CLI argument refers to.
 * Anything that is not a URL, `@ns/name` or a path to a `.json` file is a plain
 * ui-thing component slug.
 */
export const classifyRef = (ref: string): RefKind => {
  if (/^https?:\/\//i.test(ref)) return "url";
  if (NAMESPACE_RE.test(ref)) return "namespace";
  if (/^(\.{1,2}\/|\/|~\/)/.test(ref) && ref.endsWith(".json")) return "local";
  return "bare";
};

export const isRegistryRef = (ref: string) => classifyRef(ref) !== "bare";

const expandEnv = (value: string) =>
  value.replace(/\$\{(\w+)\}/g, (_, name: string) => process.env[name] ?? "");

const mergeRegistries = (registries?: RegistriesConfig): RegistriesConfig => ({
  ...DEFAULT_REGISTRIES,
  ...(registries ?? {}),
});

type ResolvedRequest = {
  url: string;
  headers: Record<string, string>;
};

/**
 * Turns `@ns/name` into a request using the namespace template.
 */
const resolveNamespaceRequest = (ref: string, registries?: RegistriesConfig): ResolvedRequest => {
  const slash = ref.indexOf("/");
  const namespace = ref.slice(0, slash);
  const name = ref.slice(slash + 1);
  const config: RegistryNamespaceConfig | undefined = mergeRegistries(registries)[namespace];

  if (!config) {
    throw new Error(
      `Unknown registry "${namespace}". Add it with: ui-thing registry add-namespace ${namespace} <url-template>`
    );
  }

  const template = typeof config === "string" ? config : config.url;
  if (!template.includes("{name}")) {
    throw new Error(`Registry "${namespace}" URL must contain the {name} placeholder.`);
  }

  const url = new URL(expandEnv(template).replace("{name}", name));
  if (typeof config !== "string" && config.params) {
    for (const [key, value] of Object.entries(config.params)) {
      url.searchParams.set(key, expandEnv(value));
    }
  }

  const headers: Record<string, string> = {};
  if (typeof config !== "string" && config.headers) {
    for (const [key, value] of Object.entries(config.headers)) {
      headers[key] = expandEnv(value);
    }
  }
  return { url: url.toString(), headers };
};

/**
 * The canonical location of a ref: an absolute URL or an absolute file path.
 * Used to de-duplicate items while resolving dependencies.
 */
export const resolveSource = (ref: string, registries?: RegistriesConfig): ResolvedRequest => {
  switch (classifyRef(ref)) {
    case "url":
      return { url: ref, headers: {} };
    case "namespace":
      return resolveNamespaceRequest(ref, registries);
    case "local": {
      const expanded = ref.startsWith("~/") ? path.join(process.env.HOME ?? "", ref.slice(2)) : ref;
      return { url: path.resolve(process.cwd(), expanded), headers: {} };
    }
    default:
      throw new Error(`"${ref}" is not a registry reference.`);
  }
};

const isRemote = (source: string) => /^https?:\/\//i.test(source);

const cache = new Map<string, Promise<unknown>>();

/** Clears the in-memory request cache (used by tests). */
export const clearRegistryCache = () => cache.clear();

const fetchJson = (source: string, headers: Record<string, string>): Promise<unknown> => {
  const cached = cache.get(source);
  if (cached) return cached;

  const request = (async () => {
    if (!isRemote(source)) {
      return JSON.parse(await fs.readFile(source, "utf-8"));
    }
    try {
      const { data } = await axios.get<unknown>(source, {
        headers,
        timeout: 30_000,
        responseType: "json",
      });
      return data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 404) throw new Error(`Not found: ${source}`, { cause: error });
        if (status === 401 || status === 403) {
          throw new Error(
            `Not authorized to fetch ${source} (HTTP ${status}). Check your headers.`,
            { cause: error }
          );
        }
        throw new Error(`Failed to fetch ${source}: ${error.message}`, { cause: error });
      }
      throw error;
    }
  })();

  cache.set(source, request);
  // Do not cache failures.
  request.catch(() => cache.delete(source));
  return request;
};

/**
 * Fetches and validates a single registry item.
 */
export const fetchRegistryItem = async (
  ref: string,
  registries?: RegistriesConfig
): Promise<{ item: RegistryItem; source: string }> => {
  const { url, headers } = resolveSource(ref, registries);
  const data = await fetchJson(url, headers);

  // Some hosts answer 200 with an HTML page for missing items.
  if (typeof data === "string" || data === null || typeof data !== "object") {
    throw new Error(`${url} did not return registry JSON (is the item name correct?).`);
  }

  const parsed = registryItemSchema.safeParse(data);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new Error(
      `${url} is not a valid registry item: ${issue.path.join(".") || "root"} ${issue.message}`
    );
  }
  return { item: parsed.data, source: url };
};

/**
 * Fetches a registry's `registry.json` index.
 * `source` may be `@ns`, a URL to an index file, or a site origin.
 */
export const fetchRegistryIndex = async (
  source: string,
  registries?: RegistriesConfig
): Promise<{ index: RegistryIndex; url: string }> => {
  const candidates: ResolvedRequest[] = [];

  if (source.startsWith("@") && !source.includes("/")) {
    candidates.push(resolveNamespaceRequest(`${source}/registry`, registries));
  } else if (/^https?:\/\//i.test(source)) {
    if (source.endsWith(".json")) {
      candidates.push({ url: source, headers: {} });
    } else {
      const origin = source.replace(/\/+$/, "");
      candidates.push(
        { url: `${origin}/r/registry.json`, headers: {} },
        { url: `${origin}/registry.json`, headers: {} }
      );
    }
  } else {
    throw new Error(`"${source}" must be a namespace like @nxui or a URL.`);
  }

  let lastError: unknown;
  for (const { url, headers } of candidates) {
    try {
      const data = await fetchJson(url, headers);
      const parsed = registryIndexSchema.safeParse(data);
      if (parsed.success) return { index: parsed.data, url };
      lastError = new Error(`${url} is not a valid registry index.`);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`Could not load registry ${source}.`);
};

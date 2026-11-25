import { classifyRef, fetchRegistryItem, resolveSource } from "./fetch";
import { RegistriesConfig, ResolvedItem } from "./schema";

export type ResolvedTree = {
  /** Items in install order: dependencies come before the items that need them. */
  items: ResolvedItem[];
  /**
   * `registryDependencies` that are plain names (e.g. `button`). The caller resolves
   * these against the ui-thing component catalog.
   */
  bareDeps: string[];
};

/**
 * Fetches the requested items and walks `registryDependencies` recursively.
 * Dependencies may be URLs, `@ns/name` refs, local files or plain ui-thing slugs.
 */
export const resolveRegistryTree = async (
  refs: string[],
  registries?: RegistriesConfig
): Promise<ResolvedTree> => {
  const items: ResolvedItem[] = [];
  const bareDeps = new Set<string>();
  const visited = new Set<string>();

  const visit = async (ref: string) => {
    if (classifyRef(ref) === "bare") {
      bareDeps.add(ref);
      return;
    }

    const { url } = resolveSource(ref, registries);
    if (visited.has(url)) return;
    visited.add(url);

    const resolved = await fetchRegistryItem(ref, registries);
    for (const dep of resolved.item.registryDependencies ?? []) {
      await visit(dep);
    }
    items.push(resolved);
  };

  for (const ref of refs) {
    await visit(ref);
  }

  return { items, bareDeps: [...bareDeps] };
};

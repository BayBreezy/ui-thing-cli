import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  classifyRef,
  clearRegistryCache,
  fetchRegistryIndex,
  fetchRegistryItem,
} from "../../src/registry/fetch";
import { resolveRegistryTree } from "../../src/registry/resolve";

const item = (name: string, extra: object = {}) => ({
  name,
  type: "registry:ui",
  files: [{ path: `${name}.vue`, type: "registry:ui", content: "<div/>" }],
  ...extra,
});

describe("registry/fetch", () => {
  let mock: MockAdapter;
  beforeEach(() => {
    mock = new MockAdapter(axios);
    clearRegistryCache();
  });
  afterEach(() => mock.restore());

  it("classifies refs", () => {
    expect(classifyRef("https://nxui.geoql.in/r/fluid-glass.json")).toBe("url");
    expect(classifyRef("@vue-bits/HoloMosaic")).toBe("namespace");
    expect(classifyRef("./item.json")).toBe("local");
    expect(classifyRef("button")).toBe("bare");
    expect(classifyRef("@scope-without-name")).toBe("bare");
  });

  it("fetches an item by URL", async () => {
    mock.onGet("https://x.dev/r/a.json").reply(200, item("a"));
    const { item: got } = await fetchRegistryItem("https://x.dev/r/a.json");
    expect(got.name).toBe("a");
  });

  it("resolves built-in and configured namespaces", async () => {
    mock.onGet("https://vue-bits.dev/r/HoloMosaic.json").reply(200, item("HoloMosaic"));
    mock.onGet("https://acme.dev/r/b.json?token=t").reply(200, item("b"));
    expect((await fetchRegistryItem("@vue-bits/HoloMosaic")).item.name).toBe("HoloMosaic");
    process.env.ACME_TOKEN = "t";
    const { item: b } = await fetchRegistryItem("@acme/b", {
      "@acme": { url: "https://acme.dev/r/{name}.json", params: { token: "${ACME_TOKEN}" } },
    });
    expect(b.name).toBe("b");
  });

  it("errors on unknown namespace", async () => {
    await expect(fetchRegistryItem("@nope/x")).rejects.toThrow(/Unknown registry/);
  });

  it("rejects HTML responses served with 200", async () => {
    mock.onGet("https://x.dev/r/missing.json").reply(200, "<!doctype html><html></html>");
    await expect(fetchRegistryItem("https://x.dev/r/missing.json")).rejects.toThrow(
      /did not return registry JSON/
    );
  });

  it("rejects invalid items and reports 404s", async () => {
    mock.onGet("https://x.dev/r/bad.json").reply(200, { nope: true });
    await expect(fetchRegistryItem("https://x.dev/r/bad.json")).rejects.toThrow(/not a valid/);
    mock.onGet("https://x.dev/r/gone.json").reply(404);
    await expect(fetchRegistryItem("https://x.dev/r/gone.json")).rejects.toThrow(/Not found/);
  });

  it("loads an index from a namespace", async () => {
    mock.onGet("https://vue-bits.dev/r/registry.json").reply(200, { items: [{ name: "A" }] });
    const { index } = await fetchRegistryIndex("@vue-bits");
    expect(index.items[0].name).toBe("A");
  });
});

describe("registry/resolve", () => {
  let mock: MockAdapter;
  beforeEach(() => {
    mock = new MockAdapter(axios);
    clearRegistryCache();
  });
  afterEach(() => mock.restore());

  it("resolves dependencies first, handles cycles and collects bare deps", async () => {
    mock
      .onGet("https://x.dev/a.json")
      .reply(200, item("a", { registryDependencies: ["https://x.dev/b.json", "button"] }));
    mock
      .onGet("https://x.dev/b.json")
      .reply(200, item("b", { registryDependencies: ["https://x.dev/a.json"] }));
    const tree = await resolveRegistryTree(["https://x.dev/a.json"]);
    expect(tree.items.map((i) => i.item.name)).toEqual(["b", "a"]);
    expect(tree.bareDeps).toEqual(["button"]);
  });
});

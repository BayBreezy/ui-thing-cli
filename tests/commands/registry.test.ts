import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { registry } from "../../src/commands/registry";
import { clearRegistryCache } from "../../src/registry/fetch";
import { DEFAULT_CONFIG_NUXT4 } from "../../src/utils/constants";
import { captureJson } from "../helpers/tmp";

vi.mock("../../src/utils/config");
vi.mock("../../src/utils/logger");

describe("commands/registry --json", () => {
  let mock: MockAdapter;
  beforeEach(async () => {
    vi.clearAllMocks();
    clearRegistryCache();
    mock = new MockAdapter(axios);
    const { loadConfigOrDefaults } = await import("../../src/utils/config");
    vi.mocked(loadConfigOrDefaults).mockResolvedValue({
      config: {
        ...DEFAULT_CONFIG_NUXT4,
        registries: { "@acme": "https://acme.dev/r/{name}.json" },
      },
      fromFile: true,
    });
  });
  afterEach(() => mock.restore());

  it("lists configured registries as a namespace map", async () => {
    const out = await captureJson(() => registry.parseAsync(["list", "--json"], { from: "user" }));
    expect(out).toMatchObject({
      "@vue-bits": "https://vue-bits.dev/r/{name}.json",
      "@acme": "https://acme.dev/r/{name}.json",
    });
  });

  it("lists items with install refs", async () => {
    mock
      .onGet("https://acme.dev/r/registry.json")
      .reply(200, { items: [{ name: "glass", type: "registry:ui", description: "Shiny" }] });
    const out = await captureJson(() =>
      registry.parseAsync(["list", "@acme", "--json"], { from: "user" })
    );
    expect(out).toEqual([
      { ref: "@acme/glass", name: "glass", type: "registry:ui", title: null, description: "Shiny" },
    ]);
  });

  it("searches one registry and returns matches only", async () => {
    mock.onGet("https://acme.dev/r/registry.json").reply(200, {
      items: [
        { name: "glass" },
        { name: "button", description: "A glassy button" },
        { name: "card" },
      ],
    });
    const out = await captureJson(() =>
      registry.parseAsync(["search", "glass", "@acme", "--json"], { from: "user" })
    );
    expect(out.map((i: any) => i.ref)).toEqual(["@acme/glass", "@acme/button"]);
  });
});

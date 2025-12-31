import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ProseComponent } from "../../src/types";
import { fetchProseComponents } from "../../src/utils/fetchProseComponents";

describe("utils/fetchProseComponents", () => {
  let mockAxios: MockAdapter;

  beforeEach(() => {
    mockAxios = new MockAdapter(axios);
    vi.clearAllMocks();
  });

  afterEach(() => {
    mockAxios.restore();
    vi.restoreAllMocks();
  });

  it("should fetch prose components from default API endpoint", async () => {
    const mockProseComponents: ProseComponent[] = [
      {
        name: "Heading",
        value: "heading",
        fileName: "ProseH1.vue",
        filePath: "/prose/ProseH1.vue",
        file: { fileName: "ProseH1.vue", dirPath: "/prose", fileContent: "<template></template>" },
        utils: [],
        composables: [],
        plugins: [],
      },
    ];

    mockAxios.onGet("https://uithing.com/api/prose").reply(200, mockProseComponents);

    const result = await fetchProseComponents();

    expect(result).toEqual(mockProseComponents);
    expect(result).toHaveLength(1);
  });

  it("should fetch prose components from custom API endpoint via env var", async () => {
    const customUrl = "https://custom-api.com/prose";
    process.env.PROSE_COMPONENTS_API = customUrl;

    const mockProseComponents: ProseComponent[] = [];

    mockAxios.onGet(customUrl).reply(200, mockProseComponents);

    const result = await fetchProseComponents();

    expect(result).toEqual(mockProseComponents);
    delete process.env.PROSE_COMPONENTS_API;
  });

  it("should handle API errors", async () => {
    mockAxios.onGet("https://uithing.com/api/prose").reply(500);

    await expect(fetchProseComponents()).rejects.toThrow();
  });
});

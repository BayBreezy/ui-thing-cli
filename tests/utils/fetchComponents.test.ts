import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Component } from "../../src/types";
import { fetchComponents } from "../../src/utils/fetchComponents";

describe("utils/fetchComponents", () => {
  let mockAxios: MockAdapter;

  beforeEach(() => {
    mockAxios = new MockAdapter(axios);
    vi.clearAllMocks();
  });

  afterEach(() => {
    mockAxios.restore();
    vi.restoreAllMocks();
  });

  it("should fetch components from default API endpoint", async () => {
    const mockComponents: Component[] = [
      {
        name: "Button",
        value: "button",
        files: [],
        utils: [],
        composables: [],
        plugins: [],
      },
      {
        name: "Input",
        value: "input",
        files: [],
        utils: [],
        composables: [],
        plugins: [],
      },
    ];

    mockAxios.onGet().reply(200, mockComponents);

    const result = await fetchComponents();

    expect(result).toEqual(mockComponents);
    expect(result).toHaveLength(2);
  });

  it("should fetch components from custom API endpoint via env var", async () => {
    const customUrl = "https://custom-api.com/components";
    process.env.COMPONENTS_API = customUrl;

    const mockComponents: Component[] = [
      {
        name: "Card",
        value: "card",
        files: [],
        utils: [],
        composables: [],
        plugins: [],
      },
    ];

    mockAxios.onGet(customUrl).reply(200, mockComponents);

    const result = await fetchComponents();

    expect(result).toEqual(mockComponents);
    delete process.env.COMPONENTS_API;
  });

  it("should handle API errors gracefully", async () => {
    mockAxios.onGet("https://uithing.com/api/components").reply(500);

    await expect(fetchComponents()).rejects.toThrow();
  });

  it("should handle network errors", async () => {
    mockAxios.onGet("https://uithing.com/api/components").networkError();

    await expect(fetchComponents()).rejects.toThrow();
  });

  it("should return empty array when API returns no data", async () => {
    mockAxios.onGet("https://uithing.com/api/components").reply(200, []);

    const result = await fetchComponents();

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });
});

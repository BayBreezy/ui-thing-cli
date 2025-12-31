import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fetchBlockCategories } from "../../src/utils/fetchBlockCategories";

describe("utils/fetchBlockCategories", () => {
  let mockAxios: MockAdapter;

  beforeEach(() => {
    mockAxios = new MockAdapter(axios);
    vi.clearAllMocks();
  });

  afterEach(() => {
    mockAxios.restore();
    vi.restoreAllMocks();
  });

  it("should fetch block categories from default API endpoint", async () => {
    const mockCategories = ["landing", "dashboard", "auth", "marketing"];

    mockAxios.onGet("https://uithing.com/api/blocks/categories").reply(200, mockCategories);

    const result = await fetchBlockCategories();

    expect(result).toEqual(mockCategories);
    expect(result).toHaveLength(4);
  });

  it("should fetch categories from custom API endpoint via env var", async () => {
    const customUrl = "https://custom-api.com/blocks/categories";
    process.env.BLOCK_CATEGORIES_API = customUrl;

    const mockCategories = ["category1", "category2"];

    mockAxios.onGet(customUrl).reply(200, mockCategories);

    const result = await fetchBlockCategories();

    expect(result).toEqual(mockCategories);
    delete process.env.BLOCK_CATEGORIES_API;
  });

  it("should handle API errors", async () => {
    mockAxios.onGet("https://uithing.com/api/blocks/categories").reply(404);

    await expect(fetchBlockCategories()).rejects.toThrow();
  });

  it("should return empty array when no categories exist", async () => {
    mockAxios.onGet("https://uithing.com/api/blocks/categories").reply(200, []);

    const result = await fetchBlockCategories();

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });
});

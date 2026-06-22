import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BlockComponent } from "../../src/types";
import { fetchBlocks } from "../../src/utils/fetchBlocks";

describe("utils/fetchBlocks", () => {
  let mockAxios: MockAdapter;

  beforeEach(() => {
    mockAxios = new MockAdapter(axios);
    vi.clearAllMocks();
  });

  afterEach(() => {
    mockAxios.restore();
    vi.restoreAllMocks();
  });

  it("should fetch blocks from default API endpoint", async () => {
    const mockBlocks: BlockComponent[] = [
      {
        name: "Hero",
        fileName: "Hero.vue",
        file: "<template></template>",
        category: "landing",
        path: "/landing",
      },
    ];

    mockAxios.onGet("https://uithing.com/api/blocks").reply(200, mockBlocks);

    const result = await fetchBlocks();

    expect(result).toEqual(mockBlocks);
    expect(result).toHaveLength(1);
  });

  it("should fetch blocks from custom API endpoint via env var", async () => {
    const customUrl = "https://custom-api.com/blocks";
    process.env.BLOCKS_API = customUrl;

    const mockBlocks: BlockComponent[] = [];

    mockAxios.onGet(customUrl).reply(200, mockBlocks);

    const result = await fetchBlocks();

    expect(result).toEqual(mockBlocks);
    delete process.env.BLOCKS_API;
  });

  it("should call process.exit(1) on API error", async () => {
    const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {}) as any);
    mockAxios.onGet("https://uithing.com/api/blocks").reply(500);

    await fetchBlocks();

    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("should call process.exit(1) on network error", async () => {
    const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {}) as any);
    mockAxios.onGet("https://uithing.com/api/blocks").networkError();

    await fetchBlocks();

    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});

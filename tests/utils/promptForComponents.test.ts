import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Component } from "../../src/types";
import { promptUserForComponents } from "../../src/utils/promptForComponents";

// Mock prompts
vi.mock("prompts");

describe("utils/promptForComponents", () => {
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
    {
      name: "Card",
      value: "card",
      files: [],
      utils: [],
      composables: [],
      plugins: [],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return all component values when all is true", async () => {
    const result = await promptUserForComponents(true, mockComponents);

    expect(result).toEqual(["button", "input", "card"]);
    expect(result).toHaveLength(3);
  });

  it("should prompt user for selection when all is false", async () => {
    const prompts = await import("prompts");
    vi.mocked(prompts.default).mockResolvedValue({ components: ["button", "input"] });

    const result = await promptUserForComponents(false, mockComponents);

    expect(result).toEqual(["button", "input"]);
    expect(prompts.default).toHaveBeenCalled();
  });

  it("should return empty array when user cancels selection", async () => {
    const prompts = await import("prompts");
    vi.mocked(prompts.default).mockResolvedValue({ components: undefined });

    const result = await promptUserForComponents(false, mockComponents);

    expect(result).toBeUndefined();
  });

  it("should handle empty components list", async () => {
    const result = await promptUserForComponents(true, []);

    expect(result).toEqual([]);
  });

  it("should pass correct choices to prompts", async () => {
    const prompts = await import("prompts");
    vi.mocked(prompts.default).mockResolvedValue({ components: [] });

    await promptUserForComponents(false, mockComponents);

    expect(prompts.default).toHaveBeenCalledWith({
      type: "autocompleteMultiselect",
      name: "components",
      message: "Select the components you want to add",
      choices: [
        { title: "Button", value: "button" },
        { title: "Input", value: "input" },
        { title: "Card", value: "card" },
      ],
    });
  });
});

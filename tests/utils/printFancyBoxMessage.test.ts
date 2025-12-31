import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { printFancyBoxMessage } from "../../src/utils/printFancyBoxMessage";

describe("utils/printFancyBoxMessage", () => {
  let consoleLogSpy: any;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should print a fancy box message with title", () => {
    printFancyBoxMessage("Test Title");

    expect(consoleLogSpy).toHaveBeenCalled();
    const output = consoleLogSpy.mock.calls[0][0];
    // ASCII art contains the title but not as plain text
    expect(output).toBeTruthy();
    expect(typeof output).toBe("string");
  });

  it("should print a fancy box message with title and description", () => {
    printFancyBoxMessage("Test Title", "Test description");

    // Should be called at least once (box is always printed)
    expect(consoleLogSpy).toHaveBeenCalled();
    const lastCall = consoleLogSpy.mock.calls[consoleLogSpy.mock.calls.length - 1][0];
    expect(lastCall).toContain("Test description");
    printFancyBoxMessage("Test", undefined, {
      box: { borderColor: "red", borderStyle: "double" },
    });

    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it("should accept custom figlet font", () => {
    printFancyBoxMessage("Test", undefined, {
      figletFont: "Banner",
    });

    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it("should handle empty title gracefully", () => {
    printFancyBoxMessage("");

    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it("should handle special characters in title", () => {
    printFancyBoxMessage("Test!@#$%");

    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it("should only print box when no description provided", () => {
    printFancyBoxMessage("Test");

    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
  });
});

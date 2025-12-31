import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as fileExistsModule from "../../src/utils/fileExists";
import { writeFile } from "../../src/utils/writeFile";

describe("utils/writeFile", () => {
  const mockFilePath = "/test/dir/file.txt";
  const mockContent = "test content";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should create directory and write file when file does not exist", async () => {
    // Mock fileExists to return false
    vi.spyOn(fileExistsModule, "fileExists").mockResolvedValue(false);
    vi.spyOn(fs, "existsSync").mockReturnValue(false);
    vi.spyOn(fs, "mkdirSync").mockImplementation(() => undefined);
    vi.spyOn(fs, "writeFileSync").mockImplementation(() => {});

    await writeFile(mockFilePath, mockContent);

    expect(fileExistsModule.fileExists).toHaveBeenCalledWith(mockFilePath);
    expect(fs.existsSync).toHaveBeenCalledWith(path.dirname(mockFilePath));
    expect(fs.mkdirSync).toHaveBeenCalledWith(path.dirname(mockFilePath), { recursive: true });
    expect(fs.writeFileSync).toHaveBeenCalledWith(mockFilePath, mockContent);
  });

  it("should write file when file already exists", async () => {
    vi.spyOn(fileExistsModule, "fileExists").mockResolvedValue(true);
    vi.spyOn(fs, "writeFileSync").mockImplementation(() => {});

    await writeFile(mockFilePath, mockContent);

    expect(fileExistsModule.fileExists).toHaveBeenCalledWith(mockFilePath);
    expect(fs.writeFileSync).toHaveBeenCalledWith(mockFilePath, mockContent);
  });

  it("should not create directory if it already exists", async () => {
    vi.spyOn(fileExistsModule, "fileExists").mockResolvedValue(false);
    vi.spyOn(fs, "existsSync").mockReturnValue(true);
    const mkdirSpy = vi.spyOn(fs, "mkdirSync").mockImplementation(() => undefined);
    vi.spyOn(fs, "writeFileSync").mockImplementation(() => {});

    await writeFile(mockFilePath, mockContent);

    expect(mkdirSpy).not.toHaveBeenCalled();
    expect(fs.writeFileSync).toHaveBeenCalledWith(mockFilePath, mockContent);
  });
});

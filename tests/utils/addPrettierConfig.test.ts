import fse from "fs-extra";
import * as prompts from "prompts";
import * as  execa from "execa";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import * as testingFn from "../../src/utils/addPrettierConfig";

const currentDir = process.cwd();
const question = "A prettier config file already exists. Overwrite?";
const promptOptions = {
  name: "overwrite",
  type: "confirm",
  message: question,
  initial: true,
};

describe("utils/addPrettierConfig", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it(
    "should ask the user if they want to overwrite the existing prettier config file if one exists",
    async () => {
      vi.spyOn(fse, "existsSync").mockImplementation(() => true);
      vi.mock('prompts', async () => {
        const prompts = await import('prompts');
        return {
          ...prompts,
          default: async () => {
            return { overwrite: false };
          }
        }
      });

      const result = await testingFn.addPrettierConfig();
      expect(result).toBe(false);
      expect(fse.existsSync).toHaveBeenCalledTimes(1);
    }
  );

  it('should create config file if one does not exist', async () => {
    vi.spyOn(fse, "existsSync").mockImplementation(() => false);
    vi.spyOn(fse, "writeFile").mockResolvedValue();

    const result = await testingFn.addPrettierConfig(currentDir, false);
    expect(result).toBe(true);
    expect(fse.existsSync).toHaveBeenCalledTimes(1);
    expect(fse.writeFile).toHaveBeenCalledTimes(1);
  })

  it('should format files with prettier if format is true', async () => {
    vi.spyOn(execa, '$')
    vi.spyOn(testingFn, 'addPrettierConfig')
    vi.spyOn(fse, "existsSync").mockImplementation(() => false);
    vi.spyOn(fse, "writeFile").mockResolvedValue();
    vi.mock('execa', async () => { 
      const execa = await import('execa');
      return {
        ...execa,
        '$': async () => {
          return true
        },
        default: async () => {
          return true
        }
      }
    });

    const result = await testingFn.addPrettierConfig(currentDir, true);
    expect(result).toBe(true);
    expect(fse.existsSync).toHaveBeenCalledTimes(1);
    expect(fse.writeFile).toHaveBeenCalledTimes(1);
    expect(execa.$).toHaveBeenCalledTimes(1);
    expect(testingFn.addPrettierConfig).toHaveBeenCalledTimes(1);
  
  })
});

import axios from "axios";
import { consola } from "consola";
import dotenv from "dotenv";
import ora from "ora";

import { BlockComponent } from "../types";

dotenv.config();

export const fetchBlocks = async (): Promise<BlockComponent[]> => {
  const spinner = ora("Fetching blocks...").start();
  try {
    const { data } = await axios.get<BlockComponent[]>(
      process.env.BLOCKS_API || "https://uithing.com/api/blocks"
    );
    spinner.succeed("Blocks fetched.");
    return data;
  } catch {
    spinner.fail("Failed to fetch blocks.");
    consola.error("Could not reach the UI Thing API. Check your network connection.");
    process.exit(1);
  }
};

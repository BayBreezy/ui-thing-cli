import axios from "axios";
import dotenv from "dotenv";
import ora from "ora";

import { BlockComponent } from "../types";

dotenv.config();

/**
 * Fetch block components from UI Thing API.
 */
export const fetchBlocks = async () => {
  const spinner = ora("Fetching blocks...").start();

  const { data } = await axios.get<BlockComponent[]>(
    process.env.BLOCKS_API || "https://uithing.com/api/blocks"
  );

  spinner.succeed("Blocks fetched.");
  return data;
};

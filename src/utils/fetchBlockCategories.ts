import axios from "axios";
import dotenv from "dotenv";
import ora from "ora";

dotenv.config();

/**
 * Fetch block categories from UI Thing API.
 */
export const fetchBlockCategories = async () => {
  const spinner = ora("Fetching block categories...").start();

  const { data } = await axios.get<string[]>(
    process.env.BLOCK_CATEGORIES_API || "https://uithing.com/api/blocks/categories"
  );

  spinner.succeed("Block categories fetched.");
  return data;
};

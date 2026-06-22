import axios from "axios";
import { consola } from "consola";
import dotenv from "dotenv";
import ora from "ora";

dotenv.config();

export const fetchBlockCategories = async (): Promise<string[]> => {
  const spinner = ora("Fetching block categories...").start();
  try {
    const { data } = await axios.get<string[]>(
      process.env.BLOCK_CATEGORIES_API || "https://uithing.com/api/blocks/categories"
    );
    spinner.succeed("Block categories fetched.");
    return data;
  } catch {
    spinner.fail("Failed to fetch block categories.");
    consola.error("Could not reach the UI Thing API. Check your network connection.");
    process.exit(1);
  }
};

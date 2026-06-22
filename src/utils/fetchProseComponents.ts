import axios from "axios";
import { consola } from "consola";
import dotenv from "dotenv";
import ora from "ora";

import { ProseComponent } from "../types";

dotenv.config();

export const fetchProseComponents = async (): Promise<ProseComponent[]> => {
  const spinner = ora("Fetching prose components...").start();
  try {
    const { data } = await axios.get<ProseComponent[]>(
      process.env.PROSE_COMPONENTS_API || "https://uithing.com/api/prose"
    );
    spinner.succeed("Prose components fetched.");
    return data;
  } catch {
    spinner.fail("Failed to fetch prose components.");
    consola.error("Could not reach the UI Thing API. Check your network connection.");
    process.exit(1);
  }
};

import axios from "axios";
import dotenv from "dotenv";
import ora from "ora";

import { ProseComponent } from "../types";

dotenv.config();

/**
 * Fetch prose components from UI Thing API.
 */
export const fetchProseComponents = async () => {
  const spinner = ora("Fetching prose components...").start();

  const { data } = await axios.get<ProseComponent[]>(
    process.env.PROSE_COMPONENTS_API || "https://uithing.com/api/prose"
  );

  spinner.succeed("Prose components fetched.");
  return data;
};

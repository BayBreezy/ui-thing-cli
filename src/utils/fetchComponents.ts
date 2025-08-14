import "dotenv/config";

import axios from "axios";
import ora from "ora";

import { Component } from "../types";

/**
 * Function used to fetch components from the API.
 */
export const fetchComponents = async () => {
  const spinner = ora("Fetching components...").start();

  const { data } = await axios.get<Component[]>(
    process.env.COMPONENTS_API || "https://uithing.com/api/components"
  );
  spinner.succeed("Components fetched.");

  return data;
};

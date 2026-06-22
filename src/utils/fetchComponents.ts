import axios from "axios";
import { consola } from "consola";
import dotenv from "dotenv";
import ora from "ora";

import { Component } from "../types";

dotenv.config();

export const fetchComponents = async (): Promise<Component[]> => {
  const spinner = ora("Fetching components...").start();
  try {
    const { data } = await axios.get<Component[]>(
      process.env.COMPONENTS_API || "https://uithing.com/api/components"
    );
    spinner.succeed("Components fetched.");
    return data;
  } catch {
    spinner.fail("Failed to fetch components.");
    consola.error("Could not reach the UI Thing API. Check your network connection.");
    process.exit(1);
  }
};

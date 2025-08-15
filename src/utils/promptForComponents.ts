import prompts from "prompts";

import { Component } from "../types";
import { fetchComponents } from "./fetchComponents";

/**
 * Prompts the user to select components to add.
 */
export const promptUserForComponents = async (
  all?: boolean,
  allComponents: Component[] = []
): Promise<string[]> => {
  // If all is true, return all components
  if (all) return allComponents.map((c: Component) => c.value);
  const { components } = await prompts({
    type: "autocompleteMultiselect",
    name: "components",
    message: "Select the components you want to add",
    choices: allComponents.map((c: Component) => ({ title: c.name, value: c.value })),
  });
  return components;
};

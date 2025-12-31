import prompts from "prompts";

import { Component, ProseComponent } from "../types";

/**
 * Prompts the user to select components to add.
 */
export const promptUserForComponents = async (
  all?: boolean,
  allComponents: Component[] | ProseComponent[] = []
): Promise<string[]> => {
  // If all is true, return all components
  if (all) return allComponents.map((c: Component | ProseComponent) => c.value);
  const { components } = await prompts({
    type: "autocompleteMultiselect",
    name: "components",
    message: "Select the components you want to add",
    choices: allComponents.map((c: Component | ProseComponent) => ({
      title: c.name,
      value: c.value,
    })),
  });
  return components;
};

import ora from "ora";
import prompts from "prompts";

import { Component } from "../types";
import { fetchComponents } from "./fetchComponents";

export const promptUserForComponents = async (): Promise<string[]> => {
  // get comps from API
  const compsSpinner = ora("Fetching components...").start();
  const allComponents = await fetchComponents();
  compsSpinner.succeed("Fetched components");
  const { components } = await prompts({
    type: "autocompleteMultiselect",
    name: "components",
    message: "Select the components you want to add",
    choices: allComponents.map((c: Component) => ({ title: c.name, value: c.value })),
    onRender(kleur) {
      // @ts-ignore
      this.msg = kleur.bgCyan(" Choose components ") + "  Select the components you want to add";
    },
  });
  return components;
};

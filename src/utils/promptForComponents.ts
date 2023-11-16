import ora from "ora";
import prompts from "prompts";

import allComponents from "../comps";
import { Component } from "../types";

export const promptUserForComponents = async (): Promise<string[]> => {
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

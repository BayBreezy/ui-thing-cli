import prompts from "prompts";

import { installPackages } from "./installPackages";

export const installValidator = async (packageManager: string) => {
  // Depending on the selected validator, install the corresponding packages
  const validatorPackages = {
    yup: ["yup", "@vee-validate/yup"],
    zod: ["zod", "@vee-validate/zod"],
    joi: ["joi", "@vee-validate/joi"],
    valibot: ["valibot", "@vee-validate/valibot"],
  };

  const { validator }: { validator: keyof typeof validatorPackages } = await prompts({
    type: "select",
    name: "validator",
    message: "Choose the validator package to use with Vee Validate: ",
    choices: [
      { title: "Yup", value: "yup" },
      { title: "Zod", value: "zod" },
      { title: "Joi", value: "joi" },
      { title: "Valibot", value: "valibot" },
    ],
  });
  if (!validator) {
    console.log("No validator package selected");
    return;
  }
  console.log(`Selected ${validator} as the validator package`);

  if (validatorPackages[validator]) {
    await installPackages(packageManager, validatorPackages[validator]);
  }
  return validator;
};

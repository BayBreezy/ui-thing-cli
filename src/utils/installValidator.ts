import prompts from "prompts";

import { installPackages } from "./installPackages";
import { logger } from "./logger";

const validatorPackages = {
  yup: ["yup", "@vee-validate/yup"],
  zod: ["zod", "@vee-validate/zod"],
  joi: ["joi", "@vee-validate/joi"],
  valibot: ["valibot", "@vee-validate/valibot"],
};

export type Validator = keyof typeof validatorPackages;

export const VALIDATORS = Object.keys(validatorPackages) as Validator[];

/**
 * Installs the vee-validate adapter for a schema library.
 * Pass `preselected` to skip the prompt (used by `add --validator` and `add --yes`).
 */
export const installValidator = async (packageManager: string, preselected?: Validator) => {
  const validator: Validator | undefined =
    preselected ??
    (
      await prompts({
        type: "select",
        name: "validator",
        message: "Choose the validator package to use with Vee Validate: ",
        choices: [
          { title: "Yup", value: "yup" },
          { title: "Zod", value: "zod" },
          { title: "Joi", value: "joi" },
          { title: "Valibot", value: "valibot" },
        ],
      })
    ).validator;
  if (!validator) {
    logger.warn("No validator package selected");
    return;
  }
  logger.info(`Selected ${validator} as the validator package`);

  if (validatorPackages[validator]) {
    await installPackages(packageManager, validatorPackages[validator]);
  }
  return validator;
};

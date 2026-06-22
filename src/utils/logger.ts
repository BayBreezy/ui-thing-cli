import { consola } from "consola";

export const logger = {
  info: (msg: string, ...args: unknown[]) => consola.info(msg, ...args),
  error: (msg: string, ...args: unknown[]) => consola.error(msg, ...args),
  warn: (msg: string, ...args: unknown[]) => consola.warn(msg, ...args),
  success: (msg: string, ...args: unknown[]) => consola.success(msg, ...args),
  log: (msg: string, ...args: unknown[]) => consola.log(msg, ...args),
};

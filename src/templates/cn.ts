/**
 * The `cn` class-name helper that shadcn-style registry components import from `~/lib/utils`.
 */
export const CN_HELPER = `import { clsx } from "clsx";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`;

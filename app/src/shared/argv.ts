import { equalsIgnoreCase } from "@vexed/utils/string";

/**
 * Returns the value for an argument with a prefix (e.g., "--username=").
 */
export const getArgValue = (
  argv: string[],
  prefix: string,
): string | undefined => {
  const arg = argv.find((a) => a.startsWith(prefix));
  if (!arg) return undefined;
  return arg.split("=")[1] ?? "";
};

/**
 * Returns true if any of the provided flags exist in argv.
 */
export const hasArgFlag = (argv: string[], ...flags: string[]): boolean =>
  argv.some((arg) => flags.some((flag) => equalsIgnoreCase(arg, flag)));

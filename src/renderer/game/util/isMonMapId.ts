const PREFIXES = ["id'", "id.", "id:", "id-"] as const;

/**
 * Validates if the input string is in monMapId format.
 *
 * @param input - The input string to check.
 * @returns True if the input string is in monMapId format, false otherwise.
 */
export function isMonsterMapId(input: string): boolean {
  return PREFIXES.some((prefix) => input.startsWith(prefix));
}

/**
 * Extracts the monMapId from the input string if it starts with a valid prefix.
 *
 * @param input - The input string.
 * @returns The monMapId extracted from the input string. If the input does not start with
 * any of the defined prefixes, it returns the input string as is.
 */
export function extractMonsterMapId(input: string): string {
  const prefix = PREFIXES.find((prefix) => input.startsWith(prefix));
  if (!prefix) return input;

  return input.slice(prefix.length);
}

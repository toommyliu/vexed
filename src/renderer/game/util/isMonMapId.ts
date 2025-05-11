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

export function extractMonsterMapId(input: string): string {
  const prefix = PREFIXES.find((prefix) => input.startsWith(prefix));
  if (!prefix) return input;

  return input.slice(prefix.length);
}

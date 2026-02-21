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

/**
 * Checks if the input string contains multiple valid monMapIds.
 *
 * @param input - comma separated string of monMapIds
 * @returns True if multiple valid monMapIds are found, false otherwise.
 */
export function hasMultipleMonMapIds(input: string) {
  const parts = input.split(",").map((part) => part.trim());
  let count = 0;
  for (const part of parts) {
    if (isMonsterMapId(part)) {
      count++;
      if (count > 1) return true;
    }
  }
  return false;
}

/**
 * Extracts all valid monMapIds from a comma-separated string.
 *
 * @param input - comma separated string of monMapIds
 * @returns An array of valid monMapIds found in the input string.
 */
export function extractAllMonMapIds(input: string) {
  const parts = input.split(",").map((part) => part.trim());
  const monMapIds: string[] = [];
  for (const part of parts) {
    if (isMonsterMapId(part)) monMapIds.push(extractMonsterMapId(part));
  }
  return monMapIds;
}

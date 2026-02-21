/**
 * Splits a comma-separated string into an array of strings.
 *
 * @param value - The string to split.
 * @returns An array of strings.
 */
export function splitCsv(value: string): string[] {
  return value
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);
}

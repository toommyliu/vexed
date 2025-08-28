/**
 * Normalize an ID to a number.
 *
 * @param input - The input ID, either a number or a string.
 * @returns The normalized ID as a number, or -1 if the input is invalid.
 */
export function normalizeId(input: number | string): number {
  if (typeof input === "string") {
    const parsed = Number.parseInt(input, 10);
    return Number.isNaN(parsed) ? -1 : parsed;
  }

  return input;
}

/**
 * Normalize an ID to a number.
 *
 * @param id - The input ID, either a number or string.
 * @returns The normalized ID as a number, or null if the input is invalid.
 */
export function normalizeId(id: string | number): number | null {
  if (typeof id === "number") return id;
  if (typeof id === "string") {
    const parsed = Number.parseInt(id, 10);
    if (Number.isNaN(parsed)) return null;
    return parsed;
  }
  return null;
}

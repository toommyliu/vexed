export function normalizeId(input: number | string): number {
  if (typeof input === "string") {
    const parsed = Number.parseInt(input, 10);
    return Number.isNaN(parsed) ? -1 : parsed;
  }

  return input;
}

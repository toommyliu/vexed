export const positiveInt = (value: number): number | undefined => {
  if (!Number.isFinite(value)) {
    return undefined;
  }

  const normalized = Math.trunc(value);
  return normalized > 0 ? normalized : undefined;
};

export const positiveIntOr = (value: number, fallback: number): number =>
  positiveInt(value) ?? fallback;

export const uniquePositiveInts = (values: readonly number[]): number[] => {
  const normalized: number[] = [];
  const seen = new Set<number>();

  for (const value of values) {
    const candidate = positiveInt(value);
    if (candidate === undefined || seen.has(candidate)) {
      continue;
    }

    seen.add(candidate);
    normalized.push(candidate);
  }

  return normalized;
};

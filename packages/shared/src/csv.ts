export function splitCsv(text: string): readonly string[] {
  return text
    .split(",")
    .map((part) => part.trim())
    .filter((token) => token !== "");
}

export function readCsvValue(
  input: string,
  prefix: string,
): string | undefined {
  const part = input.split(",").find((segment) => segment.startsWith(prefix));
  if (!part) {
    return undefined;
  }
  return part.slice(prefix.length);
}

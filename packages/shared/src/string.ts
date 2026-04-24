export function equalsIgnoreCase(
  a: string | null | undefined,
  b: string | null | undefined,
) {
  if (a === null || b === null || a === undefined || b === undefined)
    return false;

  return a.toLowerCase() === b.toLowerCase();
}

export function includesIgnoreCase(
  text: string | null | undefined,
  query: string | null | undefined,
) {
  if (
    text === null ||
    query === null ||
    text === undefined ||
    query === undefined
  )
    return false;

  return text.toLowerCase().includes(query.toLowerCase());
}

export function titlecase(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

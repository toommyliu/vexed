/**
 * Case-insensitive equality check.
 *
 * @param a - the first string to compare
 * @param b - the second string to compare
 * @returns true if the strings are equal, false otherwise
 */
export function equalsIgnoreCase(
  a: string | null | undefined,
  b: string | null | undefined
) {
  if (a === null || b === null || a === undefined || b === undefined)
    return false;

  return a.toLowerCase() === b.toLowerCase();
}

/*
 * Fuzzy match check - all words in the query must appear in the text.
 *
 * @param text - the text to search in
 * @param query - the query string (can contain multiple words)
 * @returns true if all query words appear in the text, false otherwise
 */
export function fuzzyMatchIgnoreCase(
  text: string | null | undefined,
  query: string | null | undefined
) {
  if (
    text === null ||
    query === null ||
    text === undefined ||
    query === undefined
  )
    return false;

  const lowerText = text.toLowerCase();
  const queryWords = query.toLowerCase().split(/\s+/).filter(Boolean);
  return queryWords.every((word) => lowerText.includes(word));
}

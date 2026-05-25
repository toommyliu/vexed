export interface TextMatchSegment {
  readonly match: boolean;
  readonly text: string;
}

const matchesQueryAt = (
  value: string,
  normalizedQuery: string,
  startIndex: number,
): number => {
  for (let endIndex = startIndex + 1; endIndex <= value.length; endIndex += 1) {
    const normalizedSlice = value
      .slice(startIndex, endIndex)
      .toLocaleLowerCase();
    if (normalizedSlice === normalizedQuery) {
      return endIndex;
    }

    if (!normalizedQuery.startsWith(normalizedSlice)) {
      return -1;
    }
  }

  return -1;
};

export function splitTextMatches(
  value: string,
  query: string,
): readonly TextMatchSegment[] {
  if (query === "") {
    return [{ match: false, text: value }];
  }

  const normalizedQuery = query.toLocaleLowerCase();
  const segments: TextMatchSegment[] = [];
  let cursor = 0;

  while (cursor < value.length) {
    let index = -1;
    let endIndex = -1;

    for (let startIndex = cursor; startIndex < value.length; startIndex += 1) {
      const matchEndIndex = matchesQueryAt(value, normalizedQuery, startIndex);
      if (matchEndIndex !== -1) {
        index = startIndex;
        endIndex = matchEndIndex;
        break;
      }
    }

    if (index === -1) {
      segments.push({ match: false, text: value.slice(cursor) });
      break;
    }

    if (index > cursor) {
      segments.push({ match: false, text: value.slice(cursor, index) });
    }

    segments.push({ match: true, text: value.slice(index, endIndex) });
    cursor = endIndex;
  }

  return segments;
}

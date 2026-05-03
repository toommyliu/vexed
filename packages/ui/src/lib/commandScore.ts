const SCORE_CONTINUE_MATCH = 1;
const SCORE_SPACE_WORD_JUMP = 0.9;
const SCORE_NON_SPACE_WORD_JUMP = 0.8;
const SCORE_CHARACTER_JUMP = 0.17;
const SCORE_TRANSPOSITION = 0.1;
const PENALTY_SKIPPED = 0.999;
const PENALTY_CASE_MISMATCH = 0.9999;
const PENALTY_NOT_COMPLETE = 0.99;

const IS_GAP_REGEXP = /[\\/_+.#"@[({&]/;
const COUNT_GAPS_REGEXP = /[\\/_+.#"@[({&]/g;
const IS_SPACE_REGEXP = /[\s-]/;
const COUNT_SPACE_REGEXP = /[\s-]/g;

function formatInput(value: string): string {
  return value.toLowerCase().replace(COUNT_SPACE_REGEXP, " ");
}

function scoreInner(
  value: string,
  search: string,
  lowerValue: string,
  lowerSearch: string,
  valueIndex: number,
  searchIndex: number,
  memo: Record<string, number>,
): number {
  if (searchIndex === search.length) {
    return valueIndex === value.length
      ? SCORE_CONTINUE_MATCH
      : PENALTY_NOT_COMPLETE;
  }

  const key = `${valueIndex},${searchIndex}`;
  const memoized = memo[key];
  if (memoized !== undefined) return memoized;

  const searchChar = lowerSearch.charAt(searchIndex);
  let index = lowerValue.indexOf(searchChar, valueIndex);
  let highScore = 0;

  while (index >= 0) {
    let score = scoreInner(
      value,
      search,
      lowerValue,
      lowerSearch,
      index + 1,
      searchIndex + 1,
      memo,
    );

    if (score > highScore) {
      if (index === valueIndex) {
        score *= SCORE_CONTINUE_MATCH;
      } else if (IS_GAP_REGEXP.test(value.charAt(index - 1))) {
        score *= SCORE_NON_SPACE_WORD_JUMP;
        const wordBreaks = value
          .slice(valueIndex, index - 1)
          .match(COUNT_GAPS_REGEXP);
        if (wordBreaks && valueIndex > 0) {
          score *= PENALTY_SKIPPED ** wordBreaks.length;
        }
      } else if (IS_SPACE_REGEXP.test(value.charAt(index - 1))) {
        score *= SCORE_SPACE_WORD_JUMP;
        const spaceBreaks = value
          .slice(valueIndex, index - 1)
          .match(COUNT_SPACE_REGEXP);
        if (spaceBreaks && valueIndex > 0) {
          score *= PENALTY_SKIPPED ** spaceBreaks.length;
        }
      } else {
        score *= SCORE_CHARACTER_JUMP;
        if (valueIndex > 0) {
          score *= PENALTY_SKIPPED ** (index - valueIndex);
        }
      }

      if (value.charAt(index) !== search.charAt(searchIndex)) {
        score *= PENALTY_CASE_MISMATCH;
      }
    }

    if (
      (score < SCORE_TRANSPOSITION &&
        lowerValue.charAt(index - 1) === lowerSearch.charAt(searchIndex + 1)) ||
      (lowerSearch.charAt(searchIndex + 1) ===
        lowerSearch.charAt(searchIndex) &&
        lowerValue.charAt(index - 1) !== lowerSearch.charAt(searchIndex))
    ) {
      const transposed = scoreInner(
        value,
        search,
        lowerValue,
        lowerSearch,
        index + 1,
        searchIndex + 2,
        memo,
      );
      if (transposed * SCORE_TRANSPOSITION > score) {
        score = transposed * SCORE_TRANSPOSITION;
      }
    }

    if (score > highScore) {
      highScore = score;
    }

    index = lowerValue.indexOf(searchChar, index + 1);
  }

  memo[key] = highScore;
  return highScore;
}

export function computeCommandScore(
  value: string,
  search: string,
  keywords: ReadonlyArray<string> = [],
): number {
  if (!search) return 1;
  const combined = keywords.length > 0 ? `${value} ${keywords.join(" ")}` : value;

  return scoreInner(
    combined,
    search,
    formatInput(combined),
    formatInput(search),
    0,
    0,
    {},
  );
}

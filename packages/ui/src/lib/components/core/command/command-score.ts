/** Best case: character continues an ongoing match. */
const SCORE_CONTINUE_MATCH = 1;

/** Match at start of a space-delimited word. */
const SCORE_SPACE_WORD_JUMP = 0.9;

/** Match at start of a word after / _ + . # " @ [ ( { & */
const SCORE_NON_SPACE_WORD_JUMP = 0.8;

/** Match in the middle of a word. */
const SCORE_CHARACTER_JUMP = 0.17;

/** Penalty for transposed letters. */
const SCORE_TRANSPOSITION = 0.1;

/** Decay per skipped character between matches. */
const PENALTY_SKIPPED = 0.999;

/** Minor penalty for case mismatch. */
const PENALTY_CASE_MISMATCH = 0.9999;

/** Penalty when the command string is longer than the search. */
const PENALTY_NOT_COMPLETE = 0.99;

const IS_GAP_REGEXP = /[\\/_+.#"@[({&]/;
const COUNT_GAPS_REGEXP = /[\\/_+.#"@[({&]/g;
const IS_SPACE_REGEXP = /[\s-]/;
const COUNT_SPACE_REGEXP = /[\s-]/g;

function formatInput(s: string): string {
  return s.toLowerCase().replace(COUNT_SPACE_REGEXP, " ");
}

function scoreInner(
  str: string,
  abbr: string,
  lowerStr: string,
  lowerAbbr: string,
  strIdx: number,
  abbrIdx: number,
  memo: Record<string, number>,
): number {
  if (abbrIdx === abbr.length) {
    return strIdx === str.length ? SCORE_CONTINUE_MATCH : PENALTY_NOT_COMPLETE;
  }

  const key = `${strIdx},${abbrIdx}`;
  if (memo[key] !== undefined) return memo[key];

  const abbrChar = lowerAbbr.charAt(abbrIdx);
  let index = lowerStr.indexOf(abbrChar, strIdx);
  let highScore = 0;

  while (index >= 0) {
    let score = scoreInner(
      str,
      abbr,
      lowerStr,
      lowerAbbr,
      index + 1,
      abbrIdx + 1,
      memo,
    );

    if (score > highScore) {
      if (index === strIdx) {
        score *= SCORE_CONTINUE_MATCH;
      } else if (IS_GAP_REGEXP.test(str.charAt(index - 1))) {
        score *= SCORE_NON_SPACE_WORD_JUMP;
        const wordBreaks = str
          .slice(strIdx, index - 1)
          .match(COUNT_GAPS_REGEXP);
        if (wordBreaks && strIdx > 0) {
          score *= PENALTY_SKIPPED ** wordBreaks.length;
        }
      } else if (IS_SPACE_REGEXP.test(str.charAt(index - 1))) {
        score *= SCORE_SPACE_WORD_JUMP;
        const spaceBreaks = str
          .slice(strIdx, index - 1)
          .match(COUNT_SPACE_REGEXP);
        if (spaceBreaks && strIdx > 0) {
          score *= PENALTY_SKIPPED ** spaceBreaks.length;
        }
      } else {
        score *= SCORE_CHARACTER_JUMP;
        if (strIdx > 0) {
          score *= PENALTY_SKIPPED ** (index - strIdx);
        }
      }

      if (str.charAt(index) !== abbr.charAt(abbrIdx)) {
        score *= PENALTY_CASE_MISMATCH;
      }
    }

    if (
      (score < SCORE_TRANSPOSITION &&
        lowerStr.charAt(index - 1) === lowerAbbr.charAt(abbrIdx + 1)) ||
      (lowerAbbr.charAt(abbrIdx + 1) === lowerAbbr.charAt(abbrIdx) &&
        lowerStr.charAt(index - 1) !== lowerAbbr.charAt(abbrIdx))
    ) {
      const transposed = scoreInner(
        str,
        abbr,
        lowerStr,
        lowerAbbr,
        index + 1,
        abbrIdx + 2,
        memo,
      );
      if (transposed * SCORE_TRANSPOSITION > score) {
        score = transposed * SCORE_TRANSPOSITION;
      }
    }

    if (score > highScore) {
      highScore = score;
    }

    index = lowerStr.indexOf(abbrChar, index + 1);
  }

  memo[key] = highScore;
  return highScore;
}

/**
 * Compute a fuzzy-match score between `command` and `search`.
 *
 * @param command   - The item value to score (e.g. "Calculator")
 * @param search    - The user's search string
 * @param keywords  - Optional extra terms to boost matching (e.g. ["math", "add"])
 * @returns A score between 0 and 1.  0 = no match.
 */
export function computeCommandScore(
  command: string,
  search: string,
  keywords?: string[],
): number {
  const combined =
    keywords && keywords.length > 0
      ? `${command} ${keywords.join(" ")}`
      : command;

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

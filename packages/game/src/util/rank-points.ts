export const MAX_RANK = 10;

export const RANK_POINT_THRESHOLDS = [
  0 /* 1 */, 900 /* 2 */, 3600 /* 3 */, 10000 /* 4 */, 22500 /* 5 */,
  44100 /* 6 */, 78400 /* 7 */, 129600 /* 8 */, 202500 /* 9 */, 302500 /* 10 */,
] as const;

export const MAX_RANK_POINTS =
  RANK_POINT_THRESHOLDS[RANK_POINT_THRESHOLDS.length - 1];

const normalizeRankPoints = (points: number): number =>
  Number.isFinite(points) ? Math.max(0, Math.trunc(points)) : 0;

export const getRankFromPoints = (points: number): number => {
  const normalizedPoints = normalizeRankPoints(points);

  for (let rank = 1; rank < RANK_POINT_THRESHOLDS.length; rank++) {
    if (normalizedPoints < RANK_POINT_THRESHOLDS[rank]) {
      return rank;
    }
  }

  return MAX_RANK;
};

export const hasMaxRankPoints = (points: number): boolean =>
  normalizeRankPoints(points) >= MAX_RANK_POINTS;

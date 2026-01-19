export const BoostType = {
  ClassPoints: "classPoints",
  Exp: "exp",
  Gold: "gold",
  Rep: "rep",
} as const;

export type BoostType = (typeof BoostType)[keyof typeof BoostType];

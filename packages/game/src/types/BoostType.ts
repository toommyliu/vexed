import { Schema } from "effect";

export const BoostType = Schema.Literals([
  "classPoints",
  "exp",
  "gold",
  "rep",
]);

export type BoostType = Schema.Schema.Type<typeof BoostType>;

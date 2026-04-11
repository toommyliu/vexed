import { Schema } from "effect";

export const GameAction = Schema.Literals([
  "acceptQuest",
  "buyItem",
  "doIA",
  "equipItem",
  "getMapItem",
  "loadEnhShop",
  "loadHairShop",
  "loadShop",
  "rest",
  "sellItem",
  "tfer",
  "tryQuestComplete",
  "unequipItem",
  "who",
]);
export type GameAction = typeof GameAction.Type;
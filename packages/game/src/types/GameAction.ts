import { Schema } from "effect";

export const GameAction = Schema.Literals([
  "acceptQuest",
  "addLoadout",
  "buyItem",
  "doIA",
  "equipLoadout",
  "equipItem",
  "getMapItem",
  "loadEnhShop",
  "loadHairShop",
  "loadShop",
  "removeLoadout",
  "rest",
  "sellItem",
  "tfer",
  "tryQuestComplete",
  "unequipItem",
  "wearLoadout",
  "who",
]);
export type GameAction = Schema.Schema.Type<typeof GameAction>;

import type { JsonPacketHandler } from "../types";

import addGoldExp from "./add-gold-exp";
import ccqr from "./ccqr";
import clearAuras from "./clear-auras";
import dropItem from "./drop-item";
import event from "./event";
import getQuests from "./get-quests";
import initUserData from "./init-user-data";
import initUserDatas from "./initUserDatas";
import moveToArea from "./move-to-area";

export const jsonHandlers: JsonPacketHandler<unknown>[] = [
  addGoldExp,
  ccqr,
  clearAuras,
  dropItem,
  event,
  getQuests,
  initUserData,
  initUserDatas,
  moveToArea,
];

export const jsonHandlerMap = new Map<string, JsonPacketHandler<unknown>>(
  jsonHandlers.map((h) => [h.cmd, h]),
);

export {
  addGoldExp,
  ccqr,
  clearAuras,
  dropItem,
  event,
  getQuests,
  initUserData,
  initUserDatas,
  moveToArea,
};

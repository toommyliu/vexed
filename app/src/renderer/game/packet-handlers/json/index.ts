import type { JsonPacketHandler } from "../types";
import acceptQuest from "./accept-quest";
import addGoldExp from "./add-gold-exp";
import ccqr from "./ccqr";
import clearAuras from "./clear-auras";
import dropItem from "./drop-item";
import event from "./event";
import getQuests from "./get-quests";
import initUserData from "./init-user-data";
import initUserDatas from "./init-user-datas";
import moveToArea from "./move-to-area";

export const jsonHandlers: JsonPacketHandler<unknown>[] = [
  acceptQuest,
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
  jsonHandlers.map((fn) => [fn.cmd, fn]),
);

export { default as acceptQuest } from "./accept-quest";
export { default as addGoldExp } from "./add-gold-exp";
export { default as ccqr } from "./ccqr";
export { default as clearAuras } from "./clear-auras";
export { default as dropItem } from "./drop-item";
export { default as event } from "./event";
export { default as getQuests } from "./get-quests";
export { default as initUserData } from "./init-user-data";
export { default as initUserDatas } from "./init-user-datas";
export { default as moveToArea } from "./move-to-area";
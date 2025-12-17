import type { StrPacketHandler } from "../types";
import exitArea from "./exit-area";
import respawnMon from "./respawn-mon";
import uotls from "./uotls";

export const strHandlers: StrPacketHandler[] = [exitArea, respawnMon, uotls];

export const strHandlerMap = new Map<string, StrPacketHandler>(
  strHandlers.map((fn) => [fn.cmd, fn]),
);


export { default as exitArea } from "./exit-area";
export { default as respawnMon } from "./respawn-mon";
export { default as uotls } from "./uotls";
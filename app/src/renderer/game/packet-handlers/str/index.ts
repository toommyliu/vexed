import type { StrPacketHandler } from "../types";

import exitArea from "./exit-area";
import respawnMon from "./respawn-mon";
import uotls from "./uotls";

export const strHandlers: StrPacketHandler[] = [exitArea, respawnMon, uotls];

export const strHandlerMap = new Map<string, StrPacketHandler>(
  strHandlers.map((h) => [h.cmd, h]),
);
export { exitArea, respawnMon, uotls };

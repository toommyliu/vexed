import { AuraCache } from "~/lib/cache/AuraCache";
import type { StrPacketHandler } from "../types";

export default {
  cmd: "exitArea",
  type: "str",
  run: (bot, data) => {
    const playerName = data[data.length - 1];
    if (playerName) {
      AuraCache.unregisterPlayer(playerName);
      bot.emit("playerLeave", playerName);
    }
  },
} satisfies StrPacketHandler;

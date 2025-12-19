import { AuraCache } from "~/lib/cache/AuraCache";
import type { JsonPacketHandler } from "../types";

export default {
  cmd: "clearAuras",
  type: "json",
  run: (bot) => {
    const entId = AuraCache.getPlayerEntId(bot.auth.username);
    if (entId !== undefined) {
      AuraCache.clearPlayerAuras(entId);
    }
  },
} satisfies JsonPacketHandler<unknown>;

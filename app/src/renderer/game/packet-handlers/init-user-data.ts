import type { Bot } from "~/lib/Bot";
import { AuraCache } from "~/lib/cache/AuraCache";
import { equalsIgnoreCase } from "~/shared/string";

export function initUserData(bot: Bot, packet: Packet) {
  const username = packet.data.strUsername;

  if (equalsIgnoreCase(username, bot.auth.username) || AuraCache.hasPlayer(username)) return;

  AuraCache.registerPlayer(username, packet.uid);
  bot.emit("playerJoin", username);
}

type Packet = {
  cmd: "initUserData";
  data: {
    strUsername: string;
  };
  uid: number;
};

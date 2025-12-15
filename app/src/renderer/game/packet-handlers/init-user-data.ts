import type { Bot } from "~/lib/Bot";
import { AuraStore } from "~/lib/util/AuraStore";
import { equalsIgnoreCase } from "~/shared/string";

export function initUserData(bot: Bot, packet: Packet) {
  const username = packet.data.strUsername;

  if (equalsIgnoreCase(username, bot.auth.username) || AuraStore.hasPlayer(username)) return;

  AuraStore.registerPlayer(username, packet.uid);
  bot.emit("playerJoin", username);
}

type Packet = {
  cmd: "initUserData";
  data: {
    strUsername: string;
  };
  uid: number;
};

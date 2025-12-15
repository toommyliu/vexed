import type { Bot } from "~/lib/Bot";
import { AuraStore } from "~/lib/util/AuraStore";
import { equalsIgnoreCase } from "~/shared/string";

export function initUserDatas(bot: Bot, packet: Packet) {
  for (const user of packet.a) {
    const username = user.data.strUsername;

    if (equalsIgnoreCase(username, bot.auth.username) || AuraStore.hasPlayer(username)) continue;

    AuraStore.registerPlayer(username, user.uid);
    bot.emit("playerJoin", username);
  }
}

type Packet = {
  a: {
    data: {
      // there's a little more info in here but we only care about the username and uid
      strUsername: string;
    };
    uid: number;
  }[];
  cmd: "initUserDatas";
};

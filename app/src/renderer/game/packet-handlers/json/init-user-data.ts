import { AuraCache } from "~/lib/cache/AuraCache";
import { equalsIgnoreCase } from "~/shared/string";
import type { JsonPacketHandler } from "../types";

type InitUserDataData = {
  cmd: "initUserData";
  data: {
    strUsername: string;
  };
  uid: number;
};

export default {
  cmd: "initUserData",
  type: "json",
  run: (bot, data) => {
    const username = data.data.strUsername;

    if (
      equalsIgnoreCase(username, bot.auth.username) ||
      AuraCache.hasPlayer(username)
    ) {
      return;
    }

    AuraCache.registerPlayer(username, data.uid);
    bot.emit("playerJoin", username);
  },
} satisfies JsonPacketHandler<InitUserDataData>;

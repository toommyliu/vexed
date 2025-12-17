import { AuraCache } from "~/lib/cache/AuraCache";
import { equalsIgnoreCase } from "~/shared/string";
import type { JsonPacketHandler } from "../types";

type InitUserDatasData = {
  a: {
    data: {
      strUsername: string;
    };
    uid: number;
  }[];
  cmd: "initUserDatas";
};

export default {
  cmd: "initUserDatas",
  type: "json",
  run: (bot, data) => {
    for (const user of data.a) {
      const username = user.data.strUsername;

      if (
        equalsIgnoreCase(username, bot.auth.username) ||
        AuraCache.hasPlayer(username)
      ) {
        continue;
      }

      AuraCache.registerPlayer(username, user.uid);
      bot.emit("playerJoin", username);
    }
  },
} satisfies JsonPacketHandler<InitUserDatasData>;

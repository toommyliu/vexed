import { AuraStore } from "~/lib/util/AuraStore";
import { equalsIgnoreCase } from "~/shared/string";
import { registerJsonHandler } from "../registry";

registerJsonHandler<InitUserDatasPacket>("initUserDatas", (bot, packet) => {
  for (const user of packet.a) {
    const username = user.data.strUsername;

    if (equalsIgnoreCase(username, bot.auth.username) || AuraStore.hasPlayer(username)) continue;

    AuraStore.registerPlayer(username, user.uid);
    bot.emit("playerJoin", username);
  }
});

type InitUserDatasPacket = {
  a: {
    data: {
      // there's a little more info in here but we only care about the username and uid
      strUsername: string;
    };
    uid: number;
  }[];
  cmd: "initUserDatas";
};

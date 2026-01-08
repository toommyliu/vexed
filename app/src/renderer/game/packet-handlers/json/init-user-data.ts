import { AuraStore } from "~/lib/util/AuraStore";
import { equalsIgnoreCase } from "~/shared/string";
import { registerJsonHandler } from "../registry";

registerJsonHandler<InitUserDataPacket>("initUserData", (bot, packet) => {
  const username = packet.data.strUsername;

  if (equalsIgnoreCase(username, bot.auth.username) || AuraStore.hasPlayer(username)) return;

  AuraStore.registerPlayer(username, packet.uid);
  bot.emit("playerJoin", username);
});

type InitUserDataPacket = {
  cmd: "initUserData";
  data: {
    strUsername: string;
  };
  uid: number;
};

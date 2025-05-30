import type { Bot } from "../lib/Bot";

export function initUserData(bot: Bot, packet: Packet) {
  bot.emit("playerJoin", packet.data.strUsername);
}

type Packet = {
  cmd: "initUserData";
  data: {
    strUsername: string;
  };
  uid: number;
};

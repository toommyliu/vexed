import type { Bot } from "../lib/Bot";

export async function initUserDatas(bot: Bot, packet: Packet) {
  for (const user of packet.a) {
    bot.world.playerUids.set(user.data.strUsername, user.uid);
    bot.emit("playerJoin", user.data.strUsername);
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

import type { Bot } from "../../lib/Bot";

export async function initUserDatas(bot: Bot, packet: Packet) {
  for (const user of packet.a) {
    const username = user.data.strUsername;
    
    if (username.toLowerCase() === bot.auth.username.toLowerCase()) continue;

    bot.world.playerUids.set(username, user.uid);
    bot.emit("playerJoin", username);
  }
}

type Packet = {
  a: {
    data: {
      strUsername: string;
    };
    uid: number;
  }[];
  cmd: "initUserDatas";
};

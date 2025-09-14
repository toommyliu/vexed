import type { Bot } from "../lib/Bot";

export async function initUserDatas(bot: Bot, packet: Packet) {
  for (const user of packet.a) {
    const username = user.data.strUsername;

    if (username.toLowerCase() === bot.auth.username.toLowerCase()) continue;

    if (bot.world.playerUids.has(username)) {
      console.warn(`(3) duplicated uid for ${username}`);
      return;
    }

    console.log(`initUserDatas: ${username} -> ${user.uid}`);
    bot.world.playerUids.set(username, user.uid);
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

import type { Bot } from "../lib/Bot";

export async function initUserDatas(bot: Bot, packet: Packet) {
  for (const user of packet.a) {
    const username = user.data.strUsername;

    // console.log(`initUserDatas: ${username}`);
    // console.log(`initUserData ${username}`, user);

    if (username.toLowerCase() === bot.auth.username.toLowerCase()) continue;

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

import type { Bot } from "../lib/Bot";

export function initUserData(bot: Bot, packet: Packet) {
  const username = packet.data.strUsername;

  if (username.toLowerCase() === bot.auth.username.toLowerCase()) return;

  console.log(`initUserData: ${username}`);

  bot.emit("playerJoin", username);
  if (bot.world.playerUids.has(username)) {
    console.warn(`(2) duplicated uid for ${username}`);
    return;
  } else if (bot.world.playerUids.has(username.toLowerCase())) {
    console.warn(`(2.1) duplicated uid for ${username}`);
    return;
  }

  console.log(`initUserData: ${username} -> ${packet.uid}`);
  bot.world.playerUids.set(username, packet.uid);
}

type Packet = {
  cmd: "initUserData";
  data: {
    strUsername: string;
  };
  uid: number;
};

import type { Bot } from "../../lib/Bot";

export function initUserData(bot: Bot, packet: InitUserDataPacket) {
  const username = packet.data.strUsername;

  if (username.toLowerCase() === bot.auth.username.toLowerCase()) {
    bot.player.hp = Number(packet.data.intHP);
    bot.player.mp = Number(packet.data.intMP);
    bot.player.gold = Number(packet.data.intGold);
    bot.player.level = packet.data.intLevel;
  }

  bot.emit("playerJoin", username);
  bot.world.playerUids.set(username, packet.uid);
}

export type InitUserDataPacket = {
  cmd: "initUserData";
  data: {
    intGold: number;
    intHP: string;
    intLevel: number;
    intMP: string;
    strUsername: string;
  };
  uid: number;
};

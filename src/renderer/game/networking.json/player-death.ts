import type { Bot } from "../lib/Bot";

export function playerDeath(bot: Bot, packet: Packet) {
  try {
    for (const plyr of bot.world.players?.values() ?? []) {
      if (plyr?.data?.entID === packet?.userID) {
        bot.emit("playerDeath", plyr.username);
        return;
      }
    }
  } catch {}
}

type Packet = {
  cmd: "playerDeath";
  did: number; // Don't know
  entType: "m" | "p"; // The source, either a monster or player (e.g. self-inflicted).
  monPad: number; // Don't know
  userID: number;
};

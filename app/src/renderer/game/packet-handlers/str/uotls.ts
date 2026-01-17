import { equalsIgnoreCase } from "@vexed/utils";
import { registerStrHandler } from "../registry";

registerStrHandler("uotls", (bot, packet) => {
  if (
    Array.isArray(packet) &&
    packet.length === 4 &&
    packet[3]?.startsWith("afk:")
  ) {
    const afkOn = packet[3] === "afk:true";
    const name = packet[2]?.toLowerCase();

    // TODO: remove this
    // backward compatibility
    if (afkOn && equalsIgnoreCase(name, bot.auth.username)) bot.emit("afk");

    const player = bot.world.players.getByName(packet[2]!);
    if (!player) return;

    player.data.afk = afkOn;
  }
});

import { AuraStore } from "~/lib/util/AuraStore";
import { registerStrHandler } from "../registry";

registerStrHandler("exitArea", (bot, packet) => {
  const playerName = packet[packet.length - 1];
  if (playerName) {
    AuraStore.unregisterPlayer(playerName);
    bot.emit("playerLeave", playerName);
  }
});

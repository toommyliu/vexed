import { registerStrHandler } from "../registry";

registerStrHandler("exitArea", (bot, packet) => {
  const playerName = packet[packet.length - 1];
  if (playerName) {
    bot.emit("playerLeave", playerName);
  }
});

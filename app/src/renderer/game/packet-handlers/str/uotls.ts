import { registerStrHandler } from "../registry";

registerStrHandler("uotls", (bot, packet) => {
  if (
    Array.isArray(packet) &&
    packet.length === 4 &&
    packet[2]?.toLowerCase() === bot.auth?.username?.toLowerCase() &&
    packet[3] === "afk:true"
  ) {
    bot.emit("afk");
  }
});

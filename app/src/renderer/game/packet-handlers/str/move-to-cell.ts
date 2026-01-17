import { registerClientStrHandler } from "../registry";

registerClientStrHandler("moveToCell", (bot, packet) => {
  const cell = packet[4];
  const pad = packet[5];
  if (cell && pad) bot.player._moveToCell(cell, pad);
});

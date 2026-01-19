import { registerClientStrHandler } from "../registry";

registerClientStrHandler("mv", (bot, parts) => {
  const xPos = Number(parts[4]);
  const yPos = Number(parts[5]);
  bot.player._mv(xPos, yPos);
});

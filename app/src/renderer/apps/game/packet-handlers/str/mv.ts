import { registerClientStrHandler } from "../registry";

registerClientStrHandler("mv", (bot, parts) => {
  const x = Number(parts[4]);
  const y = Number(parts[5]);
  const me = bot.world.players.me;
  if (!me) return;
  me.data.tx = x;
  me.data.ty = y;
});

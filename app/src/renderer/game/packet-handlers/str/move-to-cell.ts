import { registerClientStrHandler } from "../registry";

registerClientStrHandler("moveToCell", (bot, packet) => {
  const cell = packet[4];
  const pad = packet[5];
  const me = bot.world.players.me;
  if (!cell || !pad || !me) return;
  me.data.strFrame = cell;
  me.data.strPad = pad;
});

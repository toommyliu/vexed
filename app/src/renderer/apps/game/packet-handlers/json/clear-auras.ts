import { auras } from "~/lib/stores/aura";
import { registerJsonHandler } from "../registry";

registerJsonHandler<ClearAurasPacket>("clearAuras", (bot) => {
  const me = bot.world.players.me;
  if (!me) return;
  auras.players.get(me.data.entID)?.clear();
});

type ClearAurasPacket = {
  cmd: "clearAuras";
};

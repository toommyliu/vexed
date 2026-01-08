import { AuraStore } from "~/lib/util/AuraStore";
import { registerJsonHandler } from "../registry";

registerJsonHandler<ClearAurasPacket>("clearAuras", (bot, _packet) => {
  const entId = AuraStore.getPlayerEntId(bot.auth.username);
  if (entId !== undefined) AuraStore.clearPlayerAuras(entId);
});

type ClearAurasPacket = {
  cmd: "clearAuras";
};

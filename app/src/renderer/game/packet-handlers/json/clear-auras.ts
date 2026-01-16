import { registerJsonHandler } from "../registry";

registerJsonHandler<ClearAurasPacket>("clearAuras", (_bot, _packet) => {
  // TODO:
});

type ClearAurasPacket = {
  cmd: "clearAuras";
};

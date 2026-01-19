import { registerJsonHandler } from "../registry";

registerJsonHandler<UotlsPacket>("uotls", (bot, packet) => {
  const player = bot.world.players.get(packet.unm);
  if (!player) return;

  if (typeof packet.o?.intHP === "number") player.data.intHP = packet.o.intHP;
  if (typeof packet.o?.intMP === "number") player.data.intMP = packet.o.intMP;

  if (typeof packet.o?.intState === "number")
    player.data.intState = packet.o.intState;

  if (typeof packet.o?.strFrame === "string")
    player.data.strFrame = packet.o.strFrame;

  if (typeof packet.o?.strPad === "string")
    player.data.strPad = packet.o.strPad;

  // if (typeof packet.o?.intSP === "number") {
  //   player.data.intSP = packet.o.intSP;
  // }
});

type UotlsPacket = {
  cmd: "uotls";
  o: {
    intHP: number;
    intMP: number;
    // intSP: number;
    intState: number;
    strFrame: string;
    strPad: string;
  };
  unm: string;
};

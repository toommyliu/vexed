import type { AvatarData } from "@vexed/game";
import { registerJsonHandler } from "../registry";

registerJsonHandler<UotlsPacket>("uotls", (bot, packet) => {
  const player = bot.world.players.get(packet.unm);
  if (!player) {
    const obj = {
      intHP: packet.o.intHP,
      intHPMax: packet.o.intHPMax,
      intMP: packet.o.intMP,
      intMPMax: packet.o.intMPMax,
      intState: packet.o.intState,
      strFrame: packet.o.strFrame,
      strPad: packet.o.strPad,
      entID: packet.o.entID,
      entType: packet.o.entType,
      intLevel: packet.o.intLevel,
      strUsername: packet.unm,
      tx: packet.o.tx,
      ty: packet.o.ty,
      uoName: packet.o.uoName,
      afk: packet.o.afk,
    };
    bot.world.players.add(obj);
    return;
  }

  if (typeof packet.o?.intHP === "number") player.data.intHP = packet.o.intHP;
  if (typeof packet.o?.intMP === "number") player.data.intMP = packet.o.intMP;
  if (typeof packet.o?.intHPMax === "number")
    player.data.intHPMax = packet.o.intHPMax;
  if (typeof packet.o?.intMPMax === "number")
    player.data.intMPMax = packet.o.intMPMax;
  if (typeof packet.o?.intState === "number")
    player.data.intState = packet.o.intState;
  if (typeof packet.o?.strFrame === "string")
    player.data.strFrame = packet.o.strFrame;
  if (typeof packet.o?.strPad === "string")
    player.data.strPad = packet.o.strPad;
});

type UotlsPacket = {
  cmd: "uotls";
  o: AvatarData;
  unm: string;
};

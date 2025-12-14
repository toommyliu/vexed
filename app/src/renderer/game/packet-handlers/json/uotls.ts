import type { Bot } from "@lib/Bot";
import { Avatar, type AvatarData } from "@lib/models/Avatar";

export function uotls(bot: Bot, packet: JsonUotlsPacket) {
  if (!("entID" in packet.o)) return;

  if (packet.unm.toLowerCase() === bot.auth.username.toLowerCase()) {
    if (packet.o.intHPMax !== undefined) {
      bot.player.maxHp = packet.o.intHPMax;
    }

    if (packet.o.intMP !== undefined) {
      bot.player.mp = packet.o.intMP;
    }

    if (packet.o.intState !== undefined) {
      bot.player.state = packet.o.intState;
    }
  }

  bot.world.players.set(packet.unm, new Avatar(packet.o));
}

export type JsonUotlsPacket = {
  cmd: "uotls";
  o: AvatarData;
  unm: string; // player name
};

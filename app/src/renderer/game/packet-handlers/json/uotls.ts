import type { Bot } from "@lib/Bot";
import { Avatar, type AvatarData } from "@lib/models/Avatar";

export function jsonUotls(bot: Bot, packet: JsonUotlsPacket) {
  if (!("entID" in packet.o)) return;

  bot.world.players.set(packet.unm, new Avatar(packet.o));
}

export type JsonUotlsPacket = {
  cmd: "uotls";
  o: AvatarData;
  unm: string; // player name
};

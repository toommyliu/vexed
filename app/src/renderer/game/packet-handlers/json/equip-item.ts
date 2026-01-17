import { equalsIgnoreCase } from "@vexed/utils/string";
import { registerJsonHandler } from "../registry";

registerJsonHandler<EquipItemPacket>("equipItem", (bot, packet) => {
  const player = bot.world.players.getById(packet.uid);
  if (!player || !equalsIgnoreCase(player?.username, bot.auth.username)) return;

  bot.player._equipItem(packet);
});

export type EquipItemPacket = {
  ItemID: number;
  cmd: "equipItem";
  strES: string;
  uid: number;
};

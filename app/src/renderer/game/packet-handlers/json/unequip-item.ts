import { equalsIgnoreCase } from "@vexed/utils/string";
import { registerJsonHandler } from "../registry";

registerJsonHandler<UnequipItemPacket>("unequipItem", (bot, packet) => {
  const player = bot.world.players.getById(packet.uid);
  if (!player || !equalsIgnoreCase(player?.username, bot.auth.username)) return;

  bot.player._unequipItem(packet.ItemID);
});

type UnequipItemPacket = {
  ItemID: number;
  cmd: "unequipItem";
  uid: number;
};

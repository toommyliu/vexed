import { equalsIgnoreCase } from "@vexed/utils/string";
import { registerJsonHandler } from "../registry";

registerJsonHandler<UnequipItemPacket>("unequipItem", (bot, packet) => {
  const player = bot.world.players.getById(packet.uid);
  if (!player || !equalsIgnoreCase(player?.username, bot.auth.username)) return;

  const item = bot.player.inventory.get(packet.ItemID);
  if (!item) return;

  console.log(`unequipItem :: ${item.name}`);
  item.data.bEquip = 0;
});

type UnequipItemPacket = {
  ItemID: number;
  cmd: "unequipItem";
  uid: number;
};

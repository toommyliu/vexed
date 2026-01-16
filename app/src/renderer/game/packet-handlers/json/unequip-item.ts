import { equalsIgnoreCase } from "@vexed/utils/string";
import { registerJsonHandler } from "../registry";

// {"t":"xt","b":{"r":-1,"o":{"uid":12345,"ItemID":24796,"strES":"co","cmd":"unequipItem","bUnload":true}}}

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

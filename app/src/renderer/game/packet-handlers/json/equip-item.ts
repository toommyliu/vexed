import { equalsIgnoreCase } from "@vexed/utils/string";
import { registerJsonHandler } from "../registry";

registerJsonHandler<EquipItemPacket>("equipItem", (bot, packet) => {
  const player = bot.world.players.getById(packet.uid);
  if (!player || !equalsIgnoreCase(player?.username, bot.auth.username)) return;

  const item = bot.player.inventory.get(packet.ItemID);
  if (!item) return;

  // find the previously equipped item and unequip it, if it exists
  const previousItem = bot.player.inventory.items
    .all()
    .find((val) => val.data.bEquip === 1 && val.data.sES === packet.strES);
  if (previousItem) {
    console.log(`equipItem :: unequipping ${previousItem.name}`);
    previousItem.data.bEquip = 0;
  }

  // flag the item as equipped
  console.log(`equipItem :: ${item.name}`);
  item.data.bEquip = 1;
});

type EquipItemPacket = {
  ItemID: number;
  cmd: "equipItem";
  strES: string;
  uid: number;
};

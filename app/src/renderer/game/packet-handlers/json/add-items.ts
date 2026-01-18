import type { ItemData } from "@vexed/game";
import { registerJsonHandler } from "../registry";

registerJsonHandler<AddItemsPacket>("addItems", (bot, packet) => {
  console.log("addItems", packet);

  for (const itemId of Object.keys(packet.items)) {
    const entry = packet.items[Number(itemId)];
    if (!entry) continue;

    const item = bot.flash.getArrayObject<ItemData>(
      "world.invTree",
      Number(itemId),
      true,
    );

    if (!item) {
      console.warn("[addItems] item not found :: ", itemId);
      return;
    }

    if (item.bTemp === 1) {
      bot.player.tempInventory.items.add(item);
    } else {
      const invItem = bot.player.inventory.items.get(item.ItemID);
      if (invItem) {
        console.log("[addItems:inventory] item already exists :: ", item);

        if (isQuantityUpdate(entry)) {
          invItem.data.iQty = entry.iQtyNow;
          console.log(
            `[addItems:inventory] updated quantity of [${invItem.name}] to ${invItem.data.iQty}`,
          );
        }

        return;
      }

      if ("bBank" in item && item.bBank === 1) {
        const bankItem = bot.player.bank.items.get(item.ItemID);
        if (bankItem && isQuantityUpdate(entry)) {
          bankItem.data.iQty = entry.iQtyNow;
          console.log(
            `[addItems:bank] updated quantity of [${bankItem.name}] to ${bankItem.data.iQty}`,
          );
        }

        return;
      }

      bot.player.inventory.items.add(item);
      return;
    }
  }

  console.warn("[addItems] unhandled packet", packet);
});

type AddItemsPacket = {
  cmd: "addItems";
  items: Record<number, AddItemEntry>;
};

type AddItemQuantityUpdate = {
  CharItemID: number;
  bBank: number;
  iQty: number;
  iQtyNow: number;
};

type AddItemEntry = AddItemQuantityUpdate | ItemData;
function isQuantityUpdate(entry: AddItemEntry): entry is AddItemQuantityUpdate {
  return "iQtyNow" in entry && !("sName" in entry);
}

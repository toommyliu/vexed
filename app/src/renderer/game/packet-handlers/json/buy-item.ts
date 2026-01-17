import type { ItemData } from "@vexed/game";
import { registerJsonHandler } from "../registry";

registerJsonHandler<BuyItemPacket>("buyItem", (bot, packet) => {
  if (packet.bitSuccess === 0) {
    console.warn(`[buyItem] failed to buy item: ${packet.ItemID}`);
    return;
  }

  const item = bot.flash.get<ItemData>("world.shopBuyItem", true);
  if (!item) {
    console.warn(`[buyItem] item ${packet.ItemID} not found`);
    return;
  }

  if (item.bHouse === 1) {
    bot.player.house.items.add(item);
    console.log(`[buyItem] house item :: ${item.sName}`);
  } else if (item.bBank === 1) {
    bot.player.bank.items.add(item);
    console.log(`[buyItem] bank item :: ${item.sName}`);
  } else {
    bot.player.inventory.items.add(item);
    console.log(`[buyItem] inventory item :: ${item.sName}`);
  }
});

type BuyItemPacket = {
  CharItemID: number;
  ItemID: string;
  bBank: number;
  bitSuccess: number;
  cmd: "buyItem";
  iQty: number;
};

import type { FactionData, ItemData } from "@vexed/game";
import { registerJsonHandler } from "../registry";

registerJsonHandler<LoadInventoryBigPacket>(
  "loadInventoryBig",
  (bot, packet) => {
    bot.player.factions.all().clear();
    bot.player.house.items.all().clear();
    bot.player.inventory.items.all().clear();

    for (const faction of packet.factions) bot.player.factions.add(faction);
    for (const item of packet.hitems) bot.player.house.items.add(item);
    for (const item of packet.items) bot.player.inventory.items.add(item);

    console.log(
      `[loadBigInventory] :: ${bot.player.factions.all().size} factions`,
    );
    console.log(
      `[loadBigInventory] :: ${bot.player.house.items.all().size} house items`,
    );
    console.log(
      `[loadBigInventory] :: ${bot.player.inventory.items.all().size} items`,
    );
  },
);

type LoadInventoryBigPacket = {
  bankCount: number; // how many non-AC items are in the bank
  cmd: "loadInventoryBig";
  factions: FactionData[];
  hitems: ItemData[];
  items: ItemData[];
};

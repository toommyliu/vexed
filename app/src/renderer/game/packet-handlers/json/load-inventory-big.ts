import type { FactionData, ItemData } from "@vexed/game";
import { registerJsonHandler } from "../registry";

registerJsonHandler<LoadInventoryBigPacket>(
  "loadInventoryBig",
  (bot, packet) => {
    bot.player.factions.all().clear();

    for (const faction of packet.factions) bot.player.factions.add(faction);

    // house items
    for (const item of packet.hitems) {
    }

    // inventory
    for (const item of packet.items) {
    }
  },
);

type LoadInventoryBigPacket = {
  bankCount: number; // how many non-AC items are in the bank
  cmd: "loadInventoryBig";
  factions: FactionData[];
  hitems: ItemData[];
  items: ItemData[];
};

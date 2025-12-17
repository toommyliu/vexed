import type { ItemData } from "~/lib/models/Item";
import type { JsonPacketHandler } from "../types";

type DropItemData = {
  cmd: "dropItem";
  items: Record<number, ItemData>;
};

export default {
  cmd: "dropItem",
  type: "json",
  run: async (bot, data) => {
    for (const itemData of Object.values(data.items)) {
      bot.drops.addDrop(itemData);
    }
  },
} satisfies JsonPacketHandler<DropItemData>;

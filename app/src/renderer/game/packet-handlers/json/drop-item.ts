import type { ItemData } from "@vexed/game";
import { registerJsonHandler } from "../registry";

registerJsonHandler<DropItemPacket>("dropItem", (bot, packet) => {
  for (const itemData of Object.values(packet.items))
    bot.drops.addDrop(itemData);
});

type DropItemPacket = {
  cmd: "dropItem";
  items: Record<number, ItemData>;
};

import type { Bot } from "~/lib/Bot";
import type { ItemData } from "~/lib/models/Item";

export async function dropItem(bot: Bot, packet: DropItemPacket) {
  for (const itemData of Object.values(packet.items))
    bot.drops.addDrop(itemData);
}

export type DropItemPacket = {
  cmd: "dropItem";
  items: Record<number, ItemData>;
};

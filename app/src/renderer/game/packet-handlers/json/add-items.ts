import type { Bot } from "@lib/Bot";
import type { ItemData } from "@lib/models/Item";

export function addItems(bot: Bot, packet: AddItemsPacket) {
    bot.inventory._handleAddItems(packet);
    bot.tempInventory._handleAddItems(packet);
}

export type AddItemsPacket = {
    cmd: "addItems";
    items: Record<string, ItemData & { iQtyNow?: number; CharItemID?: number }>;
};

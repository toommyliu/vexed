import type { Bot } from "@lib/Bot";
import type { ItemData } from "@lib/models/Item";

export function addItems(bot: Bot, packet: AddItemsPacket) {
    bot.player.inventory._handleAddItems(packet);
    bot.player.tempInventory._handleAddItems(packet);
}

export type AddItemsPacket = {
    cmd: "addItems";
    items: Record<string, ItemData & { iQtyNow?: number; CharItemID?: number }>;
};

import type { Bot } from "@lib/Bot";
import type { ItemData } from "@lib/models/Item";

export function addItems(bot: Bot, packet: AddItemsPacket) {
    bot.emit("addItems", packet);
}

export type AddItemsPacket = {
    cmd: "addItems";
    items: Record<string, ItemData & { iQtyNow?: number; CharItemID?: number }>;
};

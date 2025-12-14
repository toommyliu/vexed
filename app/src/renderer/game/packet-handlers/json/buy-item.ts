import type { Bot } from "@lib/Bot";

export function buyItem(bot: Bot, packet: BuyItemPacket) {
    if (packet.bitSuccess !== 1) return;

    bot.emit("buyItem", packet);
}

export type BuyItemPacket = {
    CharItemID: number;
    ItemID: number;
    bitSuccess: number;
    cmd: "buyItem";
    iQty: number;
};

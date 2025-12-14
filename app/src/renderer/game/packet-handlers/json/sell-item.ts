import type { Bot } from "@lib/Bot";

export function sellItem(bot: Bot, packet: SellItemPacket) {
    if (packet.bitSuccess !== 1) return;

    bot.player.gold += packet.intAmount ?? 0;
    bot.emit("sellItem", packet);
}

export type SellItemPacket = {
    CharItemID: number;
    bitSuccess: number;
    cmd: "sellItem";
    intAmount?: number;
};

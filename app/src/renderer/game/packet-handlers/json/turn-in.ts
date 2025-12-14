import type { Bot } from "@lib/Bot";

export function turnIn(bot: Bot, packet: TurnInPacket) {
    bot.emit("turnIn", packet);
}

export type TurnInPacket = {
    cmd: "turnIn";
    sItems: string; // "itemId:qty,itemId:qty"
};

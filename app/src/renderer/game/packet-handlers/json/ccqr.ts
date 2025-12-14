import type { Bot } from "@lib/Bot";

export function ccqr(bot: Bot, packet: CcqrPacket) {
    if (packet.bSuccess === 1) {
        bot.emit("questComplete", packet);
    } else {
        bot.emit("questFailed", packet);
    }
}

export type CcqrPacket = {
    QuestID: number;
    bSuccess: number;
    cmd: "ccqr";
    msg?: string;
    rewardObj?: {
        FactionID?: number;
        iRep?: number;
    };
    sName: string;
};

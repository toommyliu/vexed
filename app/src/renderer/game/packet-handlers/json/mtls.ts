import type { Bot } from "@lib/Bot";

/**
 * Handles monster state updates.
 */
export function mtls(bot: Bot, packet: MtlsPacket) {
    bot.world._mtls(packet);
}

export type MtlsPacket = {
    cmd: "mtls";
    id: number; // MonMapID
    o: {
        intHP?: number;
        intState?: number;
    };
};

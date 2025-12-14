import type { Bot } from "@lib/Bot";

export function seia(bot: Bot, packet: SeiaPacket) {
    bot.emit("skillEquip", packet.o);
}

export type SeiaPacket = {
    cmd: "seia";
    o: {
        anim: string;
        cd: number;
        strl: string;
        tgt: string;
    };
};

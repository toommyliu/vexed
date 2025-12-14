import type { Bot } from "@lib/Bot";

export function addFaction(bot: Bot, packet: AddFactionPacket) {
    bot.emit("addFaction", packet.faction);
}

export type AddFactionPacket = {
    cmd: "addFaction";
    faction: {
        CharFactionID: string;
        FactionID: string;
        bitSuccess: string;
        iRep: string;
        sName: string;
    };
};

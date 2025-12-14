import type { Bot } from "@lib/Bot";
import type { ItemData } from "@lib/models/Item";
import { Faction, type FactionData } from "@lib/models/Faction";

export function loadInventoryBig(bot: Bot, packet: LoadInventoryBigPacket) {
    bot.inventory._handleLoadInventoryBig(packet);
    bot.player._setDead(false);

    // Populate factions
    if (packet.factions) {
        for (const factionData of packet.factions) {
            bot.player._addFaction(new Faction(factionData as unknown as FactionData));
        }
    }
}

export type LoadInventoryBigPacket = {
    cmd: "loadInventoryBig";
    items: ItemData[];
    factions?: {
        CharFactionID: string;
        FactionID: string;
        sName: string;
        iRep: string;
    }[];
    iBankSlots?: number;
    iSlots?: number;
};

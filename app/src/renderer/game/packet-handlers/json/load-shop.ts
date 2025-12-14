import type { Bot } from "@lib/Bot";

export function loadShop(bot: Bot, packet: LoadShopPacket) {
    bot.shops._handleLoadShop(packet);
}

export type LoadShopPacket = {
    cmd: "loadShop";
    shopinfo: {
        ShopID: number;
        sField?: string;
        sName: string;
        items: ShopItem[];
    };
};

export type ShopItem = {
    ItemID: number;
    bCoins: number;
    bHouse: number;
    bStaff: number;
    bTemp: number;
    bUpg: number;
    bUpgMem: number;
    iCost: number;
    iLvl: number;
    iQty: number;
    iReq: number;
    iStk: number;
    sDesc: string;
    sES: string;
    sIcon: string;
    sLink: string;
    sName: string;
    sType: string;
};

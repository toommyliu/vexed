import type { Bot } from "@lib/Bot";
import type { BasePacket } from "../types";

import { acceptQuest, type AcceptQuestPacket } from "./accept-quest";
import { addFaction, type AddFactionPacket } from "./add-faction";
import { addGoldExp, type AddGoldExpPkt } from "./add-gold-exp";
import { addItems, type AddItemsPacket } from "./add-items";
import { buyItem, type BuyItemPacket } from "./buy-item";
import { ccqr, type CcqrPacket } from "./ccqr";
import { clearAuras, type ClearAurasPkt } from "./clear-auras";
import { dropItem, type DropItemPacket } from "./drop-item";
import { event, type EventPacket } from "./event";
import { getQuests, type GetQuestsPacket } from "./get-quests";
import { initUserData, type InitUserDataPacket } from "./init-user-data";
import { initUserDatas } from "./init-user-datas";
import { loadShop, type LoadShopPacket } from "./load-shop";
import { moveToArea, type MoveToAreaPacket } from "./move-to-area";
import { mtls, type MtlsPacket } from "./mtls";
import { seia, type SeiaPacket } from "./seia";
import { sellItem, type SellItemPacket } from "./sell-item";
import { turnIn, type TurnInPacket } from "./turn-in";
import { uotls, type JsonUotlsPacket } from "./uotls";

export type JsonPacket =
    | AcceptQuestPacket
    | AddFactionPacket
    | AddGoldExpPkt
    | AddItemsPacket
    | BuyItemPacket
    | CcqrPacket
    | ClearAurasPkt
    | DropItemPacket
    | EventPacket
    | GetQuestsPacket
    | InitUserDataPacket
    | JsonUotlsPacket
    | LoadShopPacket
    | MoveToAreaPacket
    | MtlsPacket
    | SeiaPacket
    | SellItemPacket
    | TurnInPacket;

type PacketHandler = (bot: Bot, packet: BasePacket) => void | Promise<void>;

export const jsonHandlers: Record<string, PacketHandler> = {
    acceptQuest: acceptQuest as PacketHandler,
    addFaction: addFaction as PacketHandler,
    addGoldExp: addGoldExp as PacketHandler,
    addItems: addItems as PacketHandler,
    buyItem: buyItem as PacketHandler,
    ccqr: ccqr as PacketHandler,
    clearAuras: clearAuras as PacketHandler,
    dropItem: dropItem as PacketHandler,
    event: event as PacketHandler,
    getQuests: getQuests as PacketHandler,
    initUserData: initUserData as PacketHandler,
    initUserDatas: initUserDatas as PacketHandler,
    loadShop: loadShop as PacketHandler,
    moveToArea: moveToArea as PacketHandler,
    mtls: mtls as PacketHandler,
    seia: seia as PacketHandler,
    sellItem: sellItem as PacketHandler,
    turnIn: turnIn as PacketHandler,
    uotls: uotls as PacketHandler,
};

export type {
    AcceptQuestPacket,
    AddFactionPacket,
    AddGoldExpPkt,
    AddItemsPacket,
    BuyItemPacket,
    CcqrPacket,
    ClearAurasPkt,
    DropItemPacket,
    EventPacket,
    GetQuestsPacket,
    InitUserDataPacket,
    JsonUotlsPacket,
    LoadShopPacket,
    MoveToAreaPacket,
    MtlsPacket,
    SeiaPacket,
    SellItemPacket,
    TurnInPacket,
};

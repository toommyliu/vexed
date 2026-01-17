import { registerJsonHandler } from "../registry";

registerJsonHandler<EnhanceItemShopPacket>("enhanceItemShop", (bot, packet) => {
  if (packet.bSuccess === 1) {
    for (const itemId of packet.ItemIDs) {
      const item = bot.player.inventory.get(itemId);
      if (!item) continue;

      item.data.EnhID = packet.EnhID;
      item.data.EnhPatternID = packet.EnhPID;
      item.data.EnhLvl = packet.EnhLvl;
      item.data.EnhDPS = packet.EnhDPS;
      item.data.EnhRng = packet.EnhRng;
      item.data.EnhRty = packet.EnhRty;
      item.data.ProcID = Number(packet.ProcID);
    }
  }
});

type EnhanceItemShopPacket = {
  EnhDPS: number;
  EnhID: number;
  EnhLvl: number;
  EnhName: string;
  EnhPID: number;
  EnhRng: number;
  EnhRty: number;
  ItemIDs: number[];
  ProcID: string;
  bSuccess: number;
  cmd: "enhanceItemShop";
};

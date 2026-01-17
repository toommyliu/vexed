import { registerJsonHandler } from "../registry";

// untested
registerJsonHandler<EnhanceItemLocalPacket>(
  "enhanceItemLocal",
  (bot, packet) => {
    if (packet.bSuccess === 1) {
      const item = bot.player.inventory.get(packet.ItemID);
      if (!item) return;

      item.data.EnhID = packet.EnhID;
      item.data.EnhPatternID = packet.EnhPID;
      item.data.EnhLvl = packet.EnhLvl;
      item.data.EnhDPS = packet.EnhDPS;
      item.data.EnhRng = packet.EnhRng;
      item.data.EnhRty = packet.EnhRty;
      item.data.ProcID = Number(packet.ProcID);
    }
  },
);

type EnhanceItemLocalPacket = {
  EnhDPS: number;
  EnhID: number;
  EnhLvl: number;
  EnhName: string;
  EnhPID: number;
  EnhRng: number;
  EnhRty: number;
  ItemID: number;
  ProcID: string;
  bSuccess: number;
  cmd: "enhanceItemLocal";
};

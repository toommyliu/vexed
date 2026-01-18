import type { ItemData } from "@vexed/game";
import { registerJsonHandler } from "../registry";

registerJsonHandler<GetDropPacket>("getDrop", (bot, packet) => {
  if (packet.bSuccess === 1) {
    const item = bot.flash.getArrayObject<ItemData>(
      "world.invTree",
      packet.ItemID,
      true,
    );
    if (!item) {
      console.warn("[getDrop] item not found ::", packet);
      return;
    }

    item.iQty = packet.iQty;

    if (typeof packet.EnhID === "number") item.EnhID = packet.EnhID;
    if (typeof packet.EnhLvl === "number") item.EnhLvl = packet.EnhLvl;
    if (typeof packet.EnhPatternID === "number")
      item.EnhPatternID = packet.EnhPatternID;
    if (typeof packet.EnhRty === "number") item.EnhRty = packet.EnhRty;

    // console.log("[getDrop] adding to inventory", item);

    bot.player.inventory.items.add(item);
    // console.log(`[getDrop] added to inventory ${item.sName} x${item.iQty}`);

    return;
  }

  console.warn("[getDrop] failed ::", packet);
});

type GetDropPacket = {
  CharItemID: number;
  EnhID?: number;
  EnhLvl?: number;
  EnhPatternID?: number;
  EnhRty?: number;
  ItemID: number;
  bBank: number;
  bSuccess: number;
  cmd: "getDrop";
  iQty: number;
  iQtyNow: number;
};

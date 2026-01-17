import { registerJsonHandler } from "../registry";

registerJsonHandler<SellItemPacket>("sellItem", (bot, packet) => {
  // this seems unused
  if (packet.bBank) {
    const item = bot.player.bank.items.findBy(
      (item) => item.data.CharItemID === packet.CharItemID,
    );
    if (item) bot.player.bank.items.remove(item.id);

    // console.log(
    //   `[sellItem] sold bank item ${item?.name ?? packet.CharItemID} :: ${packet.iQty}x`,
    // );

    return;
  }

  const invItem = bot.player.inventory.items.findBy(
    (item) => item.data.CharItemID === packet.CharItemID,
  );
  if (invItem) {
    const iQty = packet.iQty ?? 1;
    const newQty = packet.iQtyNow ?? invItem.quantity - iQty;

    if (invItem.data.sES === "ar" || newQty < 1) {
      bot.player.inventory.items.remove(invItem.id);
    } else {
      invItem.data.iQty = newQty;
      bot.player.inventory.items.set(invItem.id, invItem.data);
    }

    // console.log(
    //   `[sellItem] sold inventory item ${invItem.name} :: ${iQty}x, now at ${newQty}x`,
    // );

    return;
  }

  const houseItem = bot.player.house.items.findBy(
    (item) => item.data.CharItemID === packet.CharItemID,
  );

  if (houseItem) {
    const iQty = packet.iQty ?? 1;
    const newQty = packet.iQtyNow ?? houseItem.quantity - iQty;

    if (newQty < 1) {
      bot.player.house.items.remove(houseItem.id);
    } else {
      houseItem.data.iQty = newQty;
      bot.player.house.items.set(houseItem.id, houseItem.data);
    }

    // console.log(
    //   `[sellItem] sold house item ${houseItem.name} :: ${iQty}x, now at ${newQty}x`,
    // );

    return;
  }

  console.warn("[sellItem] unhandled packet", packet);
});

type SellItemPacket = {
  CharItemID: number;
  bBank?: number;
  bCoins: number;
  cmd: "sellItem";
  iQty?: number;
  iQtyNow?: number;
  intAmount: number;
};

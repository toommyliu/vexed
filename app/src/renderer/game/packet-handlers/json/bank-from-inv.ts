import { registerJsonHandler } from "../registry";

registerJsonHandler<BankFromInvPacket>("bankFromInv", (bot, data) => {
  const item =
    bot.player.inventory.get(data.ItemID) ??
    bot.player.house.items.get(data.ItemID);
  if (!item) return;

  if (data.bSuccess === 0) {
    console.warn(
      `bankFromInv :: failed to deposit item ${item?.name ?? data.ItemID}`,
    );
    return;
  }

  console.log(`bankFromInv :: deposited item ${item?.name ?? data.ItemID}`);

  // remove the item from the original store
  bot.player.house.items.remove(data.ItemID);
  bot.player.inventory.items.remove(data.ItemID);

  // add the item to the bank
  bot.player.bank.items.add({
    ...item.data,
    bBank: 1,
  });
});

type BankFromInvPacket = {
  ItemID: number;
  bSuccess: number;
  cmd: "bankFromInv";
};

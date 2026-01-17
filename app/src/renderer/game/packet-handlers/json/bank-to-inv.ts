import { registerJsonHandler } from "../registry";

// TODO:

registerJsonHandler<BankToInvPacket>("bankToInv", (bot, packet) => {
  console.log("data", packet);

  const item = bot.player.bank.get(packet.ItemID);
  if (!item) {
    console.warn(`bankToInv :: item ${packet.ItemID} not found`);
    console.log(bot.player.bank.items.all());
    return;
  }

  console.log(`bankToInv :: withdraw item ${item?.name ?? packet.ItemID}`);

  // remove the item from the bank
  bot.player.bank.items.remove(packet.ItemID);

  // add the item to the inventory
  bot.player.inventory.items.add({
    ...item.data,
    bBank: 0,
  });
});

type BankToInvPacket = {
  ItemID: number;
  cmd: "bankToInv";
};

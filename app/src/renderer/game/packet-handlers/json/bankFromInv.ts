import type { Bot } from "@lib/Bot";

export const bankFromInv = (bot: Bot, packet: BankFromInvPacket) => {
    bot.emit('bankFromInv', packet);
}

export type BankFromInvPacket = {
  ItemID: number;
  bSuccess: 0 | 1;
  cmd: "bankFromInv";
};

// {"t":"xt","b":{"r":-1,"o":{"ItemID":45739,"cmd":"bankFromInv","bSuccess":1}}}
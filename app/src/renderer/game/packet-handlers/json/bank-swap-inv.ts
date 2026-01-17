import { registerJsonHandler } from "../registry";

registerJsonHandler<BankSwapInvPacket>("bankSwapInv", (bot, packet) => {
  console.log("data", packet);
});

type BankSwapInvPacket = {
  cmd: "bankSwapInv";
};

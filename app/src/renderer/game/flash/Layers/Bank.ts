import { Effect, Layer } from "effect";
import { Bank } from "../Services/Bank";
import type { BankShape } from "../Services/Bank";
import { Bridge } from "../Services/Bridge";

const make = Effect.gen(function* () {
  const bridge = yield* Bridge;

  return {
    contains: (item: unknown, quantity?: number) =>
      quantity === undefined
        ? bridge.call("bank.contains", [item])
        : bridge.call("bank.contains", [item, quantity]),
    deposit: (key: unknown) => bridge.call("bank.deposit", [key]),
    getItem: (item: unknown) => bridge.call("bank.getItem", [item]),
    getItems: () => bridge.call("bank.getItems"),
    getSlots: () => bridge.call("bank.getSlots"),
    getUsedSlots: () => bridge.call("bank.getUsedSlots"),
    isOpen: () => bridge.call("bank.isOpen"),
    loadItems: (force?: boolean) =>
      force === undefined
        ? bridge.call("bank.loadItems")
        : bridge.call("bank.loadItems", [force]),
    open: () => bridge.call("bank.open"),
    swap: (invKey: unknown, bankKey: unknown) =>
      bridge.call("bank.swap", [invKey, bankKey]),
    withdraw: (key: unknown) => bridge.call("bank.withdraw", [key]),
  } satisfies BankShape;
});

export const BankLive = Layer.effect(Bank, make);

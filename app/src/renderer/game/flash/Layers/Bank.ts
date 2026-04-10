import { Effect, Layer, Schedule } from "effect";
import { Auth } from "../Services/Auth";
import type { BankShape } from "../Services/Bank";
import { Bank } from "../Services/Bank";
import { Bridge } from "../Services/Bridge";

const make = Effect.gen(function* () {
  const bridge = yield* Bridge;
  const auth = yield* Auth;

  let loaded = false;

  const dispose = yield* bridge.onConnection((status) => {
    if (loaded && status === "OnConnectionLost") {
      loaded = false;
    }
  });

  yield* Effect.addFinalizer(() => Effect.sync(() => dispose()));

  const contains = (item: ItemIdentifierToken, quantity: number = 1) =>
    bridge.call("bank.contains", [item, quantity]);

  const deposit = (item: ItemIdentifierToken) =>
    Effect.gen(function* () {
      yield* open();
      return yield* bridge.call("bank.deposit", [item]);
    });

  const depositMany = (...items: ItemIdentifierToken[]) =>
    Effect.gen(function* () {
      yield* open();
      yield* Effect.forEach(items, (item) =>
        bridge.call("bank.deposit", [item]),
      );
    });

  const withdraw = (item: ItemIdentifierToken) =>
    Effect.gen(function* () {
      yield* open();
      return yield* bridge.call("bank.withdraw", [item]);
    });

  const withdrawMany = (...items: ItemIdentifierToken[]) =>
    Effect.gen(function* () {
      yield* open();
      yield* Effect.forEach(items, (item) =>
        bridge.call("bank.withdraw", [item]),
      );
    });

  const getItem = (item: ItemIdentifierToken) =>
    bridge.call("bank.getItem", [item]);

  const getSlots = () => bridge.call("bank.getSlots");

  const getUsedSlots = () => bridge.call("bank.getUsedSlots");

  const getAvailableSlots = () =>
    Effect.gen(function* () {
      const slots = yield* getSlots();
      const usedSlots = yield* getUsedSlots();
      return slots - usedSlots;
    });

  const isOpen = () => bridge.call("bank.isOpen");

  const open = (force: boolean = false) =>
    Effect.gen(function* () {
      const isLoggedIn = yield* auth.isLoggedIn();
      if (!isLoggedIn) return yield* Effect.void;

      const isBankOpen = yield* isOpen();
      if (isBankOpen) {
        if (force) {
          yield* bridge.call("bank.open");
          yield* Effect.repeat(isOpen(), {
            until: (open) => !open,
            schedule: Schedule.spaced("100 millis"),
          });
        } else {
          return yield* Effect.void;
        }
      }

      if (!loaded) {
        yield* bridge.call("bank.loadItems");
        loaded = true;
      }

      yield* bridge.call("bank.open");
    });

  const swap = (invItem: ItemIdentifierToken, bankItem: ItemIdentifierToken) =>
    bridge.call("bank.swap", [invItem, bankItem]);

  return {
    contains,
    deposit,
    depositMany,
    getItem,
    getSlots,
    getUsedSlots,
    getAvailableSlots,
    isOpen,
    open,
    swap,
    withdraw,
    withdrawMany,
  } satisfies BankShape;
});

export const BankLive = Layer.effect(Bank, make);

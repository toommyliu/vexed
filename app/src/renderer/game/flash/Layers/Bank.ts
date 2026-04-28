import { Effect, Layer } from "effect";
import { makeItemCache } from "../ItemCache";
import { Auth } from "../Services/Auth";
import type { BankShape } from "../Services/Bank";
import { Bank } from "../Services/Bank";
import { Bridge } from "../Services/Bridge";
import { waitFor } from "../../utils/waitFor";

const make = Effect.gen(function* () {
const effectServices = yield* Effect.services<never>();

  const bridge = yield* Bridge;
  const auth = yield* Auth;
  const itemCache = yield* makeItemCache;

  const dispose = yield* bridge.onConnection((status) => {
    if (status === "OnConnectionLost") {
      void Effect.runForkWith(effectServices)(itemCache.clear);
    }
  });

  yield* Effect.addFinalizer(() => Effect.sync(dispose));

  const contains: BankShape["contains"] = (item, quantity = 1) =>
    bridge.call("bank.contains", [item, quantity]);

  const deposit: BankShape["deposit"] = (item) =>
    Effect.gen(function* () {
      yield* open();
      return yield* bridge.call("bank.deposit", [item]);
    });

  const depositMany: BankShape["depositMany"] = (...items) =>
    Effect.gen(function* () {
      yield* open();
      yield* Effect.forEach(items, (item) =>
        bridge.call("bank.deposit", [item]),
      );
    });

  const withdraw: BankShape["withdraw"] = (item) =>
    Effect.gen(function* () {
      yield* open();
      return yield* bridge.call("bank.withdraw", [item]);
    });

  const withdrawMany: BankShape["withdrawMany"] = (...items) =>
    Effect.gen(function* () {
      yield* open();
      yield* Effect.forEach(items, (item) =>
        bridge.call("bank.withdraw", [item]),
      );
    });

  const getItem: BankShape["getItem"] = (item) =>
    bridge
      .call("bank.getItem", [item])
      .pipe(Effect.flatMap(itemCache.fromUnknown));

  const getItems: BankShape["getItems"] = () =>
    bridge
      .call("bank.getItems")
      .pipe(Effect.flatMap(itemCache.fromUnknownArray));

  const getSlots: BankShape["getSlots"] = () => bridge.call("bank.getSlots");

  const getUsedSlots: BankShape["getUsedSlots"] = () =>
    bridge.call("bank.getUsedSlots");

  const getAvailableSlots: BankShape["getAvailableSlots"] = () =>
    Effect.zipWith(getSlots(), getUsedSlots(), (slots, used) => slots - used);

  const isOpen: BankShape["isOpen"] = () => bridge.call("bank.isOpen");

  const open: BankShape["open"] = (force = false) =>
    Effect.gen(function* () {
      const isLoggedIn = yield* auth.isLoggedIn();
      if (!isLoggedIn) return yield* Effect.void;

      const isBankOpen = yield* isOpen();
      if (isBankOpen) {
        if (force) {
          yield* bridge.call("bank.open"); // Close first
          yield* waitFor(
            Effect.gen(function* () {
              return !(yield* isOpen());
            }),
            { timeout: "3 seconds" },
          );
        } else {
          return yield* Effect.void;
        }
      }

      yield* bridge.call("bank.open");
    });

  const swap: BankShape["swap"] = (invItem, bankItem) =>
    bridge.call("bank.swap", [invItem, bankItem]);

  return {
    contains,
    deposit,
    depositMany,
    getItem,
    getItems,
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

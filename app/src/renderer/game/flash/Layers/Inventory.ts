import { Effect, Layer } from "effect";
import { makeItemCache } from "../ItemCache";
import { Bridge } from "../Services/Bridge";
import { Inventory } from "../Services/Inventory";
import type { InventoryShape } from "../Services/Inventory";

const make = Effect.gen(function* () {
  const bridge = yield* Bridge;
  const itemCache = yield* makeItemCache;

  const runFork = Effect.runFork;

  const dispose = yield* bridge.onConnection((status) => {
    if (status === "OnConnectionLost") {
      runFork(itemCache.clear);
    }
  });

  yield* Effect.addFinalizer(() => Effect.sync(dispose));

  const contains = (item: ItemIdentifierToken, quantity?: number) =>
    quantity === undefined
      ? bridge.call("inventory.contains", [item])
      : bridge.call("inventory.contains", [item, quantity]);

  const equip = (item: ItemIdentifierToken) =>
    bridge.call("inventory.equip", [item]);

  const getItem = (item: ItemIdentifierToken) =>
    bridge
      .call("inventory.getItem", [item])
      .pipe(Effect.flatMap(itemCache.fromUnknown));

  const getItems = () =>
    bridge.call("inventory.getItems").pipe(Effect.flatMap(itemCache.fromUnknownArray));

  const getSlots = () => bridge.call("inventory.getSlots");

  const getUsedSlots = () => bridge.call("inventory.getUsedSlots");

  const getAvailableSlots = () =>
    Effect.gen(function* () {
      const slots = yield* getSlots();
      const usedSlots = yield* getUsedSlots();
      return slots - usedSlots;
    });

  return {
    contains,
    equip,
    getItem,
    getItems,
    getSlots,
    getUsedSlots,
    getAvailableSlots,
  } satisfies InventoryShape;
});

export const InventoryLive = Layer.effect(Inventory, make);

import { Effect, Layer } from "effect";
import { makeItemCache } from "../ItemCache";
import { Bridge } from "../Services/Bridge";
import { Inventory } from "../Services/Inventory";
import type { InventoryShape } from "../Services/Inventory";
import { World } from "../Services/World";

const make = Effect.gen(function* () {
  const bridge = yield* Bridge;
  const world = yield* World;
  const itemCache = yield* makeItemCache;

  const runFork = Effect.runFork;

  const dispose = yield* bridge.onConnection((status) => {
    if (status === "OnConnectionLost") {
      runFork(itemCache.clear);
    }
  });

  yield* Effect.addFinalizer(() => Effect.sync(dispose));

  const contains: InventoryShape["contains"] = (item, quantity) =>
    quantity === undefined
      ? bridge.call("inventory.contains", [item])
      : bridge.call("inventory.contains", [item, quantity]);

  const equip: InventoryShape["equip"] = (item) =>
    Effect.gen(function* () {
      const toEquip = yield* getItem(item);
      if (!toEquip) {
        return false;
      }

      yield* world.map.waitForGameAction("equipItem");
      yield* bridge.call("inventory.equip", [toEquip]);
      return true;
    });

  const getItem: InventoryShape["getItem"] = (item) =>
    bridge
      .call("inventory.getItem", [item])
      .pipe(Effect.flatMap(itemCache.fromUnknown));

  const getItems: InventoryShape["getItems"] = () =>
    bridge
      .call("inventory.getItems")
      .pipe(Effect.flatMap(itemCache.fromUnknownArray));

  const getSlots: InventoryShape["getSlots"] = () =>
    bridge.call("inventory.getSlots");

  const getUsedSlots: InventoryShape["getUsedSlots"] = () =>
    bridge.call("inventory.getUsedSlots");

  const getAvailableSlots: InventoryShape["getAvailableSlots"] = () =>
    Effect.zipWith(getSlots(), getUsedSlots(), (slots, used) => slots - used);

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

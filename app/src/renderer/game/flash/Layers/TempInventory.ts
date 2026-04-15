import { Effect, Layer } from "effect";
import { makeItemCache } from "../ItemCache";
import { Bridge } from "../Services/Bridge";
import { TempInventory } from "../Services/TempInventory";
import type { TempInventoryShape } from "../Services/TempInventory";

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
      ? bridge.call("tempInventory.contains", [item])
      : bridge.call("tempInventory.contains", [item, quantity]);

  const getItem = (item: ItemIdentifierToken) =>
    bridge
      .call("tempInventory.getItem", [item])
      .pipe(Effect.flatMap(itemCache.fromUnknown));

  const getItems = () =>
    bridge
      .call("tempInventory.getItems")
      .pipe(Effect.flatMap(itemCache.fromUnknownArray));

  return {
    contains,
    getItem,
    getItems,
  } satisfies TempInventoryShape;
});

export const TempInventoryLive = Layer.effect(TempInventory, make);

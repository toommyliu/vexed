import { Effect, Layer } from "effect";
import { Bridge } from "../Services/Bridge";
import { TempInventory } from "../Services/TempInventory";
import type { TempInventoryShape } from "../Services/TempInventory";

const make = Effect.gen(function* () {
  const bridge = yield* Bridge;

  const contains = (item: ItemIdentifierToken, quantity?: number) =>
    quantity === undefined
      ? bridge.call("tempInventory.contains", [item])
      : bridge.call("tempInventory.contains", [item, quantity]);

  const getItem = (item: ItemIdentifierToken) =>
    bridge.call("tempInventory.getItem", [item]);

  const getItems = () => bridge.call("tempInventory.getItems");

  return {
    contains,
    getItem,
    getItems,
  } satisfies TempInventoryShape;
});

export const TempInventoryLive = Layer.effect(TempInventory, make);

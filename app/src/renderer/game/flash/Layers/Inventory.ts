import { Effect, Layer } from "effect";
import { Bridge } from "../Services/Bridge";
import { Inventory } from "../Services/Inventory";
import type { InventoryShape } from "../Services/Inventory";

const make = Effect.gen(function* () {
  const bridge = yield* Bridge;

  const contains = (item: ItemIdentifierToken, quantity?: number) =>
    quantity === undefined
      ? bridge.call("inventory.contains", [item])
      : bridge.call("inventory.contains", [item, quantity]);

  const equip = (item: ItemIdentifierToken) => bridge.call("inventory.equip", [item]);

  // TODO: figure out how to use models
  const getItem = (item: ItemIdentifierToken) =>
    bridge.call("inventory.getItem", [item]);

  const getItems = () => bridge.call("inventory.getItems");

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

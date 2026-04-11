import type { ItemData } from "@vexed/game";
import { Effect, Layer } from "effect";
import { Auth } from "../Services/Auth";
import { Bridge } from "../Services/Bridge";
import type { DropsShape } from "../Services/Drops";
import { Drops } from "../Services/Drops";

const make = Effect.gen(function* () {
  const bridge = yield* Bridge;
  const auth = yield* Auth;

  const _itemData = new Map<number, ItemData>();
  const _counts = new Map<number, number>();

  const acceptDrop = (itemId: number) =>
    Effect.gen(function* () {
      const isLoggedIn = yield* auth.isLoggedIn();
      if (!isLoggedIn) {
        return;
      }

      const item = _itemData.get(itemId);
      if (!item) {
        return;
      }

      yield* bridge.call("drops.acceptDrop", [itemId]);
      _counts.delete(itemId);
    });

  const getDrops = () => bridge.call("drops.getDrops");

  const getItems = () => bridge.call("drops.getItems");

  const isUsingCustomDrops = () => bridge.call("drops.isUsingCustomDrops");

  const rejectDrop = (itemId: number, visual?: boolean) =>
    Effect.gen(function* () {
      const isLoggedIn = yield* auth.isLoggedIn();
      if (!isLoggedIn) {
        return yield* Effect.succeed(false);
      }

      const item = _itemData.get(itemId);
      if (!item) {
        return yield* Effect.succeed(false);
      }

      if (!visual) {
        _counts.delete(itemId);
      }

      return yield* bridge.call("drops.rejectDrop", [itemId]);
    });

  const toggleUi = () => bridge.call("drops.toggleUi");

  const _addDrop = (item: ItemData) =>
    Effect.gen(function* () {
      const exists = _itemData.has(item.ItemID);
      if (exists) {
        const count = _counts.get(item.ItemID) || 0;
        _counts.set(item.ItemID, count + item.iQty);
      } else {
        _itemData.set(item.ItemID, item);
        _counts.set(item.ItemID, item.iQty);
      }
    });

  return {
    acceptDrop,
    getDrops,
    getItems,
    isUsingCustomDrops,
    rejectDrop,
    toggleUi,
    _addDrop,
  } satisfies DropsShape;
});

export const DropsLive = Layer.effect(Drops, make);

import type { ItemData } from "@vexed/game";
import { Effect, Layer } from "effect";
import { asRecord } from "../PacketPayload";
import { Auth } from "../Services/Auth";
import { Bridge } from "../Services/Bridge";
import type { DropsShape } from "../Services/Drops";
import { Drops } from "../Services/Drops";
import { Packet } from "../Services/Packet";

const isItemData = (value: unknown): value is ItemData => {
  const record = asRecord(value);
  if (!record) {
    return false;
  }

  return (
    typeof record["ItemID"] === "number" &&
    typeof record["iQty"] === "number" &&
    typeof record["sName"] === "string"
  );
};

const make = Effect.gen(function* () {
  const bridge = yield* Bridge;
  const auth = yield* Auth;
  const packets = yield* Packet;

  const itemData = new Map<number, ItemData>();
  const counts = new Map<number, number>();

  const addDrop = (item: ItemData) =>
    Effect.sync(() => {
      const exists = itemData.has(item.ItemID);
      if (exists) {
        const count = counts.get(item.ItemID) || 0;
        counts.set(item.ItemID, count + item.iQty);
      } else {
        itemData.set(item.ItemID, item);
        counts.set(item.ItemID, item.iQty);
      }
    });

  yield* packets.jsonScoped("dropItem", (packet) =>
    Effect.gen(function* () {
      const payload = asRecord(packet.data);
      if (!payload) {
        return;
      }

      const items = asRecord(payload["items"]);
      if (!items) {
        return;
      }

      for (const item of Object.values(items)) {
        if (!isItemData(item)) {
          continue;
        }

        yield* addDrop(item);
      }
    }),
  );

  const acceptDrop = (itemId: number) =>
    Effect.gen(function* () {
      const isLoggedIn = yield* auth.isLoggedIn();
      if (!isLoggedIn) {
        return;
      }

      const item = itemData.get(itemId);
      if (!item) {
        return;
      }

      yield* bridge.call("drops.acceptDrop", [itemId]);
      counts.delete(itemId);
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

      const item = itemData.get(itemId);
      if (!item) {
        return yield* Effect.succeed(false);
      }

      if (!visual) {
        counts.delete(itemId);
      }

      return yield* bridge.call("drops.rejectDrop", [itemId]);
    });

  const toggleUi = () => bridge.call("drops.toggleUi");

  return {
    acceptDrop,
    getDrops,
    getItems,
    isUsingCustomDrops,
    rejectDrop,
    toggleUi,
  } satisfies DropsShape;
});

export const DropsLive = Layer.effect(Drops, make);

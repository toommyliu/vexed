import type { ItemData } from "@vexed/game";
import { equalsIgnoreCase } from "@vexed/shared/string";
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

  const resolveItemId = (item: ItemIdentifierToken): number | undefined => {
    if (typeof item === "number") {
      return Number.isFinite(item) && item > 0 ? Math.trunc(item) : undefined;
    }

    const trimmedName = item.trim();
    if (trimmedName === "") {
      return undefined;
    }

    for (const [itemId, data] of itemData.entries()) {
      if (equalsIgnoreCase(data.sName, trimmedName)) {
        return itemId;
      }
    }

    return undefined;
  };

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

  const acceptDrop: DropsShape["acceptDrop"] = (item) =>
    Effect.gen(function* () {
      const itemId = resolveItemId(item);
      if (itemId === undefined) {
        return;
      }

      const isLoggedIn = yield* auth.isLoggedIn();
      if (!isLoggedIn) {
        return;
      }

      const dropItem = itemData.get(itemId);
      if (!dropItem) {
        return;
      }

      yield* bridge.call("drops.acceptDrop", [itemId]);
      counts.delete(itemId);
    });

  const isUsingCustomDrops: DropsShape["isUsingCustomDrops"] = () => bridge.call("drops.isUsingCustomDrops");

  const rejectDrop: DropsShape["rejectDrop"] = (itemId, visual) =>
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

  const toggleUi: DropsShape["toggleUi"] = () => bridge.call("drops.toggleUi");

  const containsDrop: DropsShape["containsDrop"] = (item) =>
    Effect.sync(() => {
      const itemId = resolveItemId(item);
      return itemId !== undefined && itemData.has(itemId);
    });

  return {
    acceptDrop,
    containsDrop,
    isUsingCustomDrops,
    rejectDrop,
    toggleUi,
  } satisfies DropsShape;
});

export const DropsLive = Layer.effect(Drops, make);

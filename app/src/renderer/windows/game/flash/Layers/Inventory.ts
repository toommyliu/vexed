import { Deferred, Effect, Layer, Option } from "effect";
import { makeItemCache } from "../ItemCache";
import { asBoolean, asNumber, asRecord } from "../PacketPayload";
import { Bridge } from "../Services/Bridge";
import { Inventory } from "../Services/Inventory";
import type { InventoryShape } from "../Services/Inventory";
import { Packet } from "../Services/Packet";
import { World } from "../Services/World";

const make = Effect.gen(function* () {
  const bridge = yield* Bridge;
  const packet = yield* Packet;
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

      const result = yield* Deferred.make<boolean>();
      const itemId = toEquip.id;
      const equipped = yield* bridge.call("inventory.equip", [itemId]);
      if (!equipped) {
        return false;
      }

      if (!("bWear" in toEquip.data)) {
        return true;
      }

      const dispose = yield* packet.json("wearItem", (response) =>
        Effect.gen(function* () {
          const payload = asRecord(response.data);
          if (!payload) {
            return;
          }

          const responseItemId = asNumber(payload["ItemID"]);
          if (responseItemId !== itemId) {
            return;
          }

          yield* Deferred.succeed(
            result,
            asBoolean(payload["success"]) === true,
          );
        }),
      );

      return yield* Effect.gen(function* () {
        const mapId = yield* world.map.getId();
        yield* packet.sendServer(
          `%xt%zm%wearItem%${mapId}%${itemId}%`,
          "String",
        );

        const response = yield* Deferred.await(result).pipe(
          Effect.timeoutOption("3 seconds"),
          Effect.map((option) =>
            Option.isSome(option) ? option.value : false,
          ),
        );

        if (response) {
          yield* itemCache.clear;
        }

        return response;
      }).pipe(Effect.ensuring(Effect.sync(dispose)));
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

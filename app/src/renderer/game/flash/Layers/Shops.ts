import type { ShopInfo } from "@vexed/game";
import { equalsIgnoreCase } from "@vexed/shared/string";
import { Effect, Layer, Ref } from "effect";
import { makeShopItemCache } from "../ItemCache";
import { asNumber, asRecord } from "../PacketPayload";
import { Bridge } from "../Services/Bridge";
import { Packet } from "../Services/Packet";
import { Shops } from "../Services/Shops";
import type { ShopsShape } from "../Services/Shops";
import { World } from "../Services/World";

const asShopInfo = (value: unknown): ShopInfo | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const shopinfo = asRecord(record["shopinfo"]);
  if (!shopinfo) {
    return null;
  }

  const items = shopinfo["items"];
  if (!Array.isArray(items)) {
    return null;
  }

  return shopinfo as ShopInfo;
};

const isItemMatch = (value: unknown, key: ItemIdentifierToken): boolean => {
  const record = asRecord(value);
  if (!record) {
    return false;
  }

  if (typeof key === "number") {
    const itemId = asNumber(record["ItemID"]);
    return itemId !== undefined && itemId === key;
  }

  const itemName = record["sName"];
  if (typeof itemName === "string" && equalsIgnoreCase(itemName, key)) {
    return true;
  }

  const keyAsNumber = asNumber(key);
  if (keyAsNumber === undefined) {
    return false;
  }

  const itemId = asNumber(record["ItemID"]);
  return itemId !== undefined && itemId === keyAsNumber;
};

const make = Effect.gen(function* () {
  const bridge = yield* Bridge;
  const packet = yield* Packet;
  const world = yield* World;

  const itemCache = yield* makeShopItemCache;

  const shopInfoRef = yield* Ref.make<ShopInfo | null>(null);

  const runFork = Effect.runForkWith(yield* Effect.services());

  const setShopInfo = (value: unknown) =>
    Effect.gen(function* () {
      const info = asShopInfo(value);
      if (!info) {
        return;
      }

      yield* Ref.set(shopInfoRef, info);
      yield* itemCache.fromUnknownArray(info.items);
    });

  yield* packet.jsonScoped("loadShop", (packet) => setShopInfo(packet.data));

  const dispose = yield* bridge.onConnection((status) => {
    if (status === "OnConnectionLost") {
      runFork(
        Effect.gen(function* () {
          yield* Ref.set(shopInfoRef, null);
          yield* itemCache.clear;
        }),
      );
    }
  });

  yield* Effect.addFinalizer(() => Effect.sync(dispose));

  const buyById: ShopsShape["buyById"] = (id, quantity) =>
    Effect.gen(function* () {
      yield* world.map.waitForGameAction("buyItem");
      return yield* quantity === undefined
        ? bridge.call("shops.buyById", [id])
        : bridge.call("shops.buyById", [id, quantity]);
    });

  const buyByName: ShopsShape["buyByName"] = (name, quantity) =>
    Effect.gen(function* () {
      yield* world.map.waitForGameAction("buyItem");
      return yield* quantity === undefined
        ? bridge.call("shops.buyByName", [name])
        : bridge.call("shops.buyByName", [name, quantity]);
    });

  const canBuyItem: ShopsShape["canBuyItem"] = (itemName) =>
    bridge.call("shops.canBuyItem", [itemName]);

  const getInfo: ShopsShape["getInfo"] = () => Ref.get(shopInfoRef);

  const getItems: ShopsShape["getItems"] = () =>
    getInfo().pipe(
      Effect.flatMap((info) =>
        info ? itemCache.fromUnknownArray(info.items) : Effect.succeed([]),
      ),
    );

  const getItem: ShopsShape["getItem"] = (key) =>
    getInfo().pipe(
      Effect.flatMap((info) => {
        if (!info) {
          return Effect.succeed(null);
        }

        const item = info.items.find((item) => isItemMatch(item, key));
        if (!item) {
          return Effect.succeed(null);
        }

        return itemCache.fromUnknown(item);
      }),
    );

  const getMaxBuyQuantity: ShopsShape["getMaxBuyQuantity"] = (key) =>
    bridge.call("shops.getMaxBuyQuantity", [key]);

  const isMergeShop: ShopsShape["isMergeShop"] = () =>
    bridge.call("shops.isMergeShop");

  const load: ShopsShape["load"] = (shopId) =>
    bridge.call("shops.load", [shopId]);

  const loadArmorCustomize: ShopsShape["loadArmorCustomize"] = () =>
    bridge.call("shops.loadArmorCustomize");

  const loadHairShop: ShopsShape["loadHairShop"] = (shopId) =>
    bridge.call("shops.loadHairShop", [shopId]);

  const sellById: ShopsShape["sellById"] = (id, quantity) =>
    Effect.gen(function* () {
      yield* world.map.waitForGameAction("sellItem");
      return yield* quantity === undefined
        ? bridge.call("shops.sellById", [id])
        : bridge.call("shops.sellById", [id, quantity]);
    });

  const sellByName: ShopsShape["sellByName"] = (name, quantity) =>
    Effect.gen(function* () {
      yield* world.map.waitForGameAction("sellItem");
      return yield* quantity === undefined
        ? bridge.call("shops.sellByName", [name])
        : bridge.call("shops.sellByName", [name, quantity]);
    });

  return {
    buyById,
    buyByName,
    canBuyItem,
    getInfo,
    getItem,
    getItems,
    getMaxBuyQuantity,
    isMergeShop,
    load,
    loadArmorCustomize,
    loadHairShop,
    sellById,
    sellByName,
  } satisfies ShopsShape;
});

export const ShopsLive = Layer.effect(Shops, make);

import { Effect, Layer } from "effect";
import { Bridge } from "../Services/Bridge";
import { Shops } from "../Services/Shops";
import type { ShopsShape } from "../Services/Shops";

const make = Effect.gen(function* () {
  const bridge = yield* Bridge;

  return {
    buyById: (id: unknown, quantity?: number) =>
      quantity === undefined
        ? bridge.call("shops.buyById", [id])
        : bridge.call("shops.buyById", [id, quantity]),
    buyByName: (name: string, quantity?: number) =>
      quantity === undefined
        ? bridge.call("shops.buyByName", [name])
        : bridge.call("shops.buyByName", [name, quantity]),
    canBuyItem: (itemName: string) => bridge.call("shops.canBuyItem", [itemName]),
    getInfo: () => bridge.call("shops.getInfo"),
    getItem: (key: unknown) => bridge.call("shops.getItem", [key]),
    getItems: () => bridge.call("shops.getItems"),
    isMergeShop: () => bridge.call("shops.isMergeShop"),
    load: (shopId: number) => bridge.call("shops.load", [shopId]),
    loadArmorCustomize: () => bridge.call("shops.loadArmorCustomize"),
    loadHairShop: (shopId: number) => bridge.call("shops.loadHairShop", [shopId]),
    sellById: (id: unknown, quantity?: number) =>
      quantity === undefined
        ? bridge.call("shops.sellById", [id])
        : bridge.call("shops.sellById", [id, quantity]),
    sellByName: (name: string, quantity?: number) =>
      quantity === undefined
        ? bridge.call("shops.sellByName", [name])
        : bridge.call("shops.sellByName", [name, quantity]),
  } satisfies ShopsShape;
});

export const ShopsLive = Layer.effect(Shops, make);

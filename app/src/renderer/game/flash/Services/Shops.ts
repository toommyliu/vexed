import { ServiceMap } from "effect";
import type { ShopInfo, ShopItem } from "@vexed/game";
import type { BridgeEffect } from "./Bridge";

export interface ShopsShape {
  buyById(id: unknown, quantity?: number): BridgeEffect<boolean>;
  buyByName(name: string, quantity?: number): BridgeEffect<boolean>;
  canBuyItem(key: ItemIdentifierToken, quantity?: number): BridgeEffect<boolean>;
  getInfo(): BridgeEffect<ShopInfo | null>;
  getItem(key: ItemIdentifierToken): BridgeEffect<ShopItem | null>;
  getItems(): BridgeEffect<readonly ShopItem[]>;
  getMaxBuyQuantity(key: ItemIdentifierToken): BridgeEffect<number>;
  isMergeShop(): BridgeEffect<boolean>;
  load(shopId: number): BridgeEffect<void>;
  loadArmorCustomize(): BridgeEffect<void>;
  loadHairShop(shopId: number): BridgeEffect<void>;
  sellById(id: unknown, quantity?: number): BridgeEffect<boolean>;
  sellByName(name: string, quantity?: number): BridgeEffect<boolean>;
}

export class Shops extends ServiceMap.Service<Shops, ShopsShape>()(
  "flash/Services/Shops",
) {}

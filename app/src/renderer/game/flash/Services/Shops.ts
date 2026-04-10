import { ServiceMap } from "effect";
import type { BridgeEffect } from "./Bridge";

export interface ShopsShape {
  buyById(id: unknown, quantity?: number): BridgeEffect<boolean>;
  buyByName(name: string, quantity?: number): BridgeEffect<boolean>;
  canBuyItem(itemName: string): BridgeEffect<boolean>;
  getInfo(): BridgeEffect<Record<string, unknown>>;
  getItem(key: unknown): BridgeEffect<Record<string, unknown>>;
  getItems(): BridgeEffect<unknown[]>;
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

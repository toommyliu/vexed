import { ServiceMap } from "effect";
import type { BridgeEffect } from "./Bridge";

export interface InventoryShape {
  contains(item: ItemIdentifierToken, quantity?: number): BridgeEffect<boolean>;
  equip(item: ItemIdentifierToken): BridgeEffect<boolean>;
  getItem(item: ItemIdentifierToken): BridgeEffect<Record<string, unknown>>;
  getItems(): BridgeEffect<unknown[]>;
  getSlots(): BridgeEffect<number>;
  getUsedSlots(): BridgeEffect<number>;
  getAvailableSlots(): BridgeEffect<number>;
}

export class Inventory extends ServiceMap.Service<Inventory, InventoryShape>()(
  "flash/Services/Inventory",
) {}

import { ServiceMap } from "effect";
import type { BridgeEffect } from "./Bridge";

export interface TempInventoryShape {
  contains(item: ItemIdentifierToken, quantity?: number): BridgeEffect<boolean>;
  getItem(item: ItemIdentifierToken): BridgeEffect<Record<string, unknown>>;
  getItems(): BridgeEffect<unknown[]>;
}

export class TempInventory extends ServiceMap.Service<
  TempInventory,
  TempInventoryShape
>()("flash/Services/TempInventory") {}

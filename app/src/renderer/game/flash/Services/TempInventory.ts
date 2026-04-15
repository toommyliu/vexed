import type { Item } from "@vexed/game";
import { ServiceMap } from "effect";
import type { BridgeEffect } from "./Bridge";

export interface TempInventoryShape {
  contains(item: ItemIdentifierToken, quantity?: number): BridgeEffect<boolean>;
  getItem(item: ItemIdentifierToken): BridgeEffect<Item | null>;
  getItems(): BridgeEffect<readonly Item[]>;
}

export class TempInventory extends ServiceMap.Service<
  TempInventory,
  TempInventoryShape
>()("flash/Services/TempInventory") {}

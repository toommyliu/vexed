import type { Item } from "@vexed/game";
import { ServiceMap } from "effect";
import type { BridgeEffect } from "./Bridge";

export interface HouseShape {
  getItem(item: ItemIdentifierToken): BridgeEffect<Item | null>;
  getItems(): BridgeEffect<readonly Item[]>;
  getSlots(): BridgeEffect<number>;
  getUsedSlots(): BridgeEffect<number>;
  getAvailableSlots(): BridgeEffect<number>;
}

export class House extends ServiceMap.Service<House, HouseShape>()(
  "flash/Services/House",
) {}

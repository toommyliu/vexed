import { ServiceMap } from "effect";
import type { BridgeEffect } from "./Bridge";
import type { ItemData } from "@vexed/game";

export interface DropsShape {
  acceptDrop(itemId: number): BridgeEffect<void>;
  getDrops(): BridgeEffect<Record<string, unknown>>;
  getItems(): BridgeEffect<Record<string, unknown>>;
  isUsingCustomDrops(): BridgeEffect<boolean>;
  rejectDrop(itemId: number, visual?: boolean): BridgeEffect<boolean>;
  toggleUi(): BridgeEffect<void>;
  _addDrop(item: ItemData): BridgeEffect<void>;
}

export class Drops extends ServiceMap.Service<Drops, DropsShape>()(
  "flash/Services/Drops",
) {}

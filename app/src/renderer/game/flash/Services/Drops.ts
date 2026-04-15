import { ServiceMap } from "effect";
import type { BridgeEffect } from "./Bridge";

export interface DropsShape {
  acceptDrop(item: ItemIdentifierToken): BridgeEffect<void>;
  containsDrop(item: ItemIdentifierToken): BridgeEffect<boolean>;
  getDrops(): BridgeEffect<Record<string, unknown>>;
  getItems(): BridgeEffect<Record<string, unknown>>;
  isUsingCustomDrops(): BridgeEffect<boolean>;
  rejectDrop(itemId: number, visual?: boolean): BridgeEffect<boolean>;
  toggleUi(): BridgeEffect<void>;
}

export class Drops extends ServiceMap.Service<Drops, DropsShape>()(
  "flash/Services/Drops",
) {}

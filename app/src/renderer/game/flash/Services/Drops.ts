import { ServiceMap } from "effect";
import type { BridgeEffect } from "./Bridge";

export interface DropsShape {
  acceptDrop(itemId: number): BridgeEffect<void>;
  getDrops(): BridgeEffect<Record<string, unknown>>;
  getItems(): BridgeEffect<Record<string, unknown>>;
  isUsingCustomDrops(): BridgeEffect<boolean>;
  rejectDrop(itemId: number): BridgeEffect<string>;
  toggleUi(): BridgeEffect<void>;
}

export class Drops extends ServiceMap.Service<Drops, DropsShape>()(
  "flash/Services/Drops",
) {}

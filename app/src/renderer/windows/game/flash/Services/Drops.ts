import { ServiceMap } from "effect";
import type { BridgeEffect } from "./Bridge";
import type { Effect } from "effect";
import type { ItemData } from "@vexed/game";

export interface DropsShape {
  acceptDrop(item: ItemIdentifierToken): BridgeEffect<void>;
  containsDrop(item: ItemIdentifierToken): BridgeEffect<boolean>;
  getDrops(): Effect.Effect<readonly ItemData[]>;
  isUsingCustomDrops(): BridgeEffect<boolean>;
  rejectDrop(itemId: number, visual?: boolean): BridgeEffect<boolean>;
  toggleUi(): BridgeEffect<void>;
}

export class Drops extends ServiceMap.Service<Drops, DropsShape>()(
  "flash/Services/Drops",
) {}

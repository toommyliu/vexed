import { ServiceMap } from "effect";
import type { BridgeEffect } from "./Bridge";

export interface WorldShape {
  getId(): BridgeEffect<number>;
  getRoomNumber(): BridgeEffect<number>;
  getPlayerNames(): BridgeEffect<string[]>;
  getCellMonsters(): BridgeEffect<unknown[]>;
  getCells(): BridgeEffect<string[]>;
  getCellPads(): BridgeEffect<string[]>;
  isLoaded(): BridgeEffect<boolean>;
  isActionAvailable(gameAction: string): BridgeEffect<boolean>;
  getMapItem(itemId: number): BridgeEffect<void>;
  loadSwf(path: string): BridgeEffect<void>;
  reload(): BridgeEffect<void>;
  setSpawnPoint(cell?: string, pad?: string): BridgeEffect<void>;
  isPlayerInCell(name: string, cell?: string): BridgeEffect<boolean>;
}

export class World extends ServiceMap.Service<World, WorldShape>()(
  "flash/Services/World",
) {}

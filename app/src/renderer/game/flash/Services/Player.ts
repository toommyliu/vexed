import type { BoostType, Faction } from "@vexed/game";
import { Collection } from "@vexed/collection";
import { ServiceMap } from "effect";
import type { BridgeEffect } from "./Bridge";

export interface PlayerShape {
  getCell(): BridgeEffect<string>;
  getClassName(): BridgeEffect<string>;
  getFactions(): BridgeEffect<Collection<string, Faction>>;
  getGender(): BridgeEffect<string>;
  getGold(): BridgeEffect<number>;
  getHp(): BridgeEffect<number>;
  getLevel(): BridgeEffect<number>;
  getMaxHp(): BridgeEffect<number>;
  getMaxMp(): BridgeEffect<number>;
  getMp(): BridgeEffect<number>;
  getPad(): BridgeEffect<string>;
  getPosition(): BridgeEffect<[number, number]>;
  getState(): BridgeEffect<number>;
  isAfk(): BridgeEffect<boolean>;
  isReady(): BridgeEffect<boolean>;
  isMember(): BridgeEffect<boolean>;
  jumpToCell(cell: string, pad?: string): BridgeEffect<void>;
  joinMap(map: string, cell?: string, pad?: string): BridgeEffect<void>;
  goToPlayer(name: string): BridgeEffect<void>;
  rest(full?: boolean): BridgeEffect<void>;
  useBoost(boost: ItemIdentifierToken): BridgeEffect<boolean>;
  hasActiveBoost(boostType: BoostType): BridgeEffect<boolean>;
  isAlive(): BridgeEffect<boolean>;
  walkTo(x: number, y: number, walkSpeed?: number): BridgeEffect<boolean>;
}

export class Player extends ServiceMap.Service<Player, PlayerShape>()(
  "flash/Services/Player",
) {}

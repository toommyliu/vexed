import type {
  Aura,
  Avatar,
  AvatarData,
  Monster,
  MonsterData,
} from "@vexed/game";
import type { Collection } from "@vexed/collection";
import { ServiceMap } from "effect";
import type { Effect, Option } from "effect";
import type { BridgeEffect } from "./Bridge";


export interface WorldShape {
  // Bridge methods
  getCellMonsters(): BridgeEffect<unknown[]>;
  getCells(): BridgeEffect<string[]>;
  getCellPads(): BridgeEffect<string[]>;
  isLoaded(): BridgeEffect<boolean>;
  isActionAvailable(gameAction: string): BridgeEffect<boolean>;
  getMapItem(itemId: number): BridgeEffect<void>;
  loadSwf(path: string): BridgeEffect<void>;
  reload(): BridgeEffect<void>;
  setSpawnPoint(cell?: string, pad?: string): BridgeEffect<void>;
  // State getters
  getName(): Effect.Effect<string>;
  getId(): Effect.Effect<number>;
  getRoomNumber(): Effect.Effect<number>;
  getMonsters(): Effect.Effect<Collection<number, Monster>>;
  // State methods (flagged with underscore to indicate intent for internal use only)
  // TODO: migrate these to underscore methods
  _reset(): Effect.Effect<void>;
  _setName(name: string): Effect.Effect<void>;
  _setId(id: number): Effect.Effect<void>;
  _setRoomNumber(roomNumber: number): Effect.Effect<void>;
  registerPlayer(username: string, entId: number): Effect.Effect<void>;
  unregisterPlayer(username: string): Effect.Effect<void>;
  addPlayer(data: AvatarData): Effect.Effect<void>;
  removePlayer(username: string): Effect.Effect<void>;
  setSelf(username: string): Effect.Effect<void>;
  getSelf(): Effect.Effect<Option.Option<Avatar>>;
  getPlayer(username: string): Effect.Effect<Option.Option<Avatar>>;
  getPlayerByName(name: string): Effect.Effect<Option.Option<Avatar>>;
  addMonster(data: MonsterData): Effect.Effect<void>;
  getMonster(monMapId: number): Effect.Effect<Option.Option<Monster>>;
  findMonsterByName(
    name: string,
    cell?: string,
  ): Effect.Effect<Option.Option<Monster>>;
  clearAllAuras(): Effect.Effect<void>;
  clearPlayerAuras(entId: number): Effect.Effect<void>;
  clearMonsterAuras(monMapId: number): Effect.Effect<void>;
  addAura(target: "m" | "p", targetId: number, aura: Aura): Effect.Effect<void>;
  updateAura(
    target: "m" | "p",
    targetId: number,
    aura: Aura,
  ): Effect.Effect<void>;
  removeAura(
    target: "m" | "p",
    targetId: number,
    auraName: string,
  ): Effect.Effect<void>;
  debug(): Effect.Effect<unknown>;
}

export class World extends ServiceMap.Service<World, WorldShape>()(
  "flash/Services/World",
) {}

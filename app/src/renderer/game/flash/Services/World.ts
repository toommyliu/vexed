import type {
  Aura,
  Avatar,
  AvatarData,
  GameAction,
  Monster,
  MonsterData,
} from "@vexed/game";
import type { Collection } from "@vexed/collection";
import { ServiceMap } from "effect";
import type { Effect, Option } from "effect";
import type { BridgeEffect } from "./Bridge";

export interface WorldMapShape {
  // Bridge methods
  getCellMonsters(): BridgeEffect<unknown[]>;
  getCells(): BridgeEffect<string[]>;
  getCellPads(): BridgeEffect<string[]>;
  isLoaded(): BridgeEffect<boolean>;
  isActionAvailable(gameAction: GameAction): BridgeEffect<boolean>;
  getMapItem(itemId: number): BridgeEffect<void>;
  loadSwf(path: string): BridgeEffect<void>;
  reload(): BridgeEffect<void>;
  setSpawnPoint(cell?: string, pad?: string): BridgeEffect<void>;
  waitForGameAction(gameAction: GameAction): BridgeEffect<void>;

  // State methods
  getName(): Effect.Effect<string>;
  getId(): Effect.Effect<number>;
  getRoomNumber(): Effect.Effect<number>;
  setName(name: string): Effect.Effect<void>;
  setId(id: number): Effect.Effect<void>;
  setRoomNumber(roomNumber: number): Effect.Effect<void>;
  reset(): Effect.Effect<void>;
}

export interface WorldPlayersShape {
  register(username: string, entId: number): Effect.Effect<void>;
  unregister(username: string): Effect.Effect<void>;
  add(data: AvatarData): Effect.Effect<void>;
  remove(username: string): Effect.Effect<void>;
  setSelf(username: string): Effect.Effect<void>;
  getSelf(): Effect.Effect<Option.Option<Avatar>>;
  withSelf<A>(f: (self: Avatar) => A): Effect.Effect<Option.Option<A>>;
  get(username: string): Effect.Effect<Option.Option<Avatar>>;
  getByName(name: string): Effect.Effect<Option.Option<Avatar>>;
  addAura(entId: number, aura: Aura): Effect.Effect<void>;
  updateAura(entId: number, aura: Aura): Effect.Effect<void>;
  removeAura(entId: number, auraName: string): Effect.Effect<void>;
  clearAuras(entId: number): Effect.Effect<void>;
}

export interface WorldMonstersShape {
  getAll(): Effect.Effect<Collection<number, Monster>>;
  add(data: MonsterData): Effect.Effect<void>;
  get(monMapId: number): Effect.Effect<Option.Option<Monster>>;
  findByName(
    name: string,
    cell?: string,
  ): Effect.Effect<Option.Option<Monster>>;
  addAura(monMapId: number, aura: Aura): Effect.Effect<void>;
  updateAura(monMapId: number, aura: Aura): Effect.Effect<void>;
  removeAura(monMapId: number, auraName: string): Effect.Effect<void>;
  clearAuras(monMapId: number): Effect.Effect<void>;
}

export interface WorldShape {
  map: WorldMapShape;
  players: WorldPlayersShape;
  monsters: WorldMonstersShape;
}

export class World extends ServiceMap.Service<World, WorldShape>()(
  "flash/Services/World",
) {}

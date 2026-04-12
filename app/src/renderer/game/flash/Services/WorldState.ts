import type {
  Aura,
  Avatar,
  AvatarData,
  Monster,
  MonsterData,
} from "@vexed/game";
import { ServiceMap } from "effect";
import type { Effect, Option } from "effect";

export interface WorldStateShape {
  reset(): Effect.Effect<void>;
  // Player id
  registerPlayer(username: string, entId: number): Effect.Effect<void>;
  unregisterPlayer(username: string): Effect.Effect<void>;
  // Player data
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

export class WorldState extends ServiceMap.Service<
  WorldState,
  WorldStateShape
>()("flash/Services/WorldState") {}

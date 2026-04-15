import { Collection } from "@vexed/collection";
import { Faction, type Avatar, type FactionData } from "@vexed/game";
import { Effect, Layer, Option, Ref } from "effect";
import { isRecord } from "../PacketPayload";
import { Auth } from "../Services/Auth";
import { Bridge } from "../Services/Bridge";
import { Player } from "../Services/Player";
import type { PlayerShape } from "../Services/Player";
import { World } from "../Services/World";
import { waitFor } from "../../utils/waitFor";

const isFactionData = (value: unknown): value is FactionData => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value["CharFactionID"] === "string" &&
    typeof value["FactionID"] === "string" &&
    typeof value["iRank"] === "number" &&
    typeof value["iRep"] === "number" &&
    typeof value["iRepToRank"] === "number" &&
    typeof value["iSpillRep"] === "number" &&
    typeof value["sName"] === "string"
  );
};

const make = Effect.gen(function* () {
  const bridge = yield* Bridge;
  const world = yield* World;
  const auth = yield* Auth;

  const _factions = yield* Ref.make<Collection<string, Faction>>(
    new Collection(),
  );

  const fromSelfOr = <A>(orElse: A, project: (self: Avatar) => A) =>
    Effect.map(world.players.withSelf(project), (me) =>
      Option.isSome(me) ? me.value : orElse,
    );

  const getCell = () => fromSelfOr("", (me) => me.cell);

  const getClassName = () => bridge.call("player.getClassName");

  const getFactions = () =>
    Effect.gen(function* () {
      const factions = yield* bridge.call("player.getFactions");
      const validFactions = factions.filter(isFactionData);

      yield* Ref.update(_factions, (cache) => {
        for (const factionData of validFactions) {
          const key = factionData.sName;
          const existing = cache.get(key);
          if (existing) {
            existing.data = factionData;
          } else {
            cache.set(key, new Faction(factionData));
          }
        }
        return cache;
      });

      return yield* Ref.get(_factions);
    });

  const getGender = () => bridge.call("player.getGender");

  const getGold = () => bridge.call("player.getGold");

  const getHp = () => fromSelfOr(0, (me) => me.hp);

  const getLevel = () => fromSelfOr(0, (me) => me.level);

  const getMaxHp = () => fromSelfOr(0, (me) => me.maxHp);

  const getMaxMp = () => fromSelfOr(0, (me) => me.maxMp);

  const getMp = () => fromSelfOr(0, (me) => me.mp);

  const getPad = () => fromSelfOr("", (me) => me.pad);

  const getPosition = () =>
    fromSelfOr<[number, number]>([0, 0], (me) => me.position);

  const getState = () => fromSelfOr<number>(0, (me) => me.state);

  const isAfk = () => fromSelfOr(false, (me) => me.isAFK());

  const isReady = () =>
    Effect.gen(function* () {
      const isLoggedIn = yield* auth.isLoggedIn();
      const isWorldLoaded = yield* world.map.isLoaded();
      const isSelfLoaded = yield* bridge.call("player.isLoaded");
      return isLoggedIn && isWorldLoaded && isSelfLoaded;
    });

  const isMember = () => bridge.call("player.isMember");

  const jumpToCell = (cell: string, pad?: string) =>
    pad === undefined
      ? bridge.call("player.jump", [cell])
      : bridge.call("player.jump", [cell, pad]);

  const joinMap = (map: string, cell?: string, pad?: string) => {
    if (cell === undefined && pad === undefined) {
      return bridge.call("player.joinMap", [map]);
    }

    if (cell !== undefined && pad === undefined) {
      return bridge.call("player.joinMap", [map, cell]);
    }

    return bridge.call("player.joinMap", [map, cell ?? "Enter", pad]);
  };

  const goToPlayer = (name: string) => bridge.call("player.goToPlayer", [name]);

  const rest: PlayerShape["rest"] = (full) =>
    Effect.gen(function* () {
      const hp = yield* getHp();
      const mp = yield* getMp();
      const maxHp = yield* getMaxHp();
      const maxMp = yield* getMaxMp();

      if (hp >= maxHp && mp >= maxMp) {
        return;
      }

      yield* bridge.call("player.rest");

      if (full) {
        yield* waitFor(
          Effect.map(
            Effect.all([getHp(), getMp()]),
            ([currentHp, currentMp]) =>
              currentHp >= maxHp && currentMp >= maxMp,
          ),
        );
        yield* Effect.log("Rest completed");
      }
    });

  const useBoost = (itemId: number) => bridge.call("player.useBoost", [itemId]);

  const hasActiveBoost = (boostType: string) =>
    bridge.call("player.hasActiveBoost", [boostType]);

  const isAlive = () => Effect.map(getHp(), (hp) => hp > 0);

  const walkTo = (x: number, y: number, walkSpeed?: number) =>
    Effect.flatMap(isAlive(), (alive) => {
      if (!alive) {
        return Effect.succeed(false);
      }

      return walkSpeed === undefined
        ? bridge.call("player.walkTo", [x, y])
        : bridge.call("player.walkTo", [x, y, walkSpeed]);
    });

  return {
    getCell,
    getClassName,
    getFactions,
    getGender,
    getGold,
    getHp,
    getLevel,
    getMaxHp,
    getMaxMp,
    getMp,
    getPad,
    getPosition,
    getState,
    isAfk,
    isReady,
    isMember,
    jumpToCell,
    joinMap,
    goToPlayer,
    rest,
    useBoost,
    hasActiveBoost,
    isAlive,
    walkTo,
  } satisfies PlayerShape;
});

export const PlayerLive = Layer.effect(Player, make);

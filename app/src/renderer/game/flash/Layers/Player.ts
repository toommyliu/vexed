import { Faction, type FactionData } from "@vexed/game";
import { Effect, Layer, Option } from "effect";
import { Bridge } from "../Services/Bridge";
import { Player } from "../Services/Player";
import type { PlayerShape } from "../Services/Player";
import { World } from "../Services/World";
import { Auth } from "../Services/Auth";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

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

const normalizePosition = (value: unknown[]): [number, number] => {
  const x = Number(value[0] ?? 0);
  const y = Number(value[1] ?? 0);

  return [Number.isFinite(x) ? x : 0, Number.isFinite(y) ? y : 0] as [
    number,
    number,
  ];
};

const make = Effect.gen(function* () {
  const bridge = yield* Bridge;
  const world = yield* World;
  const auth = yield* Auth;

  const getCell = () =>
    Effect.gen(function* () {
      const me = yield* world.players.getSelf();
      if (!Option.isSome(me)) {
        return yield* Effect.succeed("");
      }

      return yield* Effect.succeed(me.value.cell);
    });

  const getClassName = () => bridge.call("player.getClassName");

  const getFactions = () =>
    Effect.map(bridge.call("player.getFactions"), (factions) =>
      factions
        .filter(isFactionData)
        .map((factionData) => new Faction(factionData)),
    );

  const getGender = () => bridge.call("player.getGender");

  const getGold = () => bridge.call("player.getGold");

  const getHp = () =>
    Effect.gen(function* () {
      const me = yield* world.players.getSelf();
      if (!Option.isSome(me)) {
        return yield* Effect.succeed(0);
      }

      return yield* Effect.succeed(me.value.hp);
    });

  const getLevel = () => bridge.call("player.getLevel");

  const getMaxHp = () =>
    Effect.gen(function* () {
      const me = yield* world.players.getSelf();
      if (!Option.isSome(me)) {
        return yield* Effect.succeed(0);
      }

      return yield* Effect.succeed(me.value.maxHp);
    });

  const getMaxMp = () =>
    Effect.gen(function* () {
      const me = yield* world.players.getSelf();
      if (!Option.isSome(me)) {
        return yield* Effect.succeed(0);
      }

      return yield* Effect.succeed(me.value.maxMp);
    });

  const getMp = () =>
    Effect.gen(function* () {
      const me = yield* world.players.getSelf();
      if (!Option.isSome(me)) {
        return yield* Effect.succeed(0);
      }

      return yield* Effect.succeed(me.value.mp);
    });

  const getPad = () => bridge.call("player.getPad");

  const getPosition = () =>
    Effect.map(bridge.call("player.getPosition"), normalizePosition);

  const getState = () =>
    Effect.gen(function* () {
      const me = yield* world.players.getSelf();
      if (!Option.isSome(me)) {
        return yield* Effect.succeed(0);
      }

      return yield* Effect.succeed(me.value.state);
    });

  const isAfk = () => bridge.call("player.isAfk");

  const isReady = () =>
    Effect.gen(function* () {
      const isLoggedIn = yield* auth.isLoggedIn();
      const isWorldLoaded = yield* world.map.isLoaded();
      const isSelfLoaded = yield* bridge.call("player.isLoaded");
      return isLoggedIn && isWorldLoaded && isSelfLoaded;
    });

  const isMember = () => bridge.call("player.isMember");

  const jump = (cell: string, pad?: string) =>
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

  const rest = () => bridge.call("player.rest");

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
    jump,
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

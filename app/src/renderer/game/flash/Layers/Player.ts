import { Collection } from "@vexed/collection";
import { Faction, type Avatar, type FactionData } from "@vexed/game";
import { Effect, Layer, Option, Ref } from "effect";
import { isRecord } from "../PacketPayload";
import { Auth } from "../Services/Auth";
import { Bridge } from "../Services/Bridge";
import { Player } from "../Services/Player";
import type { PlayerShape } from "../Services/Player";
import { World } from "../Services/World";
import { Inventory } from "../Services/Inventory";
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
  const inventory = yield* Inventory;

  const _factions = yield* Ref.make<Collection<string, Faction>>(
    new Collection(),
  );

  const fromSelfOr = <A>(orElse: A, project: (self: Avatar) => A) =>
    Effect.map(world.players.withSelf(project), (me) =>
      Option.isSome(me) ? me.value : orElse,
    );

  const getCell: PlayerShape["getCell"] = () => fromSelfOr("", (me) => me.cell);

  const getClassName: PlayerShape["getClassName"] = () =>
    bridge.call("player.getClassName");

  const getFactions: PlayerShape["getFactions"] = () =>
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

  const getGender: PlayerShape["getGender"] = () => bridge.call("player.getGender");

  const getGold: PlayerShape["getGold"] = () => bridge.call("player.getGold");

  const getHp: PlayerShape["getHp"] = () => fromSelfOr(0, (me) => me.hp);

  const getLevel: PlayerShape["getLevel"] = () => fromSelfOr(0, (me) => me.level);

  const getMaxHp: PlayerShape["getMaxHp"] = () => fromSelfOr(0, (me) => me.maxHp);

  const getMaxMp: PlayerShape["getMaxMp"] = () => fromSelfOr(0, (me) => me.maxMp);

  const getMp: PlayerShape["getMp"] = () => fromSelfOr(0, (me) => me.mp);

  const getPad: PlayerShape["getPad"] = () => fromSelfOr("", (me) => me.pad);

  const getPosition: PlayerShape["getPosition"] = () =>
    fromSelfOr<[number, number]>([0, 0], (me) => me.position);

  const getState: PlayerShape["getState"] = () => fromSelfOr<number>(0, (me) => me.state);

  const isAfk: PlayerShape["isAfk"] = () => fromSelfOr(false, (me) => me.isAFK());

  const isReady: PlayerShape["isReady"] =
    () =>
    Effect.all([
      auth.isLoggedIn(),
      world.map.isLoaded(),
      bridge.call("player.isLoaded"),
    ]).pipe(Effect.map(([a, b, c]) => a && b && c));

  const isMember: PlayerShape["isMember"] = () => bridge.call("player.isMember");

  const jumpToCell: PlayerShape["jumpToCell"] = (cell, pad, correction) =>
    Effect.gen(function* () {
      if (pad === undefined) {
        yield* bridge.call("player.jump", [cell]);
      } else {
        yield* bridge.call("player.jump", [cell, pad]);
      }

      if (correction) {
        const pads = yield* world.map.getCellPads();
        const currentPad = yield* getPad();

        if (pads.length > 0 && !pads.includes(currentPad)) {
          const validPad = pads[Math.floor(Math.random() * pads.length)];
          yield* bridge.call("player.jump", [cell, validPad]);
        }
      }
    });

  const joinMap: PlayerShape["joinMap"] = (map, cell, pad) => {
    if (cell === undefined && pad === undefined) {
      return bridge.call("player.joinMap", [map]);
    }

    if (cell !== undefined && pad === undefined) {
      return bridge.call("player.joinMap", [map, cell]);
    }

    return bridge.call("player.joinMap", [map, cell ?? "Enter", pad]);
  };

  const goToPlayer: PlayerShape["goToPlayer"] = (name) =>
    Effect.gen(function* () {
      const player = yield* world.players.getByName(name);
      if (Option.isNone(player)) {
        return;
      }

      yield* bridge.call("player.goToPlayer", [name]);
    });

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

  const useBoost: PlayerShape["useBoost"] = (boost) =>
    Effect.gen(function* () {
      const item = yield* inventory.getItem(boost);
      if (!item) {
        return false;
      }

      return yield* bridge.call("player.useBoost", [item.id]);
    });

  const hasActiveBoost: PlayerShape["hasActiveBoost"] = (boostType) =>
    bridge.call("player.hasActiveBoost", [boostType]);

  const isAlive: PlayerShape["isAlive"] = () => Effect.map(getHp(), (hp) => hp > 0);

  const walkTo: PlayerShape["walkTo"] = (x, y, walkSpeed) =>
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

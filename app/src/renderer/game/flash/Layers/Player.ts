import { Collection } from "@vexed/collection";
import { Faction, type Avatar, type FactionData } from "@vexed/game";
import { equalsIgnoreCase } from "@vexed/shared/string";
import { Effect, Layer, Option, Random, Ref } from "effect";
import { isRecord } from "../PacketPayload";
import { Auth } from "../Services/Auth";
import { Bridge } from "../Services/Bridge";
import type { BridgeEffect } from "../Services/Bridge";
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

const MIN_RANDOM_ROOM_NUMBER = 10_000;
const MAX_FIXED_ROOM_NUMBER = 99_999;

type MapTarget = {
  readonly map: string;
  readonly name: string;
  readonly roomNumber?: number;
  readonly requireExactRoom: boolean;
};

const parseMapTarget = (map: string): Effect.Effect<MapTarget> =>
  Effect.gen(function* () {
    const trimmed = map.trim();
    const separatorIndex = trimmed.indexOf("-");
    if (separatorIndex === -1) {
      return { map: trimmed, name: trimmed, requireExactRoom: false };
    }

    const name = trimmed.slice(0, separatorIndex);
    const roomToken = trimmed.slice(separatorIndex + 1);

    if (/^\d+$/.test(roomToken)) {
      const roomNumber = Number(roomToken);
      if (
        Number.isSafeInteger(roomNumber) &&
        roomNumber <= MAX_FIXED_ROOM_NUMBER
      ) {
        return {
          map: trimmed,
          name,
          roomNumber,
          requireExactRoom: true,
        };
      }
    }

    // Fallback to a random room number.
    const roomNumber = yield* Random.nextIntBetween(
      MIN_RANDOM_ROOM_NUMBER,
      MAX_FIXED_ROOM_NUMBER,
    );

    return {
      map: `${name}-${roomNumber}`,
      name,
      roomNumber,
      requireExactRoom: true,
    };
  });

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

  const getGender: PlayerShape["getGender"] = () =>
    bridge.call("player.getGender");

  const getGold: PlayerShape["getGold"] = () => bridge.call("player.getGold");

  const getHp: PlayerShape["getHp"] = () => fromSelfOr(0, (me) => me.hp);

  const getLevel: PlayerShape["getLevel"] = () =>
    fromSelfOr(0, (me) => me.level);

  const getMaxHp: PlayerShape["getMaxHp"] = () =>
    fromSelfOr(0, (me) => me.maxHp);

  const getMaxMp: PlayerShape["getMaxMp"] = () =>
    fromSelfOr(0, (me) => me.maxMp);

  const getMp: PlayerShape["getMp"] = () => fromSelfOr(0, (me) => me.mp);

  const getPad: PlayerShape["getPad"] = () => fromSelfOr("", (me) => me.pad);

  const getPosition: PlayerShape["getPosition"] = () =>
    fromSelfOr<[number, number]>([0, 0], (me) => me.position);

  const getState: PlayerShape["getState"] = () =>
    fromSelfOr<number>(0, (me) => me.state);

  const isAfk: PlayerShape["isAfk"] = () =>
    fromSelfOr(false, (me) => me.isAFK());

  const isReady: PlayerShape["isReady"] = () =>
    Effect.all([
      auth.isLoggedIn(),
      world.map.isLoaded(),
      bridge.call("player.isLoaded"),
    ]).pipe(Effect.map(([a, b, c]) => a && b && c));

  const isMember: PlayerShape["isMember"] = () =>
    bridge.call("player.isMember");

  const jumpToCell: PlayerShape["jumpToCell"] = (cell, pad, correction) =>
    Effect.gen(function* () {
      if (pad === undefined) {
        yield* bridge.call("player.jump", [cell]);
      } else {
        yield* bridge.call("player.jump", [cell, pad]);
      }

      if (correction) {
        yield* waitFor(
          Effect.gen(function* () {
            const currentCell = yield* getCell();
            return currentCell === cell;
          }),
          { timeout: "3 seconds" },
        );

        const currentCell = yield* getCell();
        if (currentCell !== cell) {
          return;
        }

        const pads = yield* world.map.getCellPads();
        const currentPad = yield* getPad();

        if (pads.length > 0 && !pads.includes(currentPad)) {
          const randomIndex = yield* Random.nextIntBetween(0, pads.length - 1);
          const validPad = pads[randomIndex];
          yield* bridge.call("player.jump", [cell, validPad]);
        }
      }
    });

  const isTargetMapLoaded = (targetMap: MapTarget): BridgeEffect<boolean> =>
    Effect.gen(function* () {
      const isLoaded = yield* world.map.isLoaded();
      if (!isLoaded) {
        return false;
      }

      const currentMapName = yield* world.map.getName();
      if (!equalsIgnoreCase(currentMapName, targetMap.name)) {
        return false;
      }

      if (targetMap.requireExactRoom && targetMap.roomNumber !== undefined) {
        const currentRoomNumber = yield* world.map.getRoomNumber();
        if (currentRoomNumber !== targetMap.roomNumber) {
          return false;
        }
      }

      return true;
    });

  const isAtTargetLocation = (
    targetCell: string | undefined,
    targetPad: string | undefined,
  ): BridgeEffect<boolean> =>
    Effect.gen(function* () {
      if (targetCell !== undefined) {
        const currentCell = yield* getCell();
        if (!equalsIgnoreCase(currentCell, targetCell)) {
          return false;
        }
      }

      if (targetPad !== undefined) {
        const currentPad = yield* getPad();
        if (!equalsIgnoreCase(currentPad, targetPad)) {
          return false;
        }
      }

      return true;
    });

  const targetCellExists = (targetCell: string): BridgeEffect<boolean> =>
    Effect.map(world.map.getCells(), (cells) =>
      cells.some((cell) => equalsIgnoreCase(cell, targetCell)),
    );

  const correctJoinLocation = (
    targetCell: string | undefined,
    targetPad: string | undefined,
    options?: { readonly force?: boolean },
  ): BridgeEffect<void> =>
    Effect.gen(function* () {
      if (targetCell === undefined) {
        return;
      }

      if (!options?.force) {
        const alreadyAtTarget = yield* isAtTargetLocation(
          targetCell,
          targetPad,
        );
        if (alreadyAtTarget) {
          return;
        }
      }

      const canJumpToCell = yield* targetCellExists(targetCell);
      if (!canJumpToCell) {
        return;
      }

      if (targetPad === undefined) {
        yield* bridge.call("player.jump", [targetCell]);
      } else {
        yield* bridge.call("player.jump", [targetCell, targetPad]);
      }

      yield* waitFor(isAtTargetLocation(targetCell, targetPad), {
        timeout: "5 seconds",
      });
    });

  const joinMap: PlayerShape["joinMap"] = (map, cell, pad) =>
    Effect.gen(function* () {
      const targetMap = yield* parseMapTarget(map);
      const targetCell = cell ?? (pad !== undefined ? "Enter" : undefined);

      if (yield* isTargetMapLoaded(targetMap)) {
        yield* correctJoinLocation(targetCell, pad, { force: true });
        return;
      }

      const canTransfer = yield* world.map.waitForGameAction(
        "tfer",
        "10 seconds",
      );

      if (!canTransfer) {
        return;
      }

      if (cell === undefined && pad === undefined) {
        yield* bridge.call("player.joinMap", [targetMap.map]);
      } else if (cell !== undefined && pad === undefined) {
        yield* bridge.call("player.joinMap", [targetMap.map, cell]);
      } else {
        yield* bridge.call("player.joinMap", [
          targetMap.map,
          cell ?? "Enter",
          pad,
        ]);
      }

      const loadedTargetMap = yield* waitFor(isTargetMapLoaded(targetMap), {
        timeout: "5 seconds",
      });

      if (!loadedTargetMap) {
        return;
      }

      yield* correctJoinLocation(targetCell, pad);
    });

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
      yield* world.map.waitForGameAction("rest");

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
          { timeout: "10 seconds" },
        );
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

  const isAlive: PlayerShape["isAlive"] = () =>
    Effect.map(getHp(), (hp) => hp > 0);

  const walkTo: PlayerShape["walkTo"] = (x, y, walkSpeed) =>
    Effect.gen(function* () {
      const alive = yield* isAlive();
      if (!alive) {
        return false;
      }

      const started =
        walkSpeed === undefined
          ? yield* bridge.call("player.walkTo", [x, y])
          : yield* bridge.call("player.walkTo", [x, y, walkSpeed]);

      if (!started) {
        return false;
      }

      return yield* waitFor(
        Effect.gen(function* () {
          const [currentX, currentY] = yield* getPosition();
          return currentX === x && currentY === y;
        }),
        { timeout: "3 seconds" },
      );
    }).pipe(Effect.catch(() => Effect.succeed(false)));

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

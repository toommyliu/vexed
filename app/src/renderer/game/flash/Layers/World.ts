import { Collection } from "@vexed/collection";
import { Avatar, type Aura, Monster } from "@vexed/game";
import { equalsIgnoreCase } from "@vexed/shared/string";
import {
  Effect,
  Layer,
  Option,
  Ref,
  SynchronizedRef,
  type SynchronizedRef as SynchronizedRefType,
} from "effect";
import { Bridge } from "../Services/Bridge";
import { World } from "../Services/World";
import type { WorldShape } from "../Services/World";

type TrackedAura = Aura & { stack?: number };

type RuntimeState = {
  readonly players: Collection<string, Avatar>;
  readonly playerEntityIds: Map<string, number>;
  meUsername: string | undefined;
  readonly monsters: Collection<number, Monster>;
  readonly playerAuras: Collection<number, Collection<string, TrackedAura>>;
  readonly monsterAuras: Collection<number, Collection<string, TrackedAura>>;
};

const normalize = (value: string) => value.toLowerCase();

const initialState = (): RuntimeState => ({
  players: new Collection<string, Avatar>(),
  playerEntityIds: new Map<string, number>(),
  meUsername: undefined,
  monsters: new Collection<number, Monster>(),
  playerAuras: new Collection<number, Collection<string, TrackedAura>>(),
  monsterAuras: new Collection<number, Collection<string, TrackedAura>>(),
});

const mutate = <A>(
  stateRef: SynchronizedRefType.SynchronizedRef<RuntimeState>,
  f: (state: RuntimeState) => A,
): Effect.Effect<A> =>
  SynchronizedRef.modify(stateRef, (state) => [f(state), state] as const);

const getAuraCache = (
  state: RuntimeState,
  target: "m" | "p",
): Collection<number, Collection<string, TrackedAura>> =>
  target === "m" ? state.monsterAuras : state.playerAuras;

const getTargetAuras = (
  cache: Collection<number, Collection<string, TrackedAura>>,
  targetId: number,
): Collection<string, TrackedAura> =>
  cache.ensure(targetId, () => new Collection<string, TrackedAura>());

const addAuraToTarget = (
  targetAuras: Collection<string, TrackedAura>,
  aura: Aura,
): void => {
  const existing = targetAuras.get(aura.name);
  if (existing) {
    existing.stack = (existing.stack ?? 1) + 1;
    if (aura.duration !== undefined) {
      existing.duration = aura.duration;
    }

    if (aura.value !== undefined) {
      existing.value = aura.value;
    }
    return;
  }

  targetAuras.set(aura.name, { ...aura, stack: 1 });
};

const updateAuraOnTarget = (
  targetAuras: Collection<string, TrackedAura>,
  aura: Aura,
): void => {
  const existing = targetAuras.get(aura.name);
  if (existing) {
    if (aura.duration !== undefined) {
      existing.duration = aura.duration;
    }

    if (aura.value !== undefined) {
      existing.value = aura.value;
    }
    return;
  }

  targetAuras.set(aura.name, { ...aura, stack: 1 });
};

const make = Effect.gen(function* () {
  const bridge = yield* Bridge;

  const stateRef = yield* SynchronizedRef.make(initialState());
  const runFork = Effect.runForkWith(yield* Effect.services());

  const mapIdRef = yield* Ref.make<number | null>(null);
  const mapNameRef = yield* Ref.make<string | null>(null);
  const roomNumberRef = yield* Ref.make<number | null>(null);

  // Bridge methods
  const getCellMonsters: WorldShape["getCellMonsters"] = () =>
    bridge.call("world.getCellMonsters");

  const getCells: WorldShape["getCells"] = () =>
    Effect.map(bridge.call("world.getCells"), (cells) =>
      cells.filter((cell): cell is string => typeof cell === "string"),
    );

  const getCellPads: WorldShape["getCellPads"] = () =>
    Effect.map(bridge.call("world.getCellPads"), (pads) =>
      pads.filter((pad): pad is string => typeof pad === "string"),
    );

  const isLoaded: WorldShape["isLoaded"] = () => bridge.call("world.isLoaded");

  const isActionAvailable: WorldShape["isActionAvailable"] = (gameAction) =>
    bridge.call("world.isActionAvailable", [gameAction]);

  const getMapItem: WorldShape["getMapItem"] = (itemId) =>
    bridge.call("world.getMapItem", [itemId]);

  const loadSwf: WorldShape["loadSwf"] = (path) =>
    bridge.call("world.loadSwf", [path]);

  const reload: WorldShape["reload"] = () => bridge.call("world.reload");

  const setSpawnPoint: WorldShape["setSpawnPoint"] = (cell, pad) =>
    cell === undefined && pad === undefined
      ? bridge.call("world.setSpawnPoint")
      : bridge.call("world.setSpawnPoint", [cell, pad]);

  // State getter methods

  const getId: WorldShape["getId"] = () =>
    Ref.get(mapIdRef).pipe(Effect.map((id) => id ?? 0));

  const getRoomNumber: WorldShape["getRoomNumber"] = () =>
    Ref.get(roomNumberRef).pipe(Effect.map((room) => room ?? 0));

  const getName: WorldShape["getName"] = () =>
    Ref.get(mapNameRef).pipe(Effect.map((name) => name ?? ""));

  const getMonsters: WorldShape["getMonsters"] = () =>
    mutate(stateRef, (state) => state.monsters);

  // State mutation methods
  const _setName: WorldShape["_setName"] = (name) => Ref.set(mapNameRef, name);

  const _setId: WorldShape["_setId"] = (id) => Ref.set(mapIdRef, id);

  const _setRoomNumber: WorldShape["_setRoomNumber"] = (roomNumber) =>
    Ref.set(roomNumberRef, roomNumber);

  const _reset: WorldShape["_reset"] = () =>
    mutate(stateRef, (state) => {
      state.players.clear();
      state.playerEntityIds.clear();
      state.meUsername = undefined;
      state.monsters.clear();
      state.playerAuras.clear();
      state.monsterAuras.clear();
    }).pipe(Effect.asVoid);

  const dispose = yield* bridge.onConnection((status) => {
    if (status === "OnConnectionLost") {
      runFork(_reset());
    }
  });

  yield* Effect.addFinalizer(() => Effect.sync(dispose));

  const registerPlayer: WorldShape["registerPlayer"] = (username, entId) =>
    mutate(stateRef, (state) => {
      state.playerEntityIds.set(normalize(username), entId);
    }).pipe(Effect.asVoid);

  const unregisterPlayer: WorldShape["unregisterPlayer"] = (username) =>
    mutate(stateRef, (state) => {
      state.playerEntityIds.delete(normalize(username));
    }).pipe(Effect.asVoid);

  const addPlayer: WorldShape["addPlayer"] = (data) =>
    mutate(stateRef, (state) => {
      const key = normalize(data.uoName || data.strUsername);
      state.players.set(key, new Avatar(data));
      state.playerEntityIds.set(key, data.entID);
    }).pipe(Effect.asVoid);

  const removePlayer: WorldShape["removePlayer"] = (username) =>
    mutate(stateRef, (state) => {
      const key = normalize(username);
      state.players.delete(key);
      state.playerEntityIds.delete(key);
    }).pipe(Effect.asVoid);

  const setSelf: WorldShape["setSelf"] = (username) =>
    mutate(stateRef, (state) => {
      state.meUsername = normalize(username);
    }).pipe(Effect.asVoid);

  const getSelf: WorldShape["getSelf"] = () =>
    mutate(stateRef, (state) => {
      if (!state.meUsername) {
        return Option.none();
      }

      const player = state.players.get(state.meUsername);
      return player ? Option.some(player) : Option.none();
    });

  const getPlayer: WorldShape["getPlayer"] = (username) =>
    mutate(stateRef, (state) => {
      const player = state.players.get(normalize(username));
      return player ? Option.some(player) : Option.none();
    });

  const getPlayerByName: WorldShape["getPlayerByName"] = (name) =>
    mutate(stateRef, (state) => {
      const player = state.players.find((candidate) =>
        equalsIgnoreCase(candidate.username ?? "", name),
      );
      return player ? Option.some(player) : Option.none();
    });

  const addMonster: WorldShape["addMonster"] = (data) =>
    mutate(stateRef, (state) => {
      state.monsters.set(data.monMapId, new Monster(data));
    }).pipe(Effect.asVoid);

  const getMonster: WorldShape["getMonster"] = (monMapId) =>
    mutate(stateRef, (state) => {
      const monster = state.monsters.get(monMapId);
      return monster ? Option.some(monster) : Option.none();
    });

  const findMonsterByName: WorldShape["findMonsterByName"] = (name, cell) =>
    mutate(stateRef, (state) => {
      const normalizedName = normalize(name);
      const normalizedCell = cell ? normalize(cell) : undefined;

      const monster = state.monsters.find((candidate) => {
        if (!candidate.alive) {
          return false;
        }

        if (
          normalizedCell !== undefined &&
          normalize(candidate.cell) !== normalizedCell
        ) {
          return false;
        }

        return normalize(candidate.name).includes(normalizedName);
      });

      return monster ? Option.some(monster) : Option.none();
    });

  const clearAllAuras: WorldShape["clearAllAuras"] = () =>
    mutate(stateRef, (state) => {
      state.playerAuras.clear();
      state.monsterAuras.clear();
    }).pipe(Effect.asVoid);

  const clearPlayerAuras: WorldShape["clearPlayerAuras"] = (entId) =>
    mutate(stateRef, (state) => {
      state.playerAuras.delete(entId);
    }).pipe(Effect.asVoid);

  const clearMonsterAuras: WorldShape["clearMonsterAuras"] = (monMapId) =>
    mutate(stateRef, (state) => {
      state.monsterAuras.delete(monMapId);
    }).pipe(Effect.asVoid);

  const addAura: WorldShape["addAura"] = (target, targetId, aura) =>
    mutate(stateRef, (state) => {
      const cache = getAuraCache(state, target);
      const targetAuras = getTargetAuras(cache, targetId);
      addAuraToTarget(targetAuras, aura);
    }).pipe(Effect.asVoid);

  const updateAura: WorldShape["updateAura"] = (target, targetId, aura) =>
    mutate(stateRef, (state) => {
      const cache = getAuraCache(state, target);
      const targetAuras = getTargetAuras(cache, targetId);
      updateAuraOnTarget(targetAuras, aura);
    }).pipe(Effect.asVoid);

  const removeAura: WorldShape["removeAura"] = (target, targetId, auraName) =>
    mutate(stateRef, (state) => {
      const cache = getAuraCache(state, target);
      cache.get(targetId)?.delete(auraName);
    }).pipe(Effect.asVoid);

  const debug: WorldShape["debug"] = () => SynchronizedRef.get(stateRef);

  return {
    getId,
    getRoomNumber,
    getName,
    getCellMonsters,
    getMonsters,
    getCells,
    getCellPads,
    isLoaded,
    isActionAvailable,
    getMapItem,
    loadSwf,
    reload,
    setSpawnPoint,
    _reset,
    _setName,
    _setId,
    _setRoomNumber,
    registerPlayer,
    unregisterPlayer,
    addPlayer,
    removePlayer,
    setSelf,
    getSelf,
    getPlayer,
    getPlayerByName,
    addMonster,
    getMonster,
    findMonsterByName,
    clearAllAuras,
    clearPlayerAuras,
    clearMonsterAuras,
    addAura,
    updateAura,
    removeAura,
    debug,
  } satisfies WorldShape;
});

export const WorldLive = Layer.effect(World, make);

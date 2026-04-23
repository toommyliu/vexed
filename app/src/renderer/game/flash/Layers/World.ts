import { Collection } from "@vexed/collection";
import { Avatar, Monster } from "@vexed/game";
import type { Aura } from "@vexed/game";
import { equalsIgnoreCase, includesIgnoreCase } from "@vexed/shared/string";
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
import type {
  WorldMapShape,
  WorldMonstersShape,
  WorldPlayersShape,
  WorldShape,
} from "../Services/World";
import { waitFor } from "../../utils/waitFor";

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

const clearRuntimeState = (state: RuntimeState): void => {
  state.players.clear();
  state.playerEntityIds.clear();
  state.meUsername = undefined;
  state.monsters.clear();
  state.playerAuras.clear();
  state.monsterAuras.clear();
};

const make = Effect.gen(function* () {
  const bridge = yield* Bridge;

  const stateRef = yield* SynchronizedRef.make(initialState());
  const runFork = Effect.runForkWith(yield* Effect.services());

  const mapIdRef = yield* Ref.make<number | null>(null);
  const mapNameRef = yield* Ref.make<string | null>(null);
  const roomNumberRef = yield* Ref.make<number | null>(null);

  // Bridge methods
  const getCellMonsters: WorldMapShape["getCellMonsters"] = () =>
    Effect.gen(function* () {
      const list = yield* monsters.getAll();
      const myCellOption = yield* players.withSelf((player) => player.cell);

      if (Option.isNone(myCellOption)) {
        return [];
      }

      const myCell = myCellOption.value;
      const filtered = list.filter((mon) => mon.isInCell(myCell));

      const available: Monster[] = [];
      for (const mon of filtered.values()) {
        const isAvailable = yield* bridge.call('world.isMonsterAvailable', [mon.monMapId]);
        if (isAvailable) {
          available.push(mon);
        }
      }

      return available;
    });

  const getCells: WorldMapShape["getCells"] = () =>
    Effect.map(bridge.call("world.getCells"), (cells) =>
      cells.filter((cell): cell is string => typeof cell === "string"),
    );

  const getCellPads: WorldMapShape["getCellPads"] = () =>
    Effect.map(bridge.call("world.getCellPads"), (pads) =>
      pads.filter((pad): pad is string => typeof pad === "string"),
    );

  const isLoaded: WorldMapShape["isLoaded"] = () =>
    bridge.call("world.isLoaded");

  const isActionAvailable: WorldMapShape["isActionAvailable"] = (gameAction) =>
    bridge.call("world.isActionAvailable", [gameAction]);

  const waitForGameAction: WorldMapShape["waitForGameAction"] = (gameAction) =>
    waitFor(isActionAvailable(gameAction), { timeout: "2 seconds" }).pipe(
      Effect.asVoid,
    );

  const getMapItem: WorldMapShape["getMapItem"] = (itemId) =>
    Effect.gen(function* () {
      yield* waitForGameAction("getMapItem");
      return yield* bridge.call("world.getMapItem", [itemId]);
    });

  const loadSwf: WorldMapShape["loadSwf"] = (path) =>
    bridge.call("world.loadSwf", [path]);

  const reload: WorldMapShape["reload"] = () => bridge.call("world.reload");

  const setSpawnPoint: WorldMapShape["setSpawnPoint"] = (cell, pad) =>
    Effect.gen(function* () {
      if (cell === undefined && pad === undefined) {
        return yield* bridge.call("world.setSpawnPoint");
      }

      if (cell !== undefined && pad === undefined) {
        return yield* bridge.call("world.setSpawnPoint", [cell]);
      }

      if (cell === undefined && pad !== undefined) {
        return yield* bridge.call("world.setSpawnPoint", [undefined, pad]);
      }

      return yield* bridge.call("world.setSpawnPoint", [cell, pad]);
    });

  // Map state methods
  const getId: WorldMapShape["getId"] = () =>
    Ref.get(mapIdRef).pipe(Effect.map((id) => id ?? 0));

  const getRoomNumber: WorldMapShape["getRoomNumber"] = () =>
    Ref.get(roomNumberRef).pipe(Effect.map((room) => room ?? 0));

  const getName: WorldMapShape["getName"] = () =>
    Ref.get(mapNameRef).pipe(Effect.map((name) => name ?? ""));

  const setName: WorldMapShape["setName"] = (name) => Ref.set(mapNameRef, name);

  const setId: WorldMapShape["setId"] = (id) => Ref.set(mapIdRef, id);

  const setRoomNumber: WorldMapShape["setRoomNumber"] = (roomNumber) =>
    Ref.set(roomNumberRef, roomNumber);

  const reset: WorldMapShape["reset"] = () =>
    Effect.all([
      mutate(stateRef, clearRuntimeState),
      Ref.set(mapIdRef, null),
      Ref.set(mapNameRef, null),
      Ref.set(roomNumberRef, null),
    ]).pipe(Effect.asVoid);

  const dispose = yield* bridge.onConnection((status) => {
    if (status === "OnConnectionLost") {
      runFork(reset());
    }
  });

  yield* Effect.addFinalizer(() => Effect.sync(dispose));

  // Player state methods
  const registerPlayer: WorldPlayersShape["register"] = (username, entId) =>
    mutate(stateRef, (state) => {
      state.playerEntityIds.set(normalize(username), entId);
    }).pipe(Effect.asVoid);

  const unregisterPlayer: WorldPlayersShape["unregister"] = (username) =>
    mutate(stateRef, (state) => {
      state.playerEntityIds.delete(normalize(username));
    }).pipe(Effect.asVoid);

  const addPlayer: WorldPlayersShape["add"] = (data) =>
    mutate(stateRef, (state) => {
      const key = normalize(data.uoName || data.strUsername);
      state.players.set(key, new Avatar(data));
      state.playerEntityIds.set(key, data.entID);
    }).pipe(Effect.asVoid);

  const removePlayer: WorldPlayersShape["remove"] = (username) =>
    mutate(stateRef, (state) => {
      const key = normalize(username);
      const entId = state.playerEntityIds.get(key);
      state.players.delete(key);
      state.playerEntityIds.delete(key);
      if (entId !== undefined) {
        state.playerAuras.delete(entId);
      }
    }).pipe(Effect.asVoid);

  const setSelf: WorldPlayersShape["setSelf"] = (username) =>
    mutate(stateRef, (state) => {
      state.meUsername = normalize(username);
    }).pipe(Effect.asVoid);

  const resolveSelf = (state: RuntimeState): Avatar | undefined => {
    if (!state.meUsername) {
      return undefined;
    }

    return state.players.get(state.meUsername);
  };

  const getSelf: WorldPlayersShape["getSelf"] = () =>
    mutate(stateRef, (state) => {
      const me = resolveSelf(state);
      return me ? Option.some(me) : Option.none();
    });

  const withSelf: WorldPlayersShape["withSelf"] = <A>(f: (self: Avatar) => A) =>
    mutate(stateRef, (state) => {
      const me = resolveSelf(state);
      return me ? Option.some(f(me)) : Option.none();
    });

  const getPlayer: WorldPlayersShape["get"] = (username) =>
    mutate(stateRef, (state) => {
      const player = state.players.get(normalize(username));
      return player ? Option.some(player) : Option.none();
    });

  const getPlayerByName: WorldPlayersShape["getByName"] = (name) =>
    mutate(stateRef, (state) => {
      const player = state.players.find((candidate) =>
        equalsIgnoreCase(candidate.username ?? "", name),
      );
      return player ? Option.some(player) : Option.none();
    });

  const addPlayerAura: WorldPlayersShape["addAura"] = (entId, aura) =>
    mutate(stateRef, (state) => {
      const targetAuras = getTargetAuras(state.playerAuras, entId);
      addAuraToTarget(targetAuras, aura);
    }).pipe(Effect.asVoid);

  const updatePlayerAura: WorldPlayersShape["updateAura"] = (entId, aura) =>
    mutate(stateRef, (state) => {
      const targetAuras = getTargetAuras(state.playerAuras, entId);
      updateAuraOnTarget(targetAuras, aura);
    }).pipe(Effect.asVoid);

  const removePlayerAura: WorldPlayersShape["removeAura"] = (entId, auraName) =>
    mutate(stateRef, (state) => {
      state.playerAuras.get(entId)?.delete(auraName);
    }).pipe(Effect.asVoid);

  const clearPlayerAuras: WorldPlayersShape["clearAuras"] = (entId) =>
    mutate(stateRef, (state) => {
      state.playerAuras.delete(entId);
    }).pipe(Effect.asVoid);

  // Monster state methods
  const getMonsters: WorldMonstersShape["getAll"] = () =>
    mutate(stateRef, (state) => state.monsters);

  const addMonster: WorldMonstersShape["add"] = (data) =>
    mutate(stateRef, (state) => {
      state.monsters.set(data.monMapId, new Monster(data));
    }).pipe(Effect.asVoid);

  const getMonster: WorldMonstersShape["get"] = (monMapId) =>
    mutate(stateRef, (state) => {
      const monster = state.monsters.get(monMapId);
      return monster ? Option.some(monster) : Option.none();
    });

  const findMonsterByName: WorldMonstersShape["findByName"] = (name, cell) =>
    mutate(stateRef, (state) => {
      const monster = state.monsters.find((candidate) => {
        if (cell !== undefined && !equalsIgnoreCase(candidate.cell, cell)) {
          return false;
        }

        return includesIgnoreCase(candidate.name, name);
      });

      return monster ? Option.some(monster) : Option.none();
    });

  const addMonsterAura: WorldMonstersShape["addAura"] = (monMapId, aura) =>
    mutate(stateRef, (state) => {
      const targetAuras = getTargetAuras(state.monsterAuras, monMapId);
      addAuraToTarget(targetAuras, aura);
    }).pipe(Effect.asVoid);

  const updateMonsterAura: WorldMonstersShape["updateAura"] = (
    monMapId,
    aura,
  ) =>
    mutate(stateRef, (state) => {
      const targetAuras = getTargetAuras(state.monsterAuras, monMapId);
      updateAuraOnTarget(targetAuras, aura);
    }).pipe(Effect.asVoid);

  const removeMonsterAura: WorldMonstersShape["removeAura"] = (
    monMapId,
    auraName,
  ) =>
    mutate(stateRef, (state) => {
      state.monsterAuras.get(monMapId)?.delete(auraName);
    }).pipe(Effect.asVoid);

  const clearMonsterAuras: WorldMonstersShape["clearAuras"] = (monMapId) =>
    mutate(stateRef, (state) => {
      state.monsterAuras.delete(monMapId);
    }).pipe(Effect.asVoid);

  const map: WorldMapShape = {
    getCellMonsters,
    getCells,
    getCellPads,
    isLoaded,
    isActionAvailable,
    waitForGameAction,
    getMapItem,
    loadSwf,
    reload,
    setSpawnPoint,
    getName,
    getId,
    getRoomNumber,
    setName,
    setId,
    setRoomNumber,
    reset,
  };

  const players: WorldPlayersShape = {
    register: registerPlayer,
    unregister: unregisterPlayer,
    add: addPlayer,
    remove: removePlayer,
    setSelf,
    getSelf,
    withSelf,
    get: getPlayer,
    getByName: getPlayerByName,
    addAura: addPlayerAura,
    updateAura: updatePlayerAura,
    removeAura: removePlayerAura,
    clearAuras: clearPlayerAuras,
  };

  const monsters: WorldMonstersShape = {
    getAll: getMonsters,
    add: addMonster,
    get: getMonster,
    findByName: findMonsterByName,
    addAura: addMonsterAura,
    updateAura: updateMonsterAura,
    removeAura: removeMonsterAura,
    clearAuras: clearMonsterAuras,
  };

  return {
    map,
    players,
    monsters,
  } satisfies WorldShape;
});

export const WorldLive = Layer.effect(World, make);

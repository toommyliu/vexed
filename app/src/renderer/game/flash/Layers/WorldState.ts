import { Collection } from "@vexed/collection";
import { Avatar, type Aura, Monster } from "@vexed/game";
import {
  Effect,
  Layer,
  Option,
  SynchronizedRef,
  type SynchronizedRef as SynchronizedRefType,
} from "effect";
import { Bridge } from "../Services/Bridge";
import { WorldState } from "../Services/WorldState";
import type { WorldStateShape } from "../Services/WorldState";

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
const equalsIgnoreCase = (left: string, right: string) =>
  normalize(left) === normalize(right);

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

  const reset: WorldStateShape["reset"] = () =>
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
      runFork(reset());
    }
  });

  yield* Effect.addFinalizer(() => Effect.sync(dispose));

  const registerPlayer: WorldStateShape["registerPlayer"] = (username, entId) =>
    mutate(stateRef, (state) => {
      state.playerEntityIds.set(normalize(username), entId);
    }).pipe(Effect.asVoid);

  const unregisterPlayer: WorldStateShape["unregisterPlayer"] = (username) =>
    mutate(stateRef, (state) => {
      state.playerEntityIds.delete(normalize(username));
    }).pipe(Effect.asVoid);

  const addPlayer: WorldStateShape["addPlayer"] = (data) =>
    mutate(stateRef, (state) => {
      const key = normalize(data.uoName || data.strUsername);
      state.players.set(key, new Avatar(data));
      state.playerEntityIds.set(key, data.entID);
    }).pipe(Effect.asVoid);

  const removePlayer: WorldStateShape["removePlayer"] = (username) =>
    mutate(stateRef, (state) => {
      const key = normalize(username);
      state.players.delete(key);
      state.playerEntityIds.delete(key);
    }).pipe(Effect.asVoid);

  const setSelf: WorldStateShape["setSelf"] = (username) =>
    mutate(stateRef, (state) => {
      state.meUsername = normalize(username);
    }).pipe(Effect.asVoid);

  const getSelf: WorldStateShape["getSelf"] = () =>
    mutate(stateRef, (state) => {
      if (!state.meUsername) {
        return Option.none();
      }

      const player = state.players.get(state.meUsername);
      return player ? Option.some(player) : Option.none();
    });

  const getPlayer: WorldStateShape["getPlayer"] = (username) =>
    mutate(stateRef, (state) => {
      const player = state.players.get(normalize(username));
      return player ? Option.some(player) : Option.none();
    });

  const getPlayerByName: WorldStateShape["getPlayerByName"] = (name) =>
    mutate(stateRef, (state) => {
      const player = state.players.find((candidate) =>
        equalsIgnoreCase(candidate.username ?? "", name),
      );
      return player ? Option.some(player) : Option.none();
    });

  const addMonster: WorldStateShape["addMonster"] = (data) =>
    mutate(stateRef, (state) => {
      state.monsters.set(data.monMapId, new Monster(data));
    }).pipe(Effect.asVoid);

  const getMonster: WorldStateShape["getMonster"] = (monMapId) =>
    mutate(stateRef, (state) => {
      const monster = state.monsters.get(monMapId);
      return monster ? Option.some(monster) : Option.none();
    });

  const findMonsterByName: WorldStateShape["findMonsterByName"] = (
    name,
    cell,
  ) =>
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

  const clearAllAuras: WorldStateShape["clearAllAuras"] = () =>
    mutate(stateRef, (state) => {
      state.playerAuras.clear();
      state.monsterAuras.clear();
    }).pipe(Effect.asVoid);

  const clearPlayerAuras: WorldStateShape["clearPlayerAuras"] = (entId) =>
    mutate(stateRef, (state) => {
      state.playerAuras.delete(entId);
    }).pipe(Effect.asVoid);

  const clearMonsterAuras: WorldStateShape["clearMonsterAuras"] = (monMapId) =>
    mutate(stateRef, (state) => {
      state.monsterAuras.delete(monMapId);
    }).pipe(Effect.asVoid);

  const addAura: WorldStateShape["addAura"] = (target, targetId, aura) =>
    mutate(stateRef, (state) => {
      const cache = getAuraCache(state, target);
      const targetAuras = getTargetAuras(cache, targetId);
      addAuraToTarget(targetAuras, aura);
    }).pipe(Effect.asVoid);

  const updateAura: WorldStateShape["updateAura"] = (target, targetId, aura) =>
    mutate(stateRef, (state) => {
      const cache = getAuraCache(state, target);
      const targetAuras = getTargetAuras(cache, targetId);
      updateAuraOnTarget(targetAuras, aura);
    }).pipe(Effect.asVoid);

  const removeAura: WorldStateShape["removeAura"] = (
    target,
    targetId,
    auraName,
  ) =>
    mutate(stateRef, (state) => {
      const cache = getAuraCache(state, target);
      cache.get(targetId)?.delete(auraName);
    }).pipe(Effect.asVoid);

  const debug: WorldStateShape["debug"] = () => SynchronizedRef.get(stateRef);

  return {
    reset,
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
  } satisfies WorldStateShape;
});

export const WorldStateLive = Layer.effect(WorldState, make);

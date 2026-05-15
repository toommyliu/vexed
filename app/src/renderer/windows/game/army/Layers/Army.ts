import { Effect, Layer, SynchronizedRef } from "effect";
import {
  Army,
  ArmyError,
  type ArmyEffect,
  type ArmyEquipSet,
  type ArmyRunStepOptions,
  type ArmySession,
  type ArmyShape,
} from "../Services/Army";
import { Auth } from "../../flash/Services/Auth";
import { Combat } from "../../flash/Services/Combat";
import { Inventory } from "../../flash/Services/Inventory";
import { Player } from "../../flash/Services/Player";
import { World } from "../../flash/Services/World";
import { waitFor } from "../../utils/waitFor";

interface ArmyState {
  readonly session: ArmySession | null;
  readonly nextStep: number;
}

const DEFAULT_STATE: ArmyState = {
  session: null,
  nextStep: 0,
};

const DEFAULT_JOIN_CELL = "Enter";
const DEFAULT_JOIN_PAD = "Spawn";
const WAIT_FOR_MAP_TIMEOUT = "2 minutes";

const cloneSession = (session: ArmySession): ArmySession => ({
  ...session,
  players: [...session.players],
  raw: { ...session.raw },
});

const cloneState = (state: ArmyState): ArmyState => ({
  session: state.session === null ? null : cloneSession(state.session),
  nextStep: state.nextStep,
});

const withArmyRoom = (map: string, roomNumber: string): string => {
  const targetMap = map.trim();
  if (targetMap.includes("-") || roomNumber.trim() === "") {
    return targetMap;
  }

  return `${targetMap}-${roomNumber}`;
};

const fromArmyIpc = <A>(label: string, promise: () => Promise<A>) =>
  Effect.tryPromise({
    try: promise,
    catch: (cause) => new ArmyError(label, cause),
  });

const getNestedConfigValue = (
  obj: Record<string, unknown>,
  path: string,
  defaultValue: unknown,
): unknown => {
  let current: unknown = obj;
  for (const part of path.split(".")) {
    const key = part.trim();
    if (key === "") {
      return defaultValue;
    }

    if (
      current === null ||
      typeof current !== "object" ||
      Array.isArray(current) ||
      !(key in current)
    ) {
      return defaultValue;
    }

    current = (current as Record<string, unknown>)[key];
  }

  return current;
};

const resolveConfigValue = (
  raw: Record<string, unknown>,
  key: string,
  defaultValue: unknown,
): unknown => {
  const normalized = key.trim();
  if (normalized === "") {
    return raw;
  }

  const value = normalized.includes(".")
    ? getNestedConfigValue(raw, normalized, defaultValue)
    : raw[normalized];

  return value === undefined ? defaultValue : value;
};

const assertStarted = (state: ArmyState): ArmyEffect<ArmySession> =>
  state.session === null
    ? Effect.fail(new ArmyError("Army has not been started"))
    : Effect.succeed(cloneSession(state.session));

const make = Effect.gen(function* () {
  const auth = yield* Auth;
  const combat = yield* Combat;
  const inventory = yield* Inventory;
  const player = yield* Player;
  const world = yield* World;
  const stateRef = yield* SynchronizedRef.make<ArmyState>(DEFAULT_STATE);

  const getState = SynchronizedRef.get(stateRef).pipe(Effect.map(cloneState));

  const getSession: ArmyShape["getSession"] = () =>
    getState.pipe(Effect.map((state) => state.session));

  const start: ArmyShape["start"] = (configName) =>
    Effect.gen(function* () {
      const username = yield* auth.getUsername();
      const session = yield* fromArmyIpc("Failed to start army", () =>
        window.ipc.army.start({ configName, playerName: username }),
      );

      yield* SynchronizedRef.set(stateRef, {
        session,
        nextStep: 0,
      });

      return cloneSession(session);
    });

  const leave: ArmyShape["leave"] = () =>
    Effect.gen(function* () {
      const state = yield* getState;
      if (state.session === null) {
        return;
      }

      const session = state.session;
      yield* fromArmyIpc("Failed to leave army", () =>
        window.ipc.army.leave({
          sessionId: session.sessionId,
          playerName: session.playerName,
        }),
      ).pipe(Effect.catchCause(() => Effect.void));
      yield* SynchronizedRef.set(stateRef, DEFAULT_STATE);
    });

  const isStarted: ArmyShape["isStarted"] = () =>
    getState.pipe(Effect.map((state) => state.session !== null));

  const isLeader: ArmyShape["isLeader"] = () =>
    getState.pipe(Effect.map((state) => state.session?.role === "leader"));

  const isMember: ArmyShape["isMember"] = () =>
    getState.pipe(Effect.map((state) => state.session?.role === "member"));

  const getConfigValue: ArmyShape["getConfigValue"] = (key, defaultValue) =>
    getState.pipe(
      Effect.map((state) =>
        state.session === null
          ? defaultValue
          : resolveConfigValue(state.session.raw, key, defaultValue),
      ),
    );

  const getConfigString: ArmyShape["getConfigString"] = (
    key,
    defaultValue = "",
  ) =>
    getConfigValue(key, defaultValue).pipe(
      Effect.map((value) => (typeof value === "string" ? value : defaultValue)),
    );

  const getPlayerNumber: ArmyShape["getPlayerNumber"] = () =>
    getState.pipe(Effect.map((state) => state.session?.playerNumber ?? -1));

  const nextBarrierStep = () =>
    SynchronizedRef.modify(stateRef, (state) => [
      state.nextStep,
      { ...state, nextStep: state.nextStep + 1 },
    ] as const);

  const waitAtBarrier = (
    session: ArmySession,
    step: number,
    label: string,
    options?: ArmyRunStepOptions,
  ) =>
    fromArmyIpc("Failed to synchronize army", () =>
      window.ipc.army.barrier({
        sessionId: session.sessionId,
        playerName: session.playerName,
        step,
        label,
        ...(options?.timeoutMs !== undefined
          ? { timeoutMs: options.timeoutMs }
          : null),
      }),
    );

  const runStep: ArmyShape["runStep"] = (label, action, options) =>
    Effect.gen(function* () {
      const step = yield* nextBarrierStep();
      const session = yield* getState.pipe(Effect.flatMap(assertStarted));
      const result = yield* action;
      yield* waitAtBarrier(session, step, label, options);
      return result;
    });

  const sync: ArmyShape["sync"] = (label = "sync", options) =>
    runStep(label, Effect.void, options).pipe(Effect.asVoid);

  const executeWithArmy: ArmyShape["executeWithArmy"] = (action) =>
    runStep("execute", action);

  const waitForAllInMap: ArmyShape["waitForAllInMap"] = () =>
    Effect.gen(function* () {
      const session = yield* getState.pipe(Effect.flatMap(assertStarted));
      const ready = yield* waitFor(
        Effect.gen(function* () {
          for (const armyPlayer of session.players) {
            const match = yield* world.players.getByName(armyPlayer);
            if (match._tag === "None") {
              return false;
            }
          }

          return true;
        }),
        { timeout: WAIT_FOR_MAP_TIMEOUT },
      );

      if (!ready) {
        return yield* Effect.fail(
          new ArmyError(
            `Timed out waiting for army players in map: ${session.players.join(", ")}`,
          ),
        );
      }
    });

  const joinMap: ArmyShape["joinMap"] = (map, cell, pad) =>
    runStep(
      `join:${map}`,
      Effect.gen(function* () {
        const session = yield* getState.pipe(Effect.flatMap(assertStarted));
        yield* player.joinMap(
          withArmyRoom(map, session.roomNumber),
          cell ?? DEFAULT_JOIN_CELL,
          pad ?? DEFAULT_JOIN_PAD,
        );
        yield* waitForAllInMap();
      }),
    ).pipe(Effect.asVoid);

  const kill: ArmyShape["kill"] = (target, options) =>
    runStep(`kill:${String(target)}`, combat.kill(target, options)).pipe(
      Effect.asVoid,
    );

  const killForItem: ArmyShape["killForItem"] = (
    target,
    item,
    quantity,
    isTemp,
    options,
  ) =>
    runStep(
      `${isTemp ? "kill-temp" : "kill-item"}:${String(item)}`,
      isTemp
        ? combat.killForTempItem(target, item, quantity, options)
        : combat.killForItem(target, item, quantity, options),
    ).pipe(Effect.asVoid);

  const resolveItem = (item: string | undefined, resolveItems: boolean) =>
    Effect.gen(function* () {
      if (item === undefined || item.trim() === "") {
        return undefined;
      }

      if (!resolveItems) {
        return item;
      }

      const fromItems = yield* getConfigValue(`items.${item}`);
      if (typeof fromItems === "string" && fromItems.trim() !== "") {
        return fromItems;
      }

      const fromRoot = yield* getConfigValue(item);
      return typeof fromRoot === "string" && fromRoot.trim() !== ""
        ? fromRoot
        : item;
    });

  const equipItem = (item: string | undefined, resolveItems: boolean) =>
    Effect.gen(function* () {
      const resolved = yield* resolveItem(item, resolveItems);
      if (resolved !== undefined) {
        yield* inventory.equip(resolved).pipe(Effect.asVoid);
      }
    });

  const drinkConsumable = (item: string, resolveItems: boolean) =>
    Effect.gen(function* () {
      const resolved = yield* resolveItem(item, resolveItems);
      if (resolved === undefined) {
        return;
      }

      yield* inventory.equip(resolved);
      yield* Effect.sleep("500 millis");
      yield* combat.useSkill(5, true, true);
      yield* Effect.sleep("1 second");
    });

  const readSet = (setName: string) =>
    Effect.gen(function* () {
      const playerNumber = yield* getPlayerNumber();
      const set =
        (yield* getConfigValue(`sets.${setName}`)) ??
        (yield* getConfigValue(setName));
      if (typeof set !== "object" || set === null || Array.isArray(set)) {
        return undefined;
      }

      const record = set as Record<string, unknown>;
      const playerSet = record[`Player${playerNumber}`] ?? record["Default"];
      if (
        typeof playerSet !== "object" ||
        playerSet === null ||
        Array.isArray(playerSet)
      ) {
        return undefined;
      }

      return playerSet as ArmyEquipSet;
    });

  const equipSet: ArmyShape["equipSet"] = (setName, options) =>
    runStep(
      `equip:${setName}`,
      Effect.gen(function* () {
        const set = yield* readSet(setName);
        if (set === undefined) {
          return;
        }

        const resolveItems = options?.resolveItems ?? false;
        yield* equipItem(set.SafeClass, resolveItems);
        yield* equipItem(set.SafePot, resolveItems);
        yield* equipItem(set.Class, resolveItems);
        yield* equipItem(set.SafePot, resolveItems);
        yield* equipItem(set.Weapon, resolveItems);
        yield* equipItem(set.Cape, resolveItems);
        yield* equipItem(set.Helm, resolveItems);
        yield* equipItem(set.Armor, resolveItems);
        yield* equipItem(set.Pet, resolveItems);

        for (const pot of set.Pots ?? []) {
          yield* drinkConsumable(pot, resolveItems);
        }

        yield* equipItem(set.Scroll, resolveItems);
      }),
    ).pipe(Effect.asVoid);

  return {
    start,
    leave,
    isStarted,
    isLeader,
    isMember,
    getSession,
    getConfigValue,
    getConfigString,
    getPlayerNumber,
    sync,
    runStep,
    executeWithArmy,
    waitForAllInMap,
    joinMap,
    kill,
    killForItem,
    equipSet,
  } satisfies ArmyShape;
});

export const ArmyLive = Layer.effect(Army, make);

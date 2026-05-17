import { Deferred, Effect, Layer, Option, SynchronizedRef } from "effect";
import {
  Army,
  ArmyError,
  type ArmyEffect,
  type ArmyEquipSet,
  type ArmyRunStepOptions,
  type ArmySession,
  type ArmyShape,
} from "../Services/Army";
import {
  advanceLoopTauntTurn,
  matchesLoopTauntAura,
  matchesLoopTauntMessage,
  normalizeLoopTauntOptions,
  ownsLoopTauntTurn,
  resolveTargetMonMapIdToken,
  type ArmyLoopTauntHandle,
  type NormalizedLoopTauntOptions,
} from "../LoopTaunt";
import { Auth } from "../../flash/Services/Auth";
import { Combat } from "../../flash/Services/Combat";
import { Inventory } from "../../flash/Services/Inventory";
import { PacketDomain } from "../../flash/Services/PacketDomain";
import { Player } from "../../flash/Services/Player";
import { World } from "../../flash/Services/World";
import { Jobs } from "../../jobs/Services/Jobs";
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
const LOOP_TAUNT_RESOLVE_INTERVAL = "250 millis";

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

const loopTauntJobKey = (id: string): string => `army:loop-taunt:${id}`;

const make = Effect.gen(function* () {
  const auth = yield* Auth;
  const combat = yield* Combat;
  const inventory = yield* Inventory;
  const jobs = yield* Jobs;
  const packetDomain = yield* PacketDomain;
  const player = yield* Player;
  const world = yield* World;
  const runFork = Effect.runFork;
  const stateRef = yield* SynchronizedRef.make<ArmyState>(DEFAULT_STATE);

  const getState = SynchronizedRef.get(stateRef).pipe(Effect.map(cloneState));

  const getSession: ArmyShape["getSession"] = () =>
    getState.pipe(Effect.map((state) => state.session));

  const stopLoopTauntJobs = () =>
    Effect.gen(function* () {
      const keys = yield* jobs.getRunningKeys();
      yield* Effect.forEach(
        keys.filter((key) => key.startsWith("army:loop-taunt:")),
        (key) => jobs.stop(key),
        { discard: true },
      );
    });

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

      yield* stopLoopTauntJobs();
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
    SynchronizedRef.modify(
      stateRef,
      (state) =>
        [state.nextStep, { ...state, nextStep: state.nextStep + 1 }] as const,
    );

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
    options,
  ) =>
    runStep(
      `kill-item:${String(item)}`,
      combat.killForItem(target, item, quantity, options),
    ).pipe(Effect.asVoid);

  const killForTempItem: ArmyShape["killForTempItem"] = (
    target,
    item,
    quantity,
    options,
  ) =>
    runStep(
      `kill-temp:${String(item)}`,
      combat.killForTempItem(target, item, quantity, options),
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
      yield* Effect.log({
        message: "Drank consumable",
        item: resolved,
      });
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

  const resolveLoopTauntTarget = (
    options: Pick<NormalizedLoopTauntOptions, "target">,
  ) =>
    Effect.gen(function* () {
      const tokenMonMapId = resolveTargetMonMapIdToken(options.target);
      if (tokenMonMapId !== undefined) {
        return tokenMonMapId;
      }

      if (typeof options.target !== "string") {
        return undefined;
      }

      const monster = yield* world.monsters.findByName(options.target);
      return Option.isSome(monster) ? monster.value.monMapId : undefined;
    });

  const resolveExistingLoopTauntTarget = (
    options: Pick<NormalizedLoopTauntOptions, "target">,
  ) =>
    Effect.gen(function* () {
      const tokenMonMapId = resolveTargetMonMapIdToken(options.target);
      if (tokenMonMapId !== undefined) {
        const monster = yield* world.monsters.get(tokenMonMapId);
        return Option.isSome(monster) ? tokenMonMapId : undefined;
      }

      if (typeof options.target !== "string") {
        return undefined;
      }

      const monster = yield* world.monsters.findByName(options.target);
      return Option.isSome(monster) ? monster.value.monMapId : undefined;
    });

  const waitForLoopTauntTarget = (
    options: Pick<NormalizedLoopTauntOptions, "target">,
  ) =>
    Effect.gen(function* () {
      while (true) {
        const monMapId = yield* resolveExistingLoopTauntTarget(options);
        if (monMapId !== undefined) {
          return monMapId;
        }

        yield* Effect.sleep(LOOP_TAUNT_RESOLVE_INTERVAL);
      }
    });

  const ownsLoopTauntParticipation = (
    session: ArmySession,
    options: Pick<NormalizedLoopTauntOptions, "participants">,
  ): boolean =>
    options.participants.some(
      (participant) => participant.number === session.playerNumber,
    );

  const prepareLoopTauntTarget = (
    session: ArmySession,
    options: Pick<NormalizedLoopTauntOptions, "id" | "participants" | "target">,
  ) =>
    Effect.gen(function* () {
      yield* Effect.logInfo({
        message: "Loop Taunt waiting for target",
        id: options.id,
        target: options.target,
      });
      const monMapId = yield* waitForLoopTauntTarget(options);
      yield* Effect.logInfo({
        message: "Loop Taunt target resolved",
        id: options.id,
        target: options.target,
        monMapId,
      });
      if (ownsLoopTauntParticipation(session, options)) {
        yield* Effect.logInfo({
          message: "Loop Taunt targeting monster",
          id: options.id,
          playerNumber: session.playerNumber,
          monMapId,
        });
        yield* combat.attackMonster(monMapId);
      }

      return monMapId;
    });

  const runLoopTaunt = (
    session: ArmySession,
    options: NormalizedLoopTauntOptions,
    initialTargetMonMapId: number,
    armedStep: number,
    armed: Deferred.Deferred<void, ArmyError>,
  ) =>
    Effect.scoped(
      Effect.gen(function* () {
        let targetMonMapId: number | undefined = initialTargetMonMapId;
        let turn = { nextIndex: 0 };
        let initialAuraCheckComplete = false;
        let tauntInFlight = false;

        const log = (message: string, details?: Record<string, unknown>) =>
          Effect.logInfo({
            message,
            id: options.id,
            playerNumber: session.playerNumber,
            ...(details ?? {}),
          });

        const resolveTarget = () =>
          Effect.gen(function* () {
            if (targetMonMapId !== undefined) {
              return targetMonMapId;
            }

            targetMonMapId = yield* resolveLoopTauntTarget(options);
            return targetMonMapId;
          });

        const taunt = (monMapId: number) =>
          Effect.gen(function* () {
            if (tauntInFlight) {
              yield* log("Loop Taunt cast skipped", {
                reason: "cast already in flight",
                monMapId,
              });
              return;
            }

            tauntInFlight = true;
            try {
              const ready = yield* player
                .isReady()
                .pipe(Effect.catchCause(() => Effect.succeed(false)));
              const alive = yield* player
                .isAlive()
                .pipe(Effect.catchCause(() => Effect.succeed(false)));
              if (!ready || !alive) {
                yield* log("Loop Taunt cast skipped", {
                  reason: !ready ? "player not ready" : "player not alive",
                  ready,
                  alive,
                  monMapId,
                });
                return;
              }

              yield* log("Loop Taunt casting", {
                monMapId,
                skill: options.skill,
              });
              yield* combat.attackMonster(monMapId);
              yield* combat.useSkill(options.skill, true, true);
            } finally {
              tauntInFlight = false;
            }
          }).pipe(
            Effect.catchCause((cause) =>
              Effect.logError({
                message: "loop taunt failed",
                id: options.id,
                cause,
              }),
            ),
          );

        const triggerNextTurn = (monMapId: number, reason: string) =>
          Effect.gen(function* () {
            const currentTurn = turn;
            const participant = options.participants[currentTurn.nextIndex];
            const ownsTurn = ownsLoopTauntTurn(
              options.participants,
              session.playerNumber,
              currentTurn,
            );
            turn = advanceLoopTauntTurn(options.participants, currentTurn);
            if (ownsTurn) {
              yield* log("Loop Taunt turn matched local player", {
                reason,
                monMapId,
                participantNumber: participant?.number,
                participantName: participant?.name,
                nextParticipantNumber:
                  options.participants[turn.nextIndex]?.number,
              });
              runFork(taunt(monMapId));
            } else {
              yield* log("Loop Taunt waiting for turn", {
                reason,
                monMapId,
                participantNumber: participant?.number,
                participantName: participant?.name,
                nextParticipantNumber:
                  options.participants[turn.nextIndex]?.number,
              });
            }
          });

        const runInitialAuraCheck = () =>
          Effect.gen(function* () {
            if (initialAuraCheckComplete || options.trigger.type !== "aura") {
              return;
            }

            const monMapId = yield* resolveTarget();
            if (monMapId === undefined) {
              return;
            }

            initialAuraCheckComplete = true;
            const aura = yield* world.monsters.getAura(
              monMapId,
              options.trigger.aura,
            );
            if (Option.isNone(aura)) {
              yield* log("Loop Taunt initial aura absent", {
                aura: options.trigger.aura,
                monMapId,
              });
              yield* triggerNextTurn(monMapId, "initial aura absent");
            } else {
              yield* log("Loop Taunt waiting for aura removal", {
                aura: options.trigger.aura,
                monMapId,
              });
            }
          });

        const onAuraRemoved = yield* packetDomain.on("auraRemoved", (event) =>
          Effect.gen(function* () {
            if (
              options.trigger.type !== "aura" ||
              event.targetType !== "monster" ||
              !matchesLoopTauntAura(options.trigger.aura, event.auraName)
            ) {
              return;
            }

            const monMapId = yield* resolveTarget();
            if (monMapId === undefined || event.targetId !== monMapId) {
              return;
            }

            initialAuraCheckComplete = true;
            yield* log("Loop Taunt aura removed", {
              aura: event.auraName,
              monMapId,
            });
            yield* triggerNextTurn(monMapId, "aura removed");
          }),
        );

        const onAnimationMessage = yield* packetDomain.on(
          "animationMessage",
          (event) =>
            Effect.gen(function* () {
              if (
                options.trigger.type !== "message" ||
                !matchesLoopTauntMessage(options.trigger.message, event.message)
              ) {
                return;
              }

              const monMapId = yield* resolveTarget();
              if (
                monMapId === undefined ||
                event.monMapId === undefined ||
                event.monMapId !== monMapId
              ) {
                return;
              }

              yield* log("Loop Taunt message matched", {
                configuredMessage: options.trigger.message,
                animationMessage: event.message,
                monMapId,
              });
              yield* triggerNextTurn(monMapId, "message matched");
            }),
        );

        const onMonsterDeath = yield* packetDomain.on("monsterDeath", (event) =>
          Effect.gen(function* () {
            const monMapId = yield* resolveTarget();
            if (monMapId === undefined || event.monMapId !== monMapId) {
              return;
            }

            yield* log("Loop Taunt stopped on monster death", {
              monMapId,
            });
            yield* jobs.stop(loopTauntJobKey(options.id));
          }),
        );

        yield* Effect.addFinalizer(() =>
          Effect.sync(() => {
            onAuraRemoved();
            onAnimationMessage();
            onMonsterDeath();
          }),
        );

        yield* waitAtBarrier(
          session,
          armedStep,
          `loop-taunt-armed:${options.id}`,
        );
        yield* Deferred.succeed(armed, undefined).pipe(Effect.asVoid);
        yield* log("Loop Taunt armed", {
          target: options.target,
          monMapId: targetMonMapId,
          trigger: options.trigger.type,
          participants: options.participants.map((participant) => ({
            name: participant.name,
            number: participant.number,
          })),
        });
        yield* log(
          options.trigger.type === "aura"
            ? "Loop Taunt waiting for aura trigger"
            : "Loop Taunt waiting for message trigger",
          {
            ...(options.trigger.type === "aura"
              ? { aura: options.trigger.aura }
              : { triggerMessage: options.trigger.message }),
            monMapId: targetMonMapId,
          },
        );
        while (true) {
          yield* runInitialAuraCheck();
          yield* Effect.sleep(LOOP_TAUNT_RESOLVE_INTERVAL);
        }
      }),
    ).pipe(
      Effect.catchCause((cause) =>
        Effect.gen(function* () {
          yield* Deferred.fail(
            armed,
            new ArmyError("Loop Taunt failed to arm", cause),
          );
          return yield* Effect.failCause(cause);
        }),
      ),
    );

  const stopLoopTaunt: ArmyShape["stopLoopTaunt"] = (id) =>
    Effect.gen(function* () {
      yield* Effect.logInfo({
        message: "Loop Taunt stopping",
        id,
      });
      const stopped = yield* jobs.stop(loopTauntJobKey(id));
      yield* Effect.logInfo({
        message: stopped ? "Loop Taunt stopped" : "Loop Taunt was not running",
        id,
      });
      return stopped;
    });

  const stopAllLoopTaunts: ArmyShape["stopAllLoopTaunts"] = () =>
    stopLoopTauntJobs();

  const startLoopTaunt: ArmyShape["startLoopTaunt"] = (options) =>
    Effect.gen(function* () {
      const session = yield* getState.pipe(Effect.flatMap(assertStarted));
      const normalized = yield* Effect.try({
        try: () => normalizeLoopTauntOptions(options, session.players),
        catch: (cause) => new ArmyError("Invalid Loop Taunt options", cause),
      });
      const key = loopTauntJobKey(normalized.id);
      const targetStep = yield* nextBarrierStep();
      const armedStep = yield* nextBarrierStep();
      const monMapId = yield* prepareLoopTauntTarget(session, normalized);
      yield* Effect.logInfo({
        message: "Loop Taunt waiting for army target sync",
        id: normalized.id,
        monMapId,
      });
      yield* waitAtBarrier(
        session,
        targetStep,
        `loop-taunt-target:${normalized.id}`,
      );
      yield* Effect.logInfo({
        message: "Loop Taunt target sync complete",
        id: normalized.id,
        monMapId,
      });
      const armed = yield* Deferred.make<void, ArmyError>();

      yield* Effect.logInfo({
        message: "Loop Taunt starting background job",
        id: normalized.id,
        monMapId,
      });
      yield* jobs.start(
        key,
        runLoopTaunt(session, normalized, monMapId, armedStep, armed),
        {
          replace: true,
        },
      );
      yield* Deferred.await(armed).pipe(
        Effect.onInterrupt(() =>
          stopLoopTaunt(normalized.id).pipe(Effect.asVoid),
        ),
      );

      return {
        id: normalized.id,
        stop: () => stopLoopTaunt(normalized.id),
      } satisfies ArmyLoopTauntHandle;
    });

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
    killForTempItem,
    equipSet,
    startLoopTaunt,
    stopLoopTaunt,
    stopAllLoopTaunts,
  } satisfies ArmyShape;
});

export const ArmyLive = Layer.effect(Army, make);

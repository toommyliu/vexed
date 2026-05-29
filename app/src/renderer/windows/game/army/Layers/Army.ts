import {
  Deferred,
  Effect,
  Fiber,
  Layer,
  Option,
  SynchronizedRef,
} from "effect";
import type { Aura } from "@vexed/game";
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
  DEFAULT_LOOP_TAUNT_CAST_SETTLE_MS,
  DEFAULT_LOOP_TAUNT_RESPAWN_RECOVERY_MS,
  LOOP_TAUNT_ACTION_LOCK_AURA_CATEGORIES,
  matchesLoopTauntAuraAdd,
  matchesLoopTauntAura,
  matchesLoopTauntMessage,
  normalizeLoopTauntOptions,
  resolveTargetMonMapIdToken,
  type ArmyLoopTauntHandle,
  type ArmyLoopTauntTurnContext,
  type LoopTauntCastOutcome,
  type LoopTauntTurnResolution,
  type LoopTauntTurnState,
  type NormalizedLoopTauntOptions,
  type ResolvedArmyPlayer,
} from "../LoopTaunt";
import { Auth } from "../../flash/Services/Auth";
import { Combat } from "../../flash/Services/Combat";
import { Inventory } from "../../flash/Services/Inventory";
import { PacketDomain } from "../../flash/Services/PacketDomain";
import { Player } from "../../flash/Services/Player";
import { Wait } from "../../flash/Services/Wait";
import { World, type WorldShape } from "../../flash/Services/World";
import { Jobs } from "../../jobs/Services/Jobs";

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
const LOOP_TAUNT_TARGET_SELECTION_TIMEOUT = "10 seconds";
const LOOP_TAUNT_COMMAND_DEDUPE_EPOCHS = 8;
const LOOP_TAUNT_ACTION_LOCK_CATEGORY_SET = new Set<string>(
  LOOP_TAUNT_ACTION_LOCK_AURA_CATEGORIES,
);

const getLoopTauntActionLockCategory = (
  auras: readonly Aura[],
): string | undefined => {
  for (const aura of auras) {
    const category = aura.cat?.trim().toLowerCase();
    if (
      category !== undefined &&
      LOOP_TAUNT_ACTION_LOCK_CATEGORY_SET.has(category)
    ) {
      return category;
    }
  }

  return undefined;
};

const readPlayerActionLockCategory = (
  world: WorldShape,
  playerName: string,
): Effect.Effect<string | undefined> =>
  Effect.gen(function* () {
    const self = yield* world.players
      .getByName(playerName)
      .pipe(Effect.catchCause(() => Effect.succeed(Option.none())));
    if (Option.isNone(self)) {
      return undefined;
    }

    const auras = yield* world.players
      .getAuras(self.value.data.entID)
      .pipe(Effect.catchCause(() => Effect.succeed([] as readonly Aura[])));
    return getLoopTauntActionLockCategory(auras);
  });

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
  const wait = yield* Wait;
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
    options?: ArmyRunStepOptions & {
      readonly players?: readonly string[];
    },
  ) =>
    fromArmyIpc("Failed to synchronize army", () =>
      window.ipc.army.barrier({
        sessionId: session.sessionId,
        playerName: session.playerName,
        step,
        label,
        ...(options?.players !== undefined
          ? { players: options.players }
          : null),
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
      const ready = yield* wait.until(
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

  const waitForLoopTauntCombatTarget = (monMapId: number) =>
    wait.until(
      combat.getTarget().pipe(
        Effect.map(
          (target) =>
            target !== null &&
            "monMapId" in target &&
            target.monMapId === monMapId,
        ),
        Effect.catchCause(() => Effect.succeed(false)),
      ),
      { timeout: LOOP_TAUNT_TARGET_SELECTION_TIMEOUT },
    );

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
        const targeted = yield* waitForLoopTauntCombatTarget(monMapId);
        if (!targeted) {
          return yield* Effect.fail(
            new ArmyError(
              `Timed out waiting for loop taunt target selection: ${monMapId}`,
            ),
          );
        }
      }

      return monMapId;
    });

  const runMainCoordinatedAuraLoopTaunt = (
    session: ArmySession,
    options: NormalizedLoopTauntOptions & {
      readonly trigger: Extract<NormalizedLoopTauntOptions["trigger"], { type: "aura" }>;
    },
    initialTargetMonMapId: number,
    armedStep: number,
    armed: Deferred.Deferred<void, ArmyError>,
  ) =>
    Effect.scoped(
      Effect.gen(function* () {
        let targetMonMapId = initialTargetMonMapId;
        let armedComplete = false;
        let initialAuraCheckComplete = false;
        let tauntInFlight = false;
        let latestCommandEpoch = 0;
        const handledCommandAttempts = new Map<number, Set<number>>();
        const pendingTauntFibers = new Set<ReturnType<typeof runFork>>();

        const log = (message: string, details?: Record<string, unknown>) =>
          Effect.logInfo({
            message,
            id: options.id,
            playerNumber: session.playerNumber,
            ...details,
          });

        const publishObservation = (
          payload: Omit<
            Parameters<typeof window.ipc.army.publishLoopTauntObservation>[0],
            "id" | "playerName" | "sessionId" | "targetMonMapId"
          >,
        ) =>
          fromArmyIpc("Failed to publish loop taunt observation", () =>
            window.ipc.army.publishLoopTauntObservation({
              id: options.id,
              playerName: session.playerName,
              sessionId: session.sessionId,
              targetMonMapId,
              ...payload,
            }),
          ).pipe(Effect.asVoid);

        const taunt = (monMapId: number): Effect.Effect<LoopTauntCastOutcome> =>
          Effect.gen(function* () {
            if (tauntInFlight) {
              yield* log("Loop Taunt cast skipped", {
                monMapId,
                reason: "cast already in flight",
              });
              return { reason: "in-flight", type: "skipped" } as const;
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
                const reason = ready ? "not-alive" : "not-ready";
                yield* log("Loop Taunt cast skipped", {
                  alive,
                  monMapId,
                  ready,
                  reason,
                });
                return { reason, type: "skipped" } as const;
              }

              const actionLockCategory = yield* readPlayerActionLockCategory(
                world,
                session.playerName,
              );
              if (actionLockCategory !== undefined) {
                yield* log("Loop Taunt cast skipped", {
                  actionLockCategory,
                  monMapId,
                  reason: "player action locked",
                });
                return { reason: "not-usable", type: "skipped" } as const;
              }

              yield* log("Loop Taunt casting", {
                monMapId,
                skill: options.skill,
              });
              yield* combat.attackMonster(monMapId);
              yield* combat.useSkill(options.skill, true, true);
              return { type: "cast" } as const;
            } finally {
              tauntInFlight = false;
            }
          }).pipe(
            Effect.catchCause((cause) =>
              Effect.gen(function* () {
                yield* Effect.logError({
                  cause,
                  id: options.id,
                  message: "loop taunt failed",
                });
                return { reason: "failed", type: "skipped" } as const;
              }),
            ),
          );

        const forkTrackedTaunt = (effect: Effect.Effect<void, unknown>) =>
          Effect.sync(() => {
            let fiber: ReturnType<typeof runFork> | undefined;
            fiber = runFork(
              effect.pipe(
                Effect.ensuring(
                  Effect.sync(() => {
                    if (fiber !== undefined) {
                      pendingTauntFibers.delete(fiber);
                    }
                  }),
                ),
              ),
            );
            pendingTauntFibers.add(fiber);
          });

        const onCommand = window.ipc.army.onLoopTauntCommand((command) => {
          if (
            command.sessionId !== session.sessionId ||
            command.id !== options.id ||
            command.targetMonMapId !== targetMonMapId ||
            command.selected.number !== session.playerNumber
          ) {
            return;
          }

          if (command.epoch < latestCommandEpoch) {
            return;
          }

          const attempts =
            handledCommandAttempts.get(command.epoch) ?? new Set<number>();
          handledCommandAttempts.set(command.epoch, attempts);
          if (attempts.has(command.attempt)) {
            return;
          }

          latestCommandEpoch = command.epoch;
          attempts.add(command.attempt);
          for (const epoch of handledCommandAttempts.keys()) {
            if (epoch < latestCommandEpoch - LOOP_TAUNT_COMMAND_DEDUPE_EPOCHS) {
              handledCommandAttempts.delete(epoch);
            }
          }

          void Effect.runPromise(
            forkTrackedTaunt(
              Effect.gen(function* () {
                const outcome = yield* taunt(command.targetMonMapId);
                yield* publishObservation({
                  attempt: command.attempt,
                  epoch: command.epoch,
                  outcome: outcome.type === "cast" ? "cast" : "skipped",
                  ...(outcome.type === "skipped"
                    ? { reason: outcome.reason }
                    : null),
                  type: "cast-outcome",
                });
              }),
            ),
          ).catch(() => undefined);
        });

        const onAuraAdded = yield* packetDomain.on("auraAdded", (event) =>
          Effect.gen(function* () {
            if (
              !armedComplete ||
              event.targetType !== "monster" ||
              event.targetId !== targetMonMapId ||
              !matchesLoopTauntAuraAdd(
                options.trigger.aura,
                event.auraName,
                event.aura,
              )
            ) {
              return;
            }

            const auraIcon = event.aura?.icon;
            yield* publishObservation({
              ...(auraIcon === undefined ? null : { auraIcon }),
              auraName: event.auraName,
              type: "aura-added",
            }).pipe(Effect.ignore);
            yield* log("Loop Taunt aura added", {
              aura: event.auraName,
              monMapId: targetMonMapId,
            });
          }),
        );

        const onAuraRemoved = yield* packetDomain.on("auraRemoved", (event) =>
          Effect.gen(function* () {
            if (
              !armedComplete ||
              event.targetType !== "monster" ||
              event.targetId !== targetMonMapId ||
              !matchesLoopTauntAura(options.trigger.aura, event.auraName)
            ) {
              return;
            }

            const remainingAura = yield* world.monsters
              .getAura(targetMonMapId, options.trigger.aura)
              .pipe(Effect.catchCause(() => Effect.succeed(Option.none())));
            if (Option.isSome(remainingAura)) {
              yield* log("Loop Taunt aura removal ignored", {
                aura: event.auraName,
                monMapId: targetMonMapId,
                reason: "aura still active",
                stack: remainingAura.value.stack,
              });
              return;
            }

            yield* publishObservation({
              auraName: event.auraName,
              type: "aura-removed",
            }).pipe(Effect.ignore);
            yield* log("Loop Taunt aura removed", {
              aura: event.auraName,
              delayMs: options.trigger.delayMs,
              monMapId: targetMonMapId,
            });
          }),
        );

        const onClientCastAttempt = yield* packetDomain.on(
          "loopTauntClientCastAttempt",
          (event) =>
            Effect.gen(function* () {
              if (!armedComplete || event.monMapId !== targetMonMapId) {
                return;
              }

              yield* publishObservation({ type: "client-cast-attempt" }).pipe(
                Effect.ignore,
              );
            }),
        );

        const onServerCastConfirmed = yield* packetDomain.on(
          "loopTauntServerCastConfirmed",
          (event) =>
            Effect.gen(function* () {
              if (!armedComplete || event.monMapId !== targetMonMapId) {
                return;
              }

              yield* publishObservation({
                auraIcon: event.auraIcon,
                auraName: event.auraName,
                type: "server-cast-confirmed",
              }).pipe(Effect.ignore);
            }),
        );

        yield* Effect.addFinalizer(() =>
          Effect.gen(function* () {
            yield* Effect.sync(() => {
              onCommand();
              onAuraAdded();
              onAuraRemoved();
              onClientCastAttempt();
              onServerCastConfirmed();
            });
            yield* Effect.forEach(
              Array.from(pendingTauntFibers),
              (fiber) => Fiber.interrupt(fiber),
              { discard: true },
            );
            pendingTauntFibers.clear();
            yield* fromArmyIpc("Failed to stop coordinated loop taunt", () =>
              window.ipc.army.stopLoopTaunt({
                id: options.id,
                playerName: session.playerName,
                sessionId: session.sessionId,
              }),
            ).pipe(Effect.ignore);
          }),
        );

        yield* waitAtBarrier(
          session,
          armedStep,
          `loop-taunt-armed:${options.id}`,
          {
            players: options.participants.map(
              (participant) => participant.name,
            ),
          },
        );

        yield* fromArmyIpc("Failed to start coordinated loop taunt", () =>
          window.ipc.army.startLoopTaunt({
            aura: options.trigger.aura,
            delayMs: options.trigger.delayMs,
            id: options.id,
            participants: options.participants,
            playerName: session.playerName,
            sessionId: session.sessionId,
            skill: options.skill,
            targetMonMapId,
          }),
        );
        armedComplete = true;
        yield* Deferred.succeed(armed, undefined).pipe(Effect.asVoid);
        yield* log("Loop Taunt armed", {
          monMapId: targetMonMapId,
          participants: options.participants.map((participant) => ({
            name: participant.name,
            number: participant.number,
          })),
          target: options.target,
          trigger: options.trigger.type,
        });

        while (true) {
          if (!initialAuraCheckComplete) {
            initialAuraCheckComplete = true;
            const aura = yield* world.monsters.getAura(
              targetMonMapId,
              options.trigger.aura,
            );
            if (
              Option.isNone(aura) ||
              !matchesLoopTauntAuraAdd(
                options.trigger.aura,
                aura.value.name,
                aura.value,
              )
            ) {
              yield* publishObservation({
                auraName: options.trigger.aura,
                type: "aura-missing",
              });
              yield* log("Loop Taunt initial aura absent", {
                aura: options.trigger.aura,
                monMapId: targetMonMapId,
              });
            } else {
              yield* log("Loop Taunt waiting for aura removal", {
                aura: options.trigger.aura,
                delayMs: options.trigger.delayMs,
                monMapId: targetMonMapId,
              });
            }
          }

          yield* Effect.sleep(LOOP_TAUNT_RESOLVE_INTERVAL);
        }
      }),
    ).pipe(
      Effect.catchCause((cause) =>
        Effect.gen(function* () {
          yield* Effect.logError({
            cause,
            id: options.id,
            message: "Coordinated Loop Taunt failed",
          });
          yield* Deferred.fail(
            armed,
            new ArmyError("Loop Taunt failed to arm", cause),
          );
          return yield* Effect.failCause(cause);
        }),
      ),
    );

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
        let turn: LoopTauntTurnState = { nextIndex: 0, triggerCount: 0 };
        let initialAuraCheckComplete = false;
        let armedComplete = false;
        let targetAuraActive = false;
        let tauntInFlight = false;
        const lastMessageTriggerAtByMonMapId = new Map<number, number>();
        const pendingTauntFibers = new Set<ReturnType<typeof runFork>>();
        let reconciliationToken = 0;
        let pendingReconciliationFiber:
          | ReturnType<typeof runFork>
          | undefined;

        const log = (message: string, details?: Record<string, unknown>) =>
          Effect.logInfo({
            message,
            id: options.id,
            playerNumber: session.playerNumber,
            ...details,
          });

        const resolveTarget = () =>
          Effect.gen(function* () {
            if (targetMonMapId !== undefined) {
              return targetMonMapId;
            }

            targetMonMapId = yield* resolveLoopTauntTarget(options);
            return targetMonMapId;
          });

        const readTargetAuraActive = (monMapId: number) =>
          Effect.gen(function* () {
            if (options.trigger.type !== "aura") {
              return false;
            }

            const aura = yield* world.monsters.getAura(
              monMapId,
              options.trigger.aura,
            );
            return (
              Option.isSome(aura) &&
              matchesLoopTauntAuraAdd(
                options.trigger.aura,
                aura.value.name,
                aura.value,
              )
            );
          });

        const refreshTargetAuraActive = (monMapId: number) =>
          Effect.gen(function* () {
            targetAuraActive = yield* readTargetAuraActive(monMapId);
            return targetAuraActive;
          });

        const taunt = (monMapId: number): Effect.Effect<LoopTauntCastOutcome> =>
          Effect.gen(function* () {
            if (tauntInFlight) {
              yield* log("Loop Taunt cast skipped", {
                reason: "cast already in flight",
                monMapId,
              });
              return { reason: "in-flight", type: "skipped" } as const;
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
                return {
                  reason: ready ? "not-alive" : "not-ready",
                  type: "skipped",
                } as const;
              }

              const actionLockCategory = yield* readPlayerActionLockCategory(
                world,
                session.playerName,
              );
              if (actionLockCategory !== undefined) {
                yield* log("Loop Taunt cast skipped", {
                  actionLockCategory,
                  monMapId,
                  reason: "player action locked",
                });
                return { reason: "not-usable", type: "skipped" } as const;
              }

              yield* log("Loop Taunt casting", {
                monMapId,
                skill: options.skill,
              });
              yield* combat.attackMonster(monMapId);
              yield* combat.useSkill(options.skill, true, true);
              return { type: "cast" } as const;
            } finally {
              tauntInFlight = false;
            }
          }).pipe(
            Effect.catchCause((cause) =>
              Effect.gen(function* () {
                yield* Effect.logError({
                  message: "loop taunt failed",
                  id: options.id,
                  cause,
                });
                return { reason: "failed", type: "skipped" } as const;
              }),
            ),
          );

        const forkTrackedTaunt = (effect: Effect.Effect<void, unknown>) =>
          Effect.sync(() => {
            let fiber: ReturnType<typeof runFork> | undefined;
            fiber = runFork(
              effect.pipe(
                Effect.ensuring(
                  Effect.sync(() => {
                    if (fiber !== undefined) {
                      pendingTauntFibers.delete(fiber);
                    }
                  }),
                ),
              ),
            );
            pendingTauntFibers.add(fiber);
          });

        const cancelReconciliation = () =>
          Effect.gen(function* () {
            reconciliationToken += 1;
            const fiber = pendingReconciliationFiber;
            pendingReconciliationFiber = undefined;
            if (fiber !== undefined) {
              yield* Fiber.interrupt(fiber);
            }
          });

        const isReconciliationCurrent = (token: number): boolean =>
          token === reconciliationToken;

        const waitForLocalRecovery = (
          token: number,
          monMapId: number,
          selected: ResolvedArmyPlayer,
        ) =>
          Effect.gen(function* () {
            const deadline = Date.now() + DEFAULT_LOOP_TAUNT_RESPAWN_RECOVERY_MS;

            while (Date.now() < deadline) {
              if (!isReconciliationCurrent(token)) {
                return false;
              }

              if (targetAuraActive || (yield* refreshTargetAuraActive(monMapId))) {
                return false;
              }

              const ready = yield* player
                .isReady()
                .pipe(Effect.catchCause(() => Effect.succeed(false)));
              const alive = yield* player
                .isAlive()
                .pipe(Effect.catchCause(() => Effect.succeed(false)));
              if (ready && alive) {
                yield* log("Loop Taunt recovery retrying selected player", {
                  monMapId,
                  selectedName: selected.name,
                  selectedNumber: selected.number,
                });
                yield* taunt(monMapId);
                return true;
              }

              yield* Effect.sleep(LOOP_TAUNT_RESOLVE_INTERVAL);
            }

            return false;
          });

        const clearCurrentReconciliation = (token: number) =>
          Effect.sync(() => {
            if (isReconciliationCurrent(token)) {
              reconciliationToken += 1;
              pendingReconciliationFiber = undefined;
            }
          });

        const scheduleAuraReconciliation = (
          monMapId: number,
          resolution: LoopTauntTurnResolution,
          delayMs: number,
        ) =>
          Effect.gen(function* () {
            if (options.trigger.type !== "aura") {
              return;
            }

            yield* cancelReconciliation();
            const token = reconciliationToken;
            const ownsSelected =
              resolution.selected.number === session.playerNumber;

            let fiber: ReturnType<typeof runFork> | undefined;
            fiber = runFork(
              Effect.gen(function* () {
                const initialWaitMs =
                  delayMs + DEFAULT_LOOP_TAUNT_CAST_SETTLE_MS;
                if (initialWaitMs > 0) {
                  yield* Effect.sleep(`${initialWaitMs} millis`);
                }

                if (!isReconciliationCurrent(token)) {
                  return;
                }

                if (targetAuraActive || (yield* refreshTargetAuraActive(monMapId))) {
                  return;
                }

                yield* log("Loop Taunt recovery started", {
                  monMapId,
                  selectedName: resolution.selected.name,
                  selectedNumber: resolution.selected.number,
                  triggerCount: turn.triggerCount,
                });

                if (ownsSelected) {
                  yield* waitForLocalRecovery(
                    token,
                    monMapId,
                    resolution.selected,
                  );
                } else {
                  yield* Effect.sleep(
                    `${DEFAULT_LOOP_TAUNT_RESPAWN_RECOVERY_MS} millis`,
                  );
                }

                if (!isReconciliationCurrent(token)) {
                  return;
                }

                yield* Effect.sleep(
                  `${DEFAULT_LOOP_TAUNT_CAST_SETTLE_MS} millis`,
                );

                if (!isReconciliationCurrent(token)) {
                  return;
                }

                if (targetAuraActive || (yield* refreshTargetAuraActive(monMapId))) {
                  return;
                }

                yield* log("Loop Taunt recovery expired", {
                  monMapId,
                  selectedName: resolution.selected.name,
                  selectedNumber: resolution.selected.number,
                  triggerCount: turn.triggerCount,
                });
                yield* clearCurrentReconciliation(token);
                yield* triggerNextTurn(monMapId, "missed cast recovery expired");
              }).pipe(
                Effect.catchCause((cause) =>
                  Effect.logError({
                    message: "Loop Taunt recovery failed",
                    id: options.id,
                    monMapId,
                    selectedName: resolution.selected.name,
                    selectedNumber: resolution.selected.number,
                    cause,
                  }),
                ),
                Effect.ensuring(
                  Effect.sync(() => {
                    if (
                      fiber !== undefined &&
                      pendingReconciliationFiber === fiber
                    ) {
                      pendingReconciliationFiber = undefined;
                    }
                  }),
                ),
              ),
            );
            pendingReconciliationFiber = fiber;
          });

        const localPlayer = {
          name: session.playerName,
          number: session.playerNumber,
        };

        const readonlyWorld: ArmyLoopTauntTurnContext["world"] = {
          monsters: {
            get: world.monsters.get,
            getAura: world.monsters.getAura,
          },
          players: {
            getAll: world.players.getAll,
            getAura: world.players.getAura,
            getAuras: world.players.getAuras,
            getByName: world.players.getByName,
          },
        };

        const shouldCandidateTaunt = (
          context: ArmyLoopTauntTurnContext,
        ): Effect.Effect<boolean> =>
          Effect.suspend(() => {
            if (options.shouldTaunt === undefined) {
              return Effect.succeed(true);
            }

            const result = options.shouldTaunt(context);
            return Effect.isEffect(result)
              ? (result as Effect.Effect<boolean, unknown>)
              : Effect.succeed(result);
          }).pipe(
            Effect.map((result) => result === true),
            Effect.catchCause((cause) =>
              Effect.gen(function* () {
                yield* Effect.logError({
                  message: "Loop Taunt shouldTaunt failed",
                  id: options.id,
                  candidateName: context.candidate.name,
                  candidateNumber: context.candidate.number,
                  scheduledName: context.scheduled.name,
                  scheduledNumber: context.scheduled.number,
                  triggerCount: context.turn.triggerCount,
                  cause,
                });
                return false;
              }),
            ),
          );

        const resolveTurn = (
          monMapId: number,
          currentTurn: LoopTauntTurnState,
        ): Effect.Effect<LoopTauntTurnResolution, ArmyError> =>
          Effect.gen(function* () {
            if (options.participants.length === 0) {
              return yield* Effect.fail(
                new ArmyError("Loop Taunt requires at least one participant"),
              );
            }

            const startIndex =
              currentTurn.nextIndex % options.participants.length;
            const scheduled = options.participants[startIndex]!;
            const skipped: ResolvedArmyPlayer[] = [];

            yield* log("Loop Taunt turn resolving", {
              monMapId,
              scheduledName: scheduled.name,
              scheduledNumber: scheduled.number,
              trigger: options.trigger.type,
              triggerCount: currentTurn.triggerCount,
            });

            for (
              let offset = 0;
              offset < options.participants.length;
              offset += 1
            ) {
              const candidateIndex =
                (startIndex + offset) % options.participants.length;
              const candidate = options.participants[candidateIndex]!;
              const shouldTaunt = yield* shouldCandidateTaunt({
                candidate,
                id: options.id,
                localPlayer,
                participants: options.participants,
                scheduled,
                target: {
                  monMapId,
                  token: options.target,
                },
                trigger: options.trigger,
                turn: {
                  index: currentTurn.nextIndex,
                  triggerCount: currentTurn.triggerCount,
                },
                world: readonlyWorld,
              });

              if (shouldTaunt) {
                const nextState = {
                  nextIndex: (candidateIndex + 1) % options.participants.length,
                  triggerCount: currentTurn.triggerCount + 1,
                };
                return {
                  nextState,
                  scheduled,
                  selected: candidate,
                  selectedIndex: candidateIndex,
                  skipped,
                };
              }

              skipped.push(candidate);
              yield* log("Loop Taunt candidate skipped", {
                candidateName: candidate.name,
                candidateNumber: candidate.number,
                monMapId,
                scheduledName: scheduled.name,
                scheduledNumber: scheduled.number,
                triggerCount: currentTurn.triggerCount,
              });
            }

            yield* log("Loop Taunt no eligible participant", {
              monMapId,
              noEligiblePolicy: options.noEligiblePolicy,
              scheduledName: scheduled.name,
              scheduledNumber: scheduled.number,
              skipped: skipped.map((participant) => ({
                name: participant.name,
                number: participant.number,
              })),
              triggerCount: currentTurn.triggerCount,
            });

            if (options.noEligiblePolicy === "cast-scheduled") {
              return {
                nextState: {
                  nextIndex: (startIndex + 1) % options.participants.length,
                  triggerCount: currentTurn.triggerCount + 1,
                },
                scheduled,
                selected: scheduled,
                selectedIndex: startIndex,
                skipped,
              };
            }

            return yield* Effect.fail(
              new ArmyError("Loop Taunt found no eligible participant"),
            );
          });

        const triggerNextTurn = (
          monMapId: number,
          reason: string,
          delayMs = 0,
        ) =>
          Effect.gen(function* () {
            const currentTurn = turn;
            const resolution = yield* resolveTurn(monMapId, currentTurn).pipe(
              Effect.catchCause((cause) =>
                Effect.gen(function* () {
                  yield* Effect.logError({
                    message: "Loop Taunt turn resolution failed",
                    id: options.id,
                    monMapId,
                    reason,
                    triggerCount: currentTurn.triggerCount,
                    cause,
                  });
                  yield* jobs.stop(loopTauntJobKey(options.id));
                  return undefined;
                }),
              ),
            );

            if (resolution === undefined) {
              return;
            }

            turn = resolution.nextState;
            const ownsTurn =
              resolution.selected.number === session.playerNumber;

            yield* log("Loop Taunt turn selected", {
              reason,
              monMapId,
              scheduledName: resolution.scheduled.name,
              scheduledNumber: resolution.scheduled.number,
              selectedName: resolution.selected.name,
              selectedNumber: resolution.selected.number,
              selectedIndex: resolution.selectedIndex,
              skipped: resolution.skipped.map((participant) => ({
                name: participant.name,
                number: participant.number,
              })),
              trigger: options.trigger.type,
              triggerCount: currentTurn.triggerCount,
              nextParticipantNumber:
                options.participants[turn.nextIndex]?.number,
            });

            yield* scheduleAuraReconciliation(monMapId, resolution, delayMs);

            if (ownsTurn) {
              yield* log("Loop Taunt turn matched local player", {
                reason,
                monMapId,
                participantNumber: resolution.selected.number,
                participantName: resolution.selected.name,
                delayMs,
                nextParticipantNumber:
                  options.participants[turn.nextIndex]?.number,
              });
              yield* forkTrackedTaunt(
                Effect.gen(function* () {
                  if (delayMs > 0) {
                    yield* Effect.sleep(`${delayMs} millis`);
                  }

                  yield* taunt(monMapId);
                }),
              );
            } else {
              yield* log("Loop Taunt waiting for turn", {
                reason,
                monMapId,
                participantNumber: resolution.selected.number,
                participantName: resolution.selected.name,
                delayMs,
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
            if (
              Option.isNone(aura) ||
              !matchesLoopTauntAuraAdd(
                options.trigger.aura,
                aura.value.name,
                aura.value,
              )
            ) {
              targetAuraActive = false;
              yield* log("Loop Taunt initial aura absent", {
                aura: options.trigger.aura,
                monMapId,
              });
              yield* triggerNextTurn(monMapId, "initial aura absent");
            } else {
              targetAuraActive = true;
              yield* log("Loop Taunt waiting for aura removal", {
                aura: options.trigger.aura,
                monMapId,
              });
            }
          });

        const primeAuraState = () =>
          Effect.gen(function* () {
            if (options.trigger.type !== "aura") {
              return;
            }

            const monMapId = yield* resolveTarget();
            if (monMapId === undefined) {
              return;
            }

            const aura = yield* world.monsters.getAura(
              monMapId,
              options.trigger.aura,
            );
            targetAuraActive =
              Option.isSome(aura) &&
              matchesLoopTauntAuraAdd(
                options.trigger.aura,
                aura.value.name,
                aura.value,
              );
          });

        const onAuraAdded = yield* packetDomain.on("auraAdded", (event) =>
          Effect.gen(function* () {
            if (
              !armedComplete ||
              options.trigger.type !== "aura" ||
              event.targetType !== "monster" ||
              !matchesLoopTauntAuraAdd(
                options.trigger.aura,
                event.auraName,
                event.aura,
              )
            ) {
              return;
            }

            const monMapId = yield* resolveTarget();
            if (monMapId === undefined || event.targetId !== monMapId) {
              return;
            }

            initialAuraCheckComplete = true;
            targetAuraActive = true;
            yield* cancelReconciliation();
            yield* log("Loop Taunt aura added", {
              aura: event.auraName,
              monMapId,
            });
          }),
        );

        const onAuraRemoved = yield* packetDomain.on("auraRemoved", (event) =>
          Effect.gen(function* () {
            if (
              !armedComplete ||
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

            if (!targetAuraActive) {
              yield* log("Loop Taunt aura removal ignored", {
                aura: event.auraName,
                monMapId,
                reason: "aura was not active",
              });
              return;
            }

            const remainingAura = yield* world.monsters.getAura(
              monMapId,
              options.trigger.aura,
            );
            if (Option.isSome(remainingAura)) {
              yield* log("Loop Taunt aura removal ignored", {
                aura: event.auraName,
                monMapId,
                reason: "aura still active",
                stack: remainingAura.value.stack,
              });
              return;
            }

            initialAuraCheckComplete = true;
            targetAuraActive = false;
            yield* log("Loop Taunt aura removed", {
              aura: event.auraName,
              delayMs: options.trigger.delayMs,
              monMapId,
            });
            yield* triggerNextTurn(
              monMapId,
              "aura removed",
              options.trigger.delayMs,
            );
          }),
        );

        const onAnimationMessage = yield* packetDomain.on(
          "animationMessage",
          (event) =>
            Effect.gen(function* () {
              if (
                !armedComplete ||
                options.trigger.type !== "message" ||
                !matchesLoopTauntMessage(options.trigger.message, event.message)
              ) {
                return;
              }

              const monMapId = yield* resolveTarget();
              const eventMonMapId =
                event.sourceMonMapId ?? event.targetMonMapId ?? event.monMapId;
              if (monMapId === undefined || eventMonMapId !== monMapId) {
                return;
              }

              if (options.trigger.debounceMs > 0) {
                const now = Date.now();
                const lastTriggeredAt =
                  lastMessageTriggerAtByMonMapId.get(monMapId);
                if (
                  lastTriggeredAt !== undefined &&
                  now - lastTriggeredAt < options.trigger.debounceMs
                ) {
                  yield* log("Loop Taunt message debounced", {
                    configuredMessage: options.trigger.message,
                    animationMessage: event.message,
                    debounceMs: options.trigger.debounceMs,
                    elapsedMs: now - lastTriggeredAt,
                    monMapId,
                  });
                  return;
                }

                lastMessageTriggerAtByMonMapId.set(monMapId, now);
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
          Effect.gen(function* () {
            yield* Effect.sync(() => {
              onAuraAdded();
              onAuraRemoved();
              onAnimationMessage();
              onMonsterDeath();
            });
            yield* Effect.forEach(
              Array.from(pendingTauntFibers),
              (fiber) => Fiber.interrupt(fiber),
              { discard: true },
            );
            pendingTauntFibers.clear();
            const reconciliationFiber = pendingReconciliationFiber;
            pendingReconciliationFiber = undefined;
            reconciliationToken += 1;
            if (reconciliationFiber !== undefined) {
              yield* Fiber.interrupt(reconciliationFiber);
            }
          }),
        );

        yield* waitAtBarrier(
          session,
          armedStep,
          `loop-taunt-armed:${options.id}`,
          {
            players: options.participants.map(
              (participant) => participant.name,
            ),
          },
        );
        yield* primeAuraState();
        armedComplete = true;
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
              ? { aura: options.trigger.aura, delayMs: options.trigger.delayMs }
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
      const participantNames = normalized.participants.map(
        (participant) => participant.name,
      );
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
        { players: participantNames },
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
      const loopTauntEffect =
        normalized.trigger.type === "aura" && normalized.shouldTaunt === undefined
          ? runMainCoordinatedAuraLoopTaunt(
              session,
              normalized as NormalizedLoopTauntOptions & {
                readonly trigger: Extract<
                  NormalizedLoopTauntOptions["trigger"],
                  { type: "aura" }
                >;
              },
              monMapId,
              armedStep,
              armed,
            )
          : runLoopTaunt(session, normalized, monMapId, armedStep, armed);
      yield* jobs.start(
        key,
        loopTauntEffect,
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

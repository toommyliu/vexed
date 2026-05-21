import type { Avatar, Monster } from "@vexed/game";
import { Deferred, Effect, Layer, Option, Ref, Semaphore } from "effect";
import {
  DEFAULT_FOLLOWER_ATTEMPTS,
  normalizeFollowerConfig,
  type FollowerConfig,
  type FollowerPhase,
  type FollowerState,
} from "../../../../../shared/follower";
import {
  findCombatProfileByRef,
  type CombatProfileAnimationTrigger,
  type CombatProfile,
} from "../../../../../shared/combat-profiles";
import {
  castNextCombatProfileStep,
  type CombatProfileCursor,
  isAttackableMonster,
  makeCombatProfileCursor,
  matchesCombatProfileAnimationTriggerMessage,
} from "../../combatProfiles";
import { waitFor } from "../../utils/waitFor";
import { Combat } from "../../flash/Services/Combat";
import { PacketDomain } from "../../flash/Services/PacketDomain";
import { Player } from "../../flash/Services/Player";
import { Packet } from "../../flash/Services/Packet";
import { World } from "../../flash/Services/World";
import { Jobs } from "../../jobs/Services/Jobs";
import {
  Follower,
  type FollowerShape,
  type FollowerStateListener,
  type FollowerStartOptions,
} from "../Services/Follower";

const FOLLOWER_JOB_KEY = "features:follower";
const LOOP_INTERVAL_MS = 500;
const RETRY_BACKOFF_BASE_MS = 500;
const RETRY_BACKOFF_CAP_MS = 8_000;
const SAME_LOCATION_TIMEOUT = "5 seconds";
const GOTO_PLAYER_TIMEOUT = "10 seconds";

type FollowFailure = {
  readonly ok: false;
  readonly retry: boolean;
  readonly reason: string;
  readonly error: string;
};

type FollowResult = { readonly ok: true } | FollowFailure;
type FallbackResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason?: string; readonly error?: string };
type Position = readonly [number, number];

const normalizeName = (value: string): string => value.trim().toLowerCase();

const errorMessage = (cause: unknown, fallback: string): string =>
  cause instanceof Error && cause.message !== "" ? cause.message : fallback;

const toState = (
  enabled: boolean,
  running: boolean,
  config: FollowerConfig | undefined,
  profile: CombatProfile | undefined,
  phase: FollowerPhase,
  attemptsRemaining: number,
  lastError: string | undefined,
  stoppedReason: string | undefined,
): FollowerState => ({
  enabled,
  running,
  targetName: config?.targetName ?? "",
  ...(profile === undefined
    ? {}
    : {
        profileId: profile.id,
        profileLabel: profile.label,
      }),
  phase,
  attemptsRemaining,
  ...(lastError === undefined || lastError === "" ? {} : { lastError }),
  ...(stoppedReason === undefined || stoppedReason === ""
    ? {}
    : { stoppedReason }),
});

const isSameName = (left: string | undefined, right: string): boolean =>
  normalizeName(left ?? "") === normalizeName(right);

const sameCellPad = (left: Avatar, right: Avatar): boolean =>
  left.cell.toLowerCase() === right.cell.toLowerCase() &&
  left.pad.toLowerCase() === right.pad.toLowerCase();

const hasRealPosition = ([x, y]: readonly [number, number]): boolean =>
  Number.isFinite(x) && Number.isFinite(y) && (x !== 0 || y !== 0);

const samePosition = (left: Position, right: Position): boolean =>
  left[0] === right[0] && left[1] === right[1];

const isMonsterInCell = (monster: Monster, cell: string): boolean =>
  monster.cell.toLowerCase() === cell.toLowerCase();

const resolveFallbackMap = (map: string, roomOverride: string): string => {
  const trimmedMap = map.trim();
  const trimmedOverride = roomOverride.trim();
  if (trimmedMap === "" || trimmedOverride === "" || trimmedMap.includes("-")) {
    return trimmedMap;
  }

  return `${trimmedMap}-${trimmedOverride}`;
};

const retryBackoffDelay = (attemptIndex: number): number =>
  Math.min(
    RETRY_BACKOFF_CAP_MS,
    RETRY_BACKOFF_BASE_MS * 2 ** Math.max(0, attemptIndex - 1),
  );

const make = Effect.gen(function* () {
  const combat = yield* Combat;
  const jobs = yield* Jobs;
  const packet = yield* Packet;
  const maybePacketDomain = yield* Effect.serviceOption(PacketDomain);
  const player = yield* Player;
  const world = yield* World;
  const enabledRef = yield* Ref.make(false);
  const runningRef = yield* Ref.make(false);
  const configRef = yield* Ref.make<FollowerConfig | undefined>(undefined);
  const profileRef = yield* Ref.make<CombatProfile | undefined>(undefined);
  const phaseRef = yield* Ref.make<FollowerPhase>("idle");
  const attemptsRef = yield* Ref.make(DEFAULT_FOLLOWER_ATTEMPTS);
  const lastErrorRef = yield* Ref.make<string | undefined>(undefined);
  const stoppedReasonRef = yield* Ref.make<string | undefined>(undefined);
  const runTokenRef = yield* Ref.make(0);
  const gotoDeniedTargetNameRef = yield* Ref.make<string | undefined>(
    undefined,
  );
  const lastCopyWalkTargetPositionRef = yield* Ref.make<Position | undefined>(
    undefined,
  );
  const targetLocationWakeRequestedRef = yield* Ref.make(false);
  const targetLocationWakeRef = yield* Ref.make<
    Deferred.Deferred<void> | undefined
  >(undefined);
  const animationTriggerLastCastRef = yield* Ref.make<
    ReadonlyMap<string, number>
  >(new Map());
  const updateSemaphore = yield* Semaphore.make(1);
  const listeners = new Set<FollowerStateListener>();

  const getState: FollowerShape["getState"] = () =>
    Effect.all({
      enabled: Ref.get(enabledRef),
      running: Ref.get(runningRef),
      config: Ref.get(configRef),
      profile: Ref.get(profileRef),
      phase: Ref.get(phaseRef),
      attemptsRemaining: Ref.get(attemptsRef),
      lastError: Ref.get(lastErrorRef),
      stoppedReason: Ref.get(stoppedReasonRef),
    }).pipe(
      Effect.map(
        ({
          enabled,
          running,
          config,
          profile,
          phase,
          attemptsRemaining,
          lastError,
          stoppedReason,
        }) =>
          toState(
            enabled,
            running,
            config,
            profile,
            phase,
            attemptsRemaining,
            lastError,
            stoppedReason,
          ),
      ),
    );

  const emitState = (state: FollowerState) =>
    Effect.forEach(
      Array.from(listeners),
      (listener, listenerIndex) =>
        Effect.sync(() => listener(state)).pipe(
          Effect.catchCause((cause) =>
            Effect.logError({
              message: "follower listener failed",
              listenerIndex,
              cause,
            }),
          ),
        ),
      { discard: true },
    );

  const emitCurrentState = getState().pipe(Effect.flatMap(emitState));

  const setPhase = (phase: FollowerPhase) =>
    Ref.set(phaseRef, phase).pipe(Effect.andThen(emitCurrentState));

  const setLastError = (message: string | undefined) =>
    Ref.set(lastErrorRef, message).pipe(Effect.andThen(emitCurrentState));

  const requestTargetLocationWake = (username: string) =>
    Effect.gen(function* () {
      const enabled = yield* Ref.get(enabledRef);
      const config = yield* Ref.get(configRef);
      if (
        !enabled ||
        config === undefined ||
        !isSameName(username, config.targetName)
      ) {
        return;
      }

      yield* Ref.set(targetLocationWakeRequestedRef, true);
      const wake = yield* Ref.get(targetLocationWakeRef);
      if (wake !== undefined) {
        yield* Deferred.succeed(wake, undefined).pipe(Effect.asVoid);
      }
    });

  const waitForNextCycle = Effect.gen(function* () {
    const wakeRequested = yield* Ref.getAndSet(
      targetLocationWakeRequestedRef,
      false,
    );
    if (wakeRequested) {
      return;
    }

    const wake = yield* Deferred.make<void>();
    yield* Ref.set(targetLocationWakeRef, wake);
    yield* Effect.raceFirst(
      Effect.sleep(`${LOOP_INTERVAL_MS} millis`),
      Deferred.await(wake),
    ).pipe(
      Effect.ensuring(
        Ref.update(targetLocationWakeRef, (current) =>
          current === wake ? undefined : current,
        ),
      ),
    );
  });

  const stopFromLoop = (reason: string, error?: string) =>
    Effect.gen(function* () {
      yield* Ref.set(enabledRef, false);
      yield* Ref.set(phaseRef, "stopped");
      yield* Ref.set(stoppedReasonRef, reason);
      yield* Ref.set(lastErrorRef, error);
      yield* emitCurrentState;
    });

  const getSelf = () =>
    world.players
      .getSelf()
      .pipe(
        Effect.map((self) => (Option.isSome(self) ? self.value : undefined)),
      );

  const getTarget = (targetName: string) =>
    world.players
      .getByName(targetName)
      .pipe(
        Effect.map((target) =>
          Option.isSome(target) ? target.value : undefined,
        ),
      );

  const isSelfTarget = (self: Avatar | undefined, config: FollowerConfig) =>
    self !== undefined && isSameName(self.username, config.targetName);

  const isAtTarget = (config: FollowerConfig) =>
    Effect.gen(function* () {
      const self = yield* getSelf();
      if (isSelfTarget(self, config)) {
        return true;
      }

      const target = yield* getTarget(config.targetName);
      return (
        self !== undefined && target !== undefined && sameCellPad(self, target)
      );
    });

  const isLockedZoneWarning = (message: string): boolean => {
    const normalized = message.toLowerCase();
    return (
      normalized.includes("locked zone") &&
      (normalized.includes("cannot goto") ||
        normalized.includes("can't goto") ||
        normalized.includes("can not goto"))
    );
  };

  const isGotoIgnoredMessage = (
    message: string,
    config: FollowerConfig,
  ): boolean => {
    const normalized = message.trim().toLowerCase();
    const suffix = " is ignoring goto requests.";
    if (!normalized.endsWith(suffix)) {
      return false;
    }

    const targetName = normalized.slice(0, -suffix.length);
    return isSameName(targetName, config.targetName);
  };

  const isRoomFullWarning = (message: string): boolean =>
    message.trim().toLowerCase() ===
    "room join failed, destination room is full.";

  const getStrMessage = (data: unknown): string =>
    Array.isArray(data) && typeof data[2] === "string" ? data[2] : "";

  const isKnownGotoDeniedTarget = (config: FollowerConfig) =>
    Ref.get(gotoDeniedTargetNameRef).pipe(
      Effect.map(
        (targetName) =>
          targetName !== undefined && isSameName(targetName, config.targetName),
      ),
    );

  const tryLockedZoneFallbacks = (config: FollowerConfig) =>
    Effect.gen(function* () {
      if (!config.retryEnabled || config.lockedZoneFallbacks.length === 0) {
        return { ok: false } satisfies FallbackResult;
      }

      const moveToVisibleTarget = Effect.gen(function* () {
        const target = yield* getTarget(config.targetName);
        const self = yield* getSelf();
        if (target === undefined || self === undefined) {
          return false;
        }

        if (!sameCellPad(self, target)) {
          yield* player.jumpToCell(target.cell, target.pad);
        }

        return yield* waitFor(isAtTarget(config), {
          timeout: SAME_LOCATION_TIMEOUT,
        });
      });

      for (const fallback of config.lockedZoneFallbacks) {
        const roomFull = yield* Deferred.make<void>();
        const disposeWarningListener = yield* packet.str(
          "warning",
          (response) =>
            Effect.gen(function* () {
              const message = getStrMessage(response.data);
              if (isRoomFullWarning(message)) {
                yield* Deferred.succeed(roomFull, undefined).pipe(
                  Effect.asVoid,
                );
              }
            }),
        );

        yield* setPhase("following");
        const joined = yield* Effect.raceFirst(
          player
            .joinMap(
              resolveFallbackMap(fallback.map, config.lockedZoneRoomOverride),
              fallback.cell,
              fallback.pad,
            )
            .pipe(
              Effect.as(true),
              Effect.catch(() => Effect.succeed(false)),
            ),
          Deferred.await(roomFull).pipe(Effect.as(false)),
        ).pipe(Effect.ensuring(Effect.sync(disposeWarningListener)));

        if (!joined) {
          continue;
        }

        const sawRoomFull = yield* Deferred.await(roomFull).pipe(
          Effect.timeoutOption("100 millis"),
          Effect.map(Option.isSome),
        );
        if (sawRoomFull) {
          continue;
        }

        const reachedTarget = yield* moveToVisibleTarget;
        if (reachedTarget) {
          return { ok: true } satisfies FallbackResult;
        }
      }

      return {
        ok: false,
        reason: "Room join failed",
        error: "Destination room is full or unreachable",
      } satisfies FallbackResult;
    });

  const goToTargetPlayer = (config: FollowerConfig) =>
    Effect.gen(function* () {
      if (yield* isKnownGotoDeniedTarget(config)) {
        return (yield* tryLockedZoneFallbacks(config)).ok;
      }

      const gotoDenied = yield* Deferred.make<boolean>();
      const disposeWarningListener = yield* packet.str("warning", (response) =>
        Effect.gen(function* () {
          const message = getStrMessage(response.data);
          if (isLockedZoneWarning(message)) {
            yield* Deferred.succeed(gotoDenied, true).pipe(Effect.asVoid);
          }
        }),
      );
      const disposeServerListener = yield* packet.str("server", (response) =>
        Effect.gen(function* () {
          const message = getStrMessage(response.data);
          if (isGotoIgnoredMessage(message, config)) {
            yield* Deferred.succeed(gotoDenied, true).pipe(Effect.asVoid);
          }
        }),
      );

      const denied = yield* Effect.gen(function* () {
        yield* player.goToPlayer(config.targetName);
        const reachedTarget = yield* Effect.raceFirst(
          waitFor(isAtTarget(config), {
            timeout: GOTO_PLAYER_TIMEOUT,
          }),
          Deferred.await(gotoDenied).pipe(Effect.as(false)),
        );
        if (reachedTarget) {
          return false;
        }

        return yield* Deferred.await(gotoDenied).pipe(
          Effect.timeoutOption("100 millis"),
          Effect.map(Option.isSome),
        );
      }).pipe(
        Effect.ensuring(
          Effect.sync(() => {
            disposeWarningListener();
            disposeServerListener();
          }),
        ),
      );

      if (yield* isAtTarget(config)) {
        return true;
      }

      if (denied) {
        yield* Ref.set(gotoDeniedTargetNameRef, config.targetName);
        return (yield* tryLockedZoneFallbacks(config)).ok;
      }

      return false;
    });

  const copyWalkToTargetMove = (target: Avatar) =>
    Effect.gen(function* () {
      const targetPosition = target.position;
      if (!hasRealPosition(targetPosition)) {
        return;
      }

      const previousPosition = yield* Ref.get(lastCopyWalkTargetPositionRef);
      yield* Ref.set(lastCopyWalkTargetPositionRef, targetPosition);
      if (
        previousPosition === undefined ||
        samePosition(previousPosition, targetPosition)
      ) {
        return;
      }

      yield* setPhase("walking");
      yield* player.walkTo(targetPosition[0], targetPosition[1]);
    }).pipe(Effect.catch(() => Effect.void));

  const followTarget = (config: FollowerConfig): Effect.Effect<FollowResult> =>
    Effect.gen(function* () {
      const ready = yield* player
        .isReady()
        .pipe(Effect.catch(() => Effect.succeed(false)));
      if (!ready) {
        return { ok: true } as const;
      }

      let self = yield* getSelf();
      if (self === undefined) {
        return { ok: true } as const;
      }

      if (isSelfTarget(self, config)) {
        return { ok: true } as const;
      }

      let target = yield* getTarget(config.targetName);
      if (target === undefined) {
        yield* setPhase("following");
        yield* combat.exit().pipe(Effect.catch(() => Effect.void));
        const foundTarget = yield* goToTargetPlayer(config);

        if (!foundTarget) {
          const fallbackResult = yield* tryLockedZoneFallbacks(config);
          if (fallbackResult.ok) {
            target = yield* getTarget(config.targetName);
            self = yield* getSelf();
          } else if (fallbackResult.error !== undefined) {
            return {
              ok: false,
              retry: true,
              reason: fallbackResult.reason ?? "Target not found",
              error: fallbackResult.error,
            } satisfies FollowFailure;
          }
        }

        if (target === undefined && !foundTarget) {
          return {
            ok: false,
            retry: true,
            reason: "Target not found",
            error:
              config.lockedZoneFallbacks.length > 0
                ? `Could not find ${config.targetName} in configured locked-zone locations`
                : `Could not find ${config.targetName}`,
          } satisfies FollowFailure;
        }
      }

      if (target === undefined || self === undefined) {
        return {
          ok: false,
          retry: true,
          reason: "Target not found",
          error: `Could not find ${config.targetName}`,
        } satisfies FollowFailure;
      }

      yield* Ref.set(gotoDeniedTargetNameRef, undefined);

      if (!sameCellPad(self, target)) {
        yield* setPhase("following");
        yield* player.jumpToCell(target.cell, target.pad);
        const reachedTarget = yield* waitFor(isAtTarget(config), {
          timeout: SAME_LOCATION_TIMEOUT,
        });

        if (!reachedTarget) {
          return {
            ok: false,
            retry: true,
            reason: "Failed to follow target",
            error: `Could not reach ${config.targetName}`,
          } satisfies FollowFailure;
        }
      }

      if (config.copyWalk) {
        const nextTarget = yield* getTarget(config.targetName);
        if (nextTarget !== undefined) {
          yield* copyWalkToTargetMove(nextTarget);
        }
      }

      return { ok: true } as const;
    }).pipe(
      Effect.catch((cause) =>
        Effect.succeed({
          ok: false,
          retry: true,
          reason: "Failed to follow target",
          error: errorMessage(cause, "Failed to follow target"),
        } satisfies FollowFailure),
      ),
    );

  const decrementAttempts = (config: FollowerConfig, failure: FollowFailure) =>
    Effect.gen(function* () {
      if (!failure.retry || !config.retryEnabled) {
        yield* stopFromLoop(failure.reason, failure.error);
        return false;
      }

      const attemptsRemaining = yield* Ref.updateAndGet(attemptsRef, (value) =>
        Math.max(0, value - 1),
      );

      if (attemptsRemaining <= 0) {
        yield* stopFromLoop(failure.reason, failure.error);
        return false;
      }

      yield* Ref.set(lastErrorRef, failure.error);
      yield* emitCurrentState;
      const attemptIndex = Math.max(1, config.maxAttempts - attemptsRemaining);
      yield* Effect.sleep(`${retryBackoffDelay(attemptIndex)} millis`);
      return true;
    });

  const clearFailureState = Effect.gen(function* () {
    const config = yield* Ref.get(configRef);
    yield* Ref.set(
      attemptsRef,
      config?.retryEnabled === false
        ? 0
        : (config?.maxAttempts ?? DEFAULT_FOLLOWER_ATTEMPTS),
    );
    yield* Ref.set(lastErrorRef, undefined);
    yield* Ref.set(stoppedReasonRef, undefined);
  });

  const resolvePriorityMonster = (
    target: number | string,
    cell: string,
  ): Effect.Effect<Monster | undefined> =>
    Effect.gen(function* () {
      if (typeof target === "number") {
        const monster = yield* world.monsters.get(target);
        if (
          Option.isSome(monster) &&
          isMonsterInCell(monster.value, cell) &&
          isAttackableMonster(monster.value)
        ) {
          return monster.value;
        }

        return undefined;
      }

      const monster = yield* world.monsters.findByName(target, cell);
      if (Option.isSome(monster) && isAttackableMonster(monster.value)) {
        return monster.value;
      }

      return undefined;
    });

  const selectCombatTarget = (config: FollowerConfig) =>
    Effect.gen(function* () {
      const self = yield* getSelf();
      if (self === undefined) {
        return undefined;
      }

      for (const target of config.attackPriority) {
        const monster = yield* resolvePriorityMonster(target, self.cell);
        if (monster !== undefined) {
          return monster;
        }
      }

      const currentTarget = yield* combat.getTarget();
      if (
        currentTarget?.isMonster() &&
        isMonsterInCell(currentTarget, self.cell) &&
        isAttackableMonster(currentTarget)
      ) {
        return currentTarget;
      }

      const monsters = yield* world.map.getCellMonsters();
      return monsters.find((monster) => isAttackableMonster(monster));
    });

  const runCombat = (
    profile: CombatProfile,
    config: FollowerConfig,
    cursor: CombatProfileCursor,
  ) =>
    Effect.gen(function* () {
      const target = yield* selectCombatTarget(config);
      if (target === undefined) {
        return;
      }

      yield* setPhase("combat");
      const attacked = yield* combat.attackMonster(target.monMapId).pipe(
        Effect.catch((cause) =>
          setLastError(errorMessage(cause, "Failed to attack")).pipe(
            Effect.as(false),
          ),
        ),
      );
      if (!attacked) {
        return;
      }

      yield* castNextCombatProfileStep(profile, cursor);
      yield* setLastError(undefined);
    }).pipe(
      Effect.catch((cause) =>
        stopFromLoop(
          "Combat profile failed",
          errorMessage(cause, "Combat profile failed"),
        ),
      ),
    );

  const runCycle = (
    profile: CombatProfile,
    config: FollowerConfig,
    cursor: CombatProfileCursor,
  ) =>
    Effect.gen(function* () {
      const followed = yield* followTarget(config);
      if (!followed.ok) {
        yield* decrementAttempts(config, followed);
        return;
      }

      yield* clearFailureState;
      if (config.combatEnabled) {
        yield* runCombat(profile, config, cursor);
      }
    });

  const runAnimationTrigger = (
    trigger: CombatProfileAnimationTrigger,
    now: number,
  ) =>
    Effect.gen(function* () {
      const cooldownMs = trigger.cooldownMs ?? 0;
      const castKey = `${trigger.id}:${trigger.skill}`;
      const lastCast = (yield* Ref.get(animationTriggerLastCastRef)).get(
        castKey,
      );
      if (lastCast !== undefined && now - lastCast < cooldownMs) {
        return;
      }

      yield* Ref.update(animationTriggerLastCastRef, (previous) => {
        const next = new Map(previous);
        next.set(castKey, now);
        return next;
      });

      yield* combat.useSkill(trigger.skill, true, true).pipe(
        Effect.catch((cause) =>
          setLastError(errorMessage(cause, "Animation trigger failed")),
        ),
      );
    });

  const handleAnimationMessage = (message: string) =>
    Effect.gen(function* () {
      const enabled = yield* Ref.get(enabledRef);
      const running = yield* Ref.get(runningRef);
      const config = yield* Ref.get(configRef);
      const profile = yield* Ref.get(profileRef);
      if (
        !enabled ||
        !running ||
        config?.combatEnabled !== true ||
        profile === undefined
      ) {
        return;
      }

      const triggers = profile.animationTriggers ?? [];
      if (triggers.length === 0) {
        return;
      }

      const now = Date.now();
      for (const trigger of triggers) {
        if (
          matchesCombatProfileAnimationTriggerMessage(
            trigger.messageIncludes,
            message,
          )
        ) {
          yield* runAnimationTrigger(trigger, now);
        }
      }
    });

  const loop = (
    token: number,
    profile: CombatProfile,
    config: FollowerConfig,
  ) =>
    Effect.gen(function* () {
      const cursor = yield* makeCombatProfileCursor();

      while (yield* Ref.get(enabledRef)) {
        yield* runCycle(profile, config, cursor);
        yield* waitForNextCycle;
      }
    }).pipe(
      Effect.ensuring(
        Effect.gen(function* () {
          const currentToken = yield* Ref.get(runTokenRef);
          if (currentToken !== token) {
            return;
          }

          yield* Ref.set(runningRef, false);
          yield* Ref.set(enabledRef, false);
          yield* Ref.set(phaseRef, "stopped");
          yield* combat
            .cancelAutoAttack()
            .pipe(Effect.catch(() => Effect.void));
          yield* combat.cancelTarget().pipe(Effect.catch(() => Effect.void));
          yield* emitCurrentState;
        }),
      ),
    );

  const start: FollowerShape["start"] = (options: FollowerStartOptions) =>
    updateSemaphore.withPermits(1)(
      Effect.gen(function* () {
        const config = normalizeFollowerConfig(options.config);
        if (config.targetName === "") {
          yield* Ref.set(enabledRef, false);
          yield* Ref.set(runningRef, false);
          yield* Ref.set(configRef, config);
          yield* Ref.set(phaseRef, "stopped");
          yield* Ref.set(stoppedReasonRef, "Target not found");
          yield* Ref.set(lastErrorRef, "Target name is required");
          const state = yield* getState();
          yield* emitState(state);
          return state;
        }

        const profile = findCombatProfileByRef(options.library, {
          mode: "selected",
          profileId: config.selectedProfileId,
        });
        const token = yield* Ref.updateAndGet(
          runTokenRef,
          (value) => Math.max(0, value) + 1,
        );

        yield* Ref.set(configRef, config);
        yield* Ref.set(profileRef, profile);
        yield* Ref.set(enabledRef, true);
        yield* Ref.set(runningRef, true);
        yield* Ref.set(phaseRef, "starting");
        yield* Ref.set(
          attemptsRef,
          config.retryEnabled ? config.maxAttempts : 0,
        );
        yield* Ref.set(lastErrorRef, undefined);
        yield* Ref.set(stoppedReasonRef, undefined);
        yield* Ref.set(gotoDeniedTargetNameRef, undefined);
        yield* Ref.set(lastCopyWalkTargetPositionRef, undefined);
        yield* Ref.set(animationTriggerLastCastRef, new Map());

        yield* jobs.start(
          FOLLOWER_JOB_KEY,
          loop(token, profile, config).pipe(
            Effect.provideService(Combat, combat),
            Effect.provideService(Packet, packet),
            Effect.provideService(Player, player),
            Effect.provideService(World, world),
          ),
          {
            replace: true,
          },
        );

        const state = yield* getState();
        yield* emitState(state);
        return state;
      }),
    );

  const stop: FollowerShape["stop"] = (reason = "Stopped by user") =>
    updateSemaphore.withPermits(1)(
      Effect.gen(function* () {
        yield* Ref.update(runTokenRef, (value) => Math.max(0, value) + 1);
        yield* Ref.set(enabledRef, false);
        yield* jobs.stop(FOLLOWER_JOB_KEY);
        yield* Ref.set(runningRef, false);
        yield* Ref.set(phaseRef, "stopped");
        yield* Ref.set(stoppedReasonRef, reason);
        yield* Ref.set(lastErrorRef, undefined);
        yield* Ref.set(attemptsRef, DEFAULT_FOLLOWER_ATTEMPTS);
        yield* Ref.set(gotoDeniedTargetNameRef, undefined);
        yield* Ref.set(lastCopyWalkTargetPositionRef, undefined);
        yield* Ref.set(animationTriggerLastCastRef, new Map());
        yield* combat.cancelAutoAttack().pipe(Effect.catch(() => Effect.void));
        yield* combat.cancelTarget().pipe(Effect.catch(() => Effect.void));

        const state = yield* getState();
        yield* emitState(state);
        return state;
      }),
    );

  const toggle: FollowerShape["toggle"] = (library) =>
    Effect.gen(function* () {
      const enabled = yield* Ref.get(enabledRef);
      const running = yield* Ref.get(runningRef);
      if (enabled || running) {
        return yield* stop();
      }

      const config = yield* Ref.get(configRef);
      if (config === undefined || config.targetName === "") {
        yield* Ref.set(enabledRef, false);
        yield* Ref.set(runningRef, false);
        yield* Ref.set(phaseRef, "stopped");
        yield* Ref.set(stoppedReasonRef, "Target not found");
        yield* Ref.set(
          lastErrorRef,
          "Configure follower before using the hotkey",
        );
        const state = yield* getState();
        yield* emitState(state);
        return state;
      }

      return yield* start({
        config,
        library,
      });
    });

  const onState: FollowerShape["onState"] = (listener, options) =>
    Effect.gen(function* () {
      yield* Effect.sync(() => {
        listeners.add(listener);
      });

      if (options?.emitCurrent ?? true) {
        yield* getState().pipe(
          Effect.flatMap((state) => Effect.sync(() => listener(state))),
          Effect.catchCause((cause) =>
            Effect.sync(() => listeners.delete(listener)).pipe(
              Effect.andThen(Effect.failCause(cause)),
            ),
          ),
        );
      }

      return () => {
        listeners.delete(listener);
      };
    });

  const disposeTargetLocationWake = Option.isSome(maybePacketDomain)
    ? yield* maybePacketDomain.value.on("playerLocation", (event) =>
        requestTargetLocationWake(event.username),
      )
    : undefined;
  const disposeAnimationMessage = Option.isSome(maybePacketDomain)
    ? yield* maybePacketDomain.value.on("animationMessage", (event) =>
        handleAnimationMessage(event.message),
      )
    : undefined;

  yield* Effect.addFinalizer(() =>
    Effect.sync(() => {
      disposeTargetLocationWake?.();
      disposeAnimationMessage?.();
    }),
  );
  yield* Effect.addFinalizer(() => stop().pipe(Effect.asVoid));

  return {
    getState,
    onState,
    start,
    toggle,
    stop,
  } satisfies FollowerShape;
});

export const FollowerLive = Layer.effect(Follower, make);

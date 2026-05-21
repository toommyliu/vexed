import { Effect, Layer, Ref, Semaphore } from "effect";
import {
  findCombatProfileByRef,
  type CombatProfile,
} from "../../../../../shared/combat-profiles";
import {
  castNextCombatProfileStep,
  isAttackableMonster,
  makeCombatProfileCursor,
} from "../../combatProfiles";
import { Combat } from "../../flash/Services/Combat";
import { Player } from "../../flash/Services/Player";
import { World } from "../../flash/Services/World";
import { Jobs } from "../../jobs/Services/Jobs";
import {
  AutoAttack,
  type AutoAttackShape,
  type AutoAttackStartOptions,
  type AutoAttackState,
  type AutoAttackStateListener,
} from "../Services/AutoAttack";

const AUTO_ATTACK_JOB_KEY = "features:auto-attack";
const IDLE_DELAY_MS = 250;
const MIN_LOOP_DELAY_MS = 50;

const toState = (
  enabled: boolean,
  running: boolean,
  profile: CombatProfile | undefined,
  lastError?: string,
): AutoAttackState => ({
  enabled,
  running,
  ...(profile === undefined
    ? {}
    : {
        profileId: profile.id,
        profileLabel: profile.label,
      }),
  ...(lastError === undefined || lastError === "" ? {} : { lastError }),
});

const make = Effect.gen(function* () {
  const combat = yield* Combat;
  const jobs = yield* Jobs;
  const player = yield* Player;
  const world = yield* World;
  const enabledRef = yield* Ref.make(false);
  const profileRef = yield* Ref.make<CombatProfile | undefined>(undefined);
  const lastErrorRef = yield* Ref.make<string | undefined>(undefined);
  const updateSemaphore = yield* Semaphore.make(1);
  const listeners = new Set<AutoAttackStateListener>();

  const getState: AutoAttackShape["getState"] = () =>
    Effect.all({
      enabled: Ref.get(enabledRef),
      running: jobs.isRunning(AUTO_ATTACK_JOB_KEY),
      profile: Ref.get(profileRef),
      lastError: Ref.get(lastErrorRef),
    }).pipe(
      Effect.map(({ enabled, running, profile, lastError }) =>
        toState(enabled, running, profile, lastError),
      ),
    );

  const emitState = (state: AutoAttackState) =>
    Effect.gen(function* () {
      if (listeners.size === 0) {
        return;
      }

      yield* Effect.forEach(
        Array.from(listeners),
        (listener, listenerIndex) =>
          Effect.sync(() => listener(state)).pipe(
            Effect.catchCause((cause) =>
              Effect.logError({
                message: "auto attack listener failed",
                listenerIndex,
                cause,
              }),
            ),
          ),
        { discard: true },
      );
    });

  const emitCurrentState = Effect.flatMap(getState(), emitState);

  const setLastError = (message: string | undefined) =>
    Effect.gen(function* () {
      yield* Ref.set(lastErrorRef, message);
      yield* emitCurrentState;
    });

  const clearLastError = Effect.gen(function* () {
    const lastError = yield* Ref.get(lastErrorRef);
    if (lastError !== undefined) {
      yield* setLastError(undefined);
    }
  });

  const selectTarget = Effect.gen(function* () {
    const currentTarget = yield* combat.getTarget();
    if (
      currentTarget?.isMonster() &&
      isAttackableMonster(currentTarget)
    ) {
      return currentTarget.monMapId;
    }

    const monsters = yield* world.map.getCellMonsters();
    const next = monsters.find(isAttackableMonster);
    return next?.monMapId;
  });

  const loop = (profile: CombatProfile) =>
    Effect.gen(function* () {
      const cursor = yield* makeCombatProfileCursor();

      while (yield* Ref.get(enabledRef)) {
        const alive = yield* player
          .isAlive()
          .pipe(Effect.catch(() => Effect.succeed(false)));

        if (!alive) {
          yield* Effect.sleep(`${IDLE_DELAY_MS} millis`);
          continue;
        }

        const monMapId = yield* selectTarget.pipe(
          Effect.catch(() => Effect.sync((): number | undefined => undefined)),
        );

        if (monMapId === undefined) {
          yield* Effect.sleep(`${IDLE_DELAY_MS} millis`);
          continue;
        }

        const attackFailed = yield* combat.attackMonster(monMapId).pipe(
          Effect.as(false),
          Effect.catch((error) =>
            setLastError(
              error instanceof Error ? error.message : "Failed to attack",
            ).pipe(Effect.as(true)),
          ),
        );

        const { cast, castFailed } = yield* castNextCombatProfileStep(
          profile,
          cursor,
        ).pipe(
          Effect.map((cast) => ({ cast, castFailed: false })),
          Effect.catch((error) =>
            setLastError(
              error instanceof Error ? error.message : "Failed to use profile",
            ).pipe(Effect.as({ cast: false, castFailed: true })),
          ),
        );

        if (!attackFailed && !castFailed) {
          yield* clearLastError;
        }

        const delayMs = Math.max(
          MIN_LOOP_DELAY_MS,
          cast ? profile.delayMs : IDLE_DELAY_MS,
        );
        yield* Effect.sleep(`${delayMs} millis`);
      }
    }).pipe(
      Effect.ensuring(
        combat.cancelAutoAttack().pipe(
          Effect.andThen(combat.cancelTarget()),
          Effect.catch(() => Effect.void),
        ),
      ),
    );

  const resolveProfile = (options: AutoAttackStartOptions) =>
    Effect.gen(function* () {
      const className = yield* player
        .getClassName()
        .pipe(
          Effect.catch(() => Effect.sync((): string | undefined => undefined)),
        );

      return findCombatProfileByRef(
        options.library,
        options.profileRef,
        className,
      );
    });

  const enable: AutoAttackShape["enable"] = (options) =>
    updateSemaphore.withPermits(1)(
      Effect.gen(function* () {
        const profile = yield* resolveProfile(options);
        yield* Ref.set(enabledRef, true);
        yield* Ref.set(profileRef, profile);
        yield* Ref.set(lastErrorRef, undefined);

        yield* jobs.start(
          AUTO_ATTACK_JOB_KEY,
          loop(profile).pipe(
            Effect.provideService(Combat, combat),
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

  const disable: AutoAttackShape["disable"] = () =>
    updateSemaphore.withPermits(1)(
      Effect.gen(function* () {
        yield* Ref.set(enabledRef, false);
        yield* jobs.stop(AUTO_ATTACK_JOB_KEY);
        yield* combat.cancelAutoAttack().pipe(Effect.catch(() => Effect.void));
        yield* combat.cancelTarget().pipe(Effect.catch(() => Effect.void));

        const state = yield* getState();
        yield* emitState(state);
        return state;
      }),
    );

  const onState: AutoAttackShape["onState"] = (listener, options) =>
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

  yield* Effect.addFinalizer(() => disable().pipe(Effect.asVoid));

  return {
    getState,
    onState,
    enable,
    disable,
  } satisfies AutoAttackShape;
});

export const AutoAttackLive = Layer.effect(AutoAttack, make);

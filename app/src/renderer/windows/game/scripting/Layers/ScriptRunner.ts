import { parseMonsterMapIdToken } from "@vexed/game";
import { equalsIgnoreCase } from "@vexed/shared/string";
import { Cause, Effect, Fiber, Layer, Option, Ref, Semaphore } from "effect";
import { type ScriptExecutePayload, type ScriptOptions } from "../ipc";
import { Army, type ArmyShape } from "../../army/Services/Army";
import type { ArmyLoopTauntHandle } from "../../army/LoopTaunt";
import { Auth } from "../../flash/Services/Auth";
import { AutoRelogin } from "../../features/Services/AutoRelogin";
import { AutoZone } from "../../features/Services/AutoZone";
import { Bank } from "../../flash/Services/Bank";
import { Bridge, BridgeFailurePolicy } from "../../flash/Services/Bridge";
import { Combat } from "../../flash/Services/Combat";
import { Drops } from "../../flash/Services/Drops";
import { Environment } from "../../environment/Services/Environment";
import { House } from "../../flash/Services/House";
import { Inventory } from "../../flash/Services/Inventory";
import { Outfits } from "../../flash/Services/Outfits";
import { Packet } from "../../flash/Services/Packet";
import {
  PacketDomain,
  type PacketDomainAntiCounterEvent,
  type PacketDomainEvent,
} from "../../flash/Services/PacketDomain";
import { Player, type PlayerShape } from "../../flash/Services/Player";
import { Quests } from "../../flash/Services/Quests";
import { Settings } from "../../flash/Services/Settings";
import type { BridgeEffect, BridgeError } from "../../flash/Services/Bridge";
import { Shops } from "../../flash/Services/Shops";
import { TempInventory } from "../../flash/Services/TempInventory";
import { Wait } from "../../flash/Services/Wait";
import { World } from "../../flash/Services/World";
import {
  ScriptExecutionError,
  ScriptLoadError,
  ScriptNotReadyError,
} from "../Errors";
import { ScriptRunner } from "../Services/ScriptRunner";
import type { ScriptRunnerShape } from "../Services/ScriptRunner";
import type { ScriptDiagnostic, ScriptDiagnosticInput } from "../Types";
import type {
  ScriptApi,
  ScriptAutoReloginShape,
  ScriptAutoZoneShape,
  ScriptContext,
  ScriptExitOptions,
  ScriptAntiCounterEvent,
  ScriptAntiCounterListener,
  ScriptAntiCounterShape,
  ScriptFeaturesApi,
  ScriptMain,
  ScriptPacketListener,
  ScriptRuntimeApi,
  ScriptSettingsShape,
  ScriptWaitOptions,
  ScriptWaitPredicate,
  ScriptWaitShape,
  ScriptWorldShape,
} from "../ScriptApi";
import {
  type ScriptAsyncScope,
  makeScriptAsyncScope,
} from "../scriptAsyncScope";
import { makeScriptRecipes } from "../recipes";
import { loadScriptModule } from "../scriptLoader";
import type { ScriptRuntimeStdBinding } from "../ScriptRuntimeStd";
import { toDiagnosticDetails, toErrorMessage } from "../errorDetails";
import {
  parseMapTarget,
  randomPrivateRoomNumber,
  withPrivateRoom,
} from "../../flash/MapTarget";

type ActiveScript = {
  readonly token: number;
  readonly fiber: Fiber.Fiber<void, unknown>;
  readonly scope: ScriptAsyncScope;
};

type LaunchFiber = Fiber.Fiber<unknown, unknown>;

const MAX_SCRIPT_DIAGNOSTICS = 50;
const BRIDGE_FAILURE_DIAGNOSTIC_WINDOW_MS = 5_000;

const DEFAULT_SCRIPT_OPTIONS: ScriptOptions = {
  usePrivateRooms: false,
};

const normalizeScriptOptionsPatch = (
  patch: Partial<ScriptOptions> | undefined,
): Partial<ScriptOptions> => {
  if (patch?.usePrivateRooms === undefined) {
    return {};
  }

  return {
    usePrivateRooms: patch.usePrivateRooms === true,
  };
};

const applyScriptOptionsPatch = (
  current: ScriptOptions,
  patch: Partial<ScriptOptions> | undefined,
): ScriptOptions => ({
  ...current,
  ...normalizeScriptOptionsPatch(patch),
});

const toScriptAntiCounterEvent = (
  event: PacketDomainAntiCounterEvent,
): ScriptAntiCounterEvent => ({
  monMapId: event.monMapId,
  source: event.source,
  triggerId: event.triggerId,
  triggerText: event.triggerText,
  ...(event.durationMs === undefined ? {} : { durationMs: event.durationMs }),
});

const isGenerator = (
  value: unknown,
): value is Generator<
  Effect.Yieldable<any, any, never, never>,
  unknown,
  never
> =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as { readonly next?: unknown }).next === "function" &&
  typeof (value as { readonly throw?: unknown }).throw === "function";

const scriptNameFromPayload = (payload: ScriptExecutePayload): string => {
  if (payload.name && payload.name.trim() !== "") {
    return payload.name;
  }

  if (payload.path && payload.path.trim() !== "") {
    return payload.path;
  }

  return "inline-script";
};

const causeMessage = (cause: Cause.Cause<unknown>): string =>
  toErrorMessage(Cause.squash(cause));

const make = Effect.gen(function* () {
  const auth = yield* Auth;
  const autoRelogin = yield* AutoRelogin;
  const autoZone = yield* AutoZone;
  const army = yield* Army;
  const bank = yield* Bank;
  const bridge = yield* Bridge;
  const combat = yield* Combat;
  const drops = yield* Drops;
  const environment = yield* Environment;
  const house = yield* House;
  const inventory = yield* Inventory;
  const outfits = yield* Outfits;
  const packet = yield* Packet;
  const packetDomain = yield* PacketDomain;
  const player = yield* Player;
  const quests = yield* Quests;
  const settings = yield* Settings;
  const shops = yield* Shops;
  const tempInventory = yield* TempInventory;
  const wait = yield* Wait;
  const world = yield* World;

  const services = yield* Effect.services();
  const runFork = Effect.runForkWith(services);
  const runPromise = Effect.runPromiseWith(services);

  const readyRef = yield* Ref.make(false);
  const activeFiberRef = yield* Ref.make<Option.Option<ActiveScript>>(
    Option.none(),
  );
  const pendingLaunchFiberRef = yield* Ref.make<Option.Option<LaunchFiber>>(
    Option.none(),
  );
  const nextScriptTokenRef = yield* Ref.make(0);
  const runSemaphore = yield* Semaphore.make(1);
  const nextDiagnosticIdRef = yield* Ref.make(0);
  const diagnosticsRef = yield* Ref.make<ReadonlyArray<ScriptDiagnostic>>([]);
  const bridgeFailureDiagnosticState = new Map<
    string,
    { lastEmittedAt: number; suppressed: number }
  >();
  const scriptOptionsRef = yield* Ref.make<ScriptOptions>(
    DEFAULT_SCRIPT_OPTIONS,
  );
  let nextPacketCleanupId = 0;

  const appendDiagnostic = (sourceName: string, input: ScriptDiagnosticInput) =>
    Effect.gen(function* () {
      const id = yield* Ref.updateAndGet(
        nextDiagnosticIdRef,
        (value) => value + 1,
      );
      const diagnostic: ScriptDiagnostic = {
        id,
        sourceName,
        severity: input.severity,
        message: input.message,
        ...(input.command !== undefined ? { command: input.command } : null),
        ...(input.instructionIndex !== undefined
          ? { instructionIndex: input.instructionIndex }
          : null),
        ...(input.details !== undefined ? { details: input.details } : null),
        createdAt: Date.now(),
      };

      yield* Ref.update(diagnosticsRef, (current) =>
        [...current, diagnostic].slice(-MAX_SCRIPT_DIAGNOSTICS),
      );
    });

  const appendErrorDiagnostic = (
    sourceName: string,
    message: string,
    cause?: unknown,
  ) =>
    appendDiagnostic(sourceName, {
      severity: "error",
      message,
      ...(cause === undefined ? null : { details: toDiagnosticDetails(cause) }),
    });

  const appendBridgeFailureDiagnostic = (
    sourceName: string,
    error: BridgeError,
  ) =>
    Effect.gen(function* () {
      const now = Date.now();
      const key = `${sourceName}:${error._tag}:${error.method}`;
      const current = bridgeFailureDiagnosticState.get(key);
      if (
        current &&
        now - current.lastEmittedAt < BRIDGE_FAILURE_DIAGNOSTIC_WINDOW_MS
      ) {
        current.suppressed += 1;
        return false;
      }

      const suppressed = current?.suppressed ?? 0;
      bridgeFailureDiagnosticState.set(key, {
        lastEmittedAt: now,
        suppressed: 0,
      });

      yield* appendDiagnostic(sourceName, {
        severity: "warning",
        message:
          suppressed > 0
            ? `Flash bridge call failed: ${error.method} (${suppressed} repeated failures suppressed)`
            : `Flash bridge call failed: ${error.method}`,
        details: toDiagnosticDetails(error),
      });
      return true;
    });

  const clearPendingLaunch = (fiber: LaunchFiber) =>
    Ref.update(pendingLaunchFiberRef, (current) =>
      Option.isSome(current) && current.value === fiber
        ? Option.none()
        : current,
    );

  const replacePendingLaunch = (fiber: LaunchFiber) =>
    Effect.gen(function* () {
      const previous = yield* Ref.getAndSet(
        pendingLaunchFiberRef,
        Option.some(fiber),
      );

      if (Option.isSome(previous) && previous.value !== fiber) {
        yield* Fiber.interrupt(previous.value).pipe(
          Effect.catchCause((cause) =>
            Cause.hasInterruptsOnly(cause)
              ? Effect.void
              : Effect.logError({
                  message: "failed to cancel pending script launch",
                  cause,
                }),
          ),
        );
      }
    });

  const clearActiveScript = (token: number) =>
    Ref.modify(activeFiberRef, (current) => {
      if (Option.isSome(current) && current.value.token === token) {
        return [undefined, Option.none<ActiveScript>()] as const;
      }

      return [undefined, current] as const;
    });

  const interruptActiveScript = (reason: string) =>
    Effect.gen(function* () {
      const activeScript = yield* Ref.get(activeFiberRef);
      if (Option.isNone(activeScript)) {
        return;
      }

      yield* activeScript.value.scope.requestInterrupt(reason);
      yield* Fiber.interrupt(activeScript.value.fiber);
      yield* Effect.logInfo(`[scripting] interrupted script (${reason})`);
    });

  const connectionDisposer = yield* bridge.onConnection((status) => {
    runFork(
      Effect.gen(function* () {
        const ready = status === "OnConnection";
        yield* Ref.set(readyRef, ready);

        if (!ready) {
          yield* interruptActiveScript("connection lost");
        }
      }),
    );
  });

  yield* Effect.addFinalizer(() =>
    Effect.sync(() => {
      connectionDisposer();
    }),
  );

  const ensureReady = (sourceName: string) =>
    Effect.gen(function* () {
      const connected = yield* Ref.get(readyRef);
      const loggedIn = yield* auth
        .isLoggedIn()
        .pipe(Effect.catchCause(() => Effect.succeed(false)));

      if (!connected || !loggedIn) {
        return yield* new ScriptNotReadyError({
          sourceName,
          reason: !connected
            ? "player is disconnected"
            : "player is not logged in",
        });
      }
    });

  const executeScript = (
    sourceName: string,
    main: ScriptMain,
    runtime: ScriptRuntimeStdBinding,
    scriptScope: ScriptAsyncScope,
  ) => {
    const tolerantBridgeFailurePolicy = {
      mode: "tolerant" as const,
      onFailure: (error: BridgeError) =>
        appendBridgeFailureDiagnostic(sourceName, error).pipe(
          Effect.flatMap((emitted) =>
            emitted
              ? Effect.logWarning({
                  message: `Flash bridge call failed: ${error.method}`,
                  sourceName,
                  details: toDiagnosticDetails(error),
                })
              : Effect.void,
          ),
        ),
    };

    const wrapScriptEffect = <A, E>(
      effect: Effect.Effect<A, E, never>,
    ): Effect.Effect<A, E | ScriptNotReadyError> =>
      Effect.suspend(() => {
        if (scriptScope.isCancelled()) {
          return Effect.interrupt as Effect.Effect<A, E | ScriptNotReadyError>;
        }

        return ensureReady(sourceName).pipe(
          Effect.andThen(effect),
          Effect.provideService(
            BridgeFailurePolicy,
            tolerantBridgeFailurePolicy,
          ),
        );
      });

    const wrapValue = (
      value: unknown,
      cache = new WeakMap<object, unknown>(),
    ) => {
      if (Effect.isEffect(value)) {
        return wrapScriptEffect(
          value as Effect.Effect<unknown, unknown, never>,
        );
      }

      if (typeof value === "function") {
        return (...args: ReadonlyArray<unknown>) =>
          wrapValue(value(...args), cache);
      }

      if (typeof value !== "object" || value === null) {
        return value;
      }

      const cached = cache.get(value);
      if (cached !== undefined) {
        return cached;
      }

      const proxy = new Proxy(value as Record<PropertyKey, unknown>, {
        get(target, property, receiver) {
          const propertyValue = Reflect.get(target, property, receiver);
          if (typeof propertyValue === "function") {
            return (...args: ReadonlyArray<unknown>) =>
              wrapValue(propertyValue.apply(target, args), cache);
          }

          return wrapValue(propertyValue, cache);
        },
      });
      cache.set(value, proxy);
      return proxy;
    };

    const sleep = (ms: number): Effect.Effect<void, ScriptExecutionError> =>
      Effect.suspend(() => {
        if (!Number.isFinite(ms) || ms < 0) {
          return Effect.fail(
            new ScriptExecutionError({
              sourceName,
              message: "script.sleep(ms) expects a finite non-negative number",
              cause: ms,
            }),
          );
        }

        if (scriptScope.isCancelled()) {
          return Effect.interrupt as Effect.Effect<void, ScriptExecutionError>;
        }

        return Effect.sleep(`${Math.trunc(ms)} millis`);
      });

    let closeWindowOnExit = false;

    const validateExitOptions = (
      options: ScriptExitOptions | undefined,
    ): Effect.Effect<ScriptExitOptions, ScriptExecutionError> =>
      Effect.suspend(() => {
        if (options === undefined) {
          return Effect.succeed({});
        }

        if (
          typeof options !== "object" ||
          options === null ||
          Array.isArray(options)
        ) {
          return Effect.fail(
            new ScriptExecutionError({
              sourceName,
              message: "script.exit(options) expects an options object",
              cause: options,
            }),
          );
        }

        if (
          options.logout !== undefined &&
          typeof options.logout !== "boolean"
        ) {
          return Effect.fail(
            new ScriptExecutionError({
              sourceName,
              message: "script.exit(options.logout) expects a boolean",
              cause: options.logout,
            }),
          );
        }

        if (
          options.closeWindow !== undefined &&
          typeof options.closeWindow !== "boolean"
        ) {
          return Effect.fail(
            new ScriptExecutionError({
              sourceName,
              message: "script.exit(options.closeWindow) expects a boolean",
              cause: options.closeWindow,
            }),
          );
        }

        return Effect.succeed(options);
      });

    const stopScript = (reason?: string): Effect.Effect<never> =>
      Effect.gen(function* () {
        const stopReason = reason?.trim() ? reason : "script request";

        yield* scriptScope.requestInterrupt(stopReason);
        runFork(interruptActiveScript(stopReason));

        return yield* Effect.interrupt;
      });

    const exitScript = (
      options?: ScriptExitOptions,
    ): Effect.Effect<never, ScriptExecutionError | BridgeError> =>
      Effect.gen(function* () {
        const normalizedOptions = yield* validateExitOptions(options);
        const shouldCloseWindow = normalizedOptions.closeWindow === true;
        const shouldLogout = normalizedOptions.logout === true;

        closeWindowOnExit = shouldCloseWindow;

        if (shouldLogout) {
          const loggedIn = yield* auth
            .isLoggedIn()
            .pipe(Effect.catchCause(() => Effect.succeed(false)));

          if (loggedIn) {
            yield* auth.logout().pipe(
              Effect.catchCause((cause) =>
                Cause.hasInterruptsOnly(cause)
                  ? Effect.failCause(cause)
                  : Effect.sync(() => {
                      closeWindowOnExit = false;
                    }).pipe(Effect.andThen(Effect.failCause(cause))),
              ),
            );
          }
        }

        yield* scriptScope.requestInterrupt("script exit");
        runFork(interruptActiveScript("script exit"));

        return yield* Effect.interrupt;
      });

    const handleScriptCallbackCause = (
      listener: string,
      subject: string,
      cause: Cause.Cause<unknown>,
    ) =>
      Cause.hasInterruptsOnly(cause) || scriptScope.isCancelled()
        ? Effect.void
        : appendErrorDiagnostic(
            sourceName,
            `${listener} ${subject} handler failed: ${causeMessage(cause)}`,
            cause,
          ).pipe(
            Effect.andThen(
              Effect.logError({
                message: `script ${subject} handler failed`,
                sourceName,
                listener,
                cause,
              }),
            ),
          );

    const runPacketHandler = (
      listener: string,
      handler: ScriptPacketListener,
      packetValue: string,
    ): Effect.Effect<void> =>
      Effect.suspend(() => {
        if (scriptScope.isCancelled()) {
          return Effect.void;
        }

        const result = Effect.try({
          try: () => handler(packetValue),
          catch: (cause) =>
            new ScriptExecutionError({
              sourceName,
              message: `${listener} packet handler threw before yielding`,
              cause,
            }),
        });

        return result.pipe(
          Effect.flatMap((handlerResult) => {
            if (Effect.isEffect(handlerResult)) {
              return wrapScriptEffect(
                handlerResult as Effect.Effect<unknown, unknown, never>,
              ).pipe(Effect.asVoid);
            }

            if (isGenerator(handlerResult)) {
              return Effect.gen(() => handlerResult).pipe(Effect.asVoid);
            }

            return Effect.void;
          }),
          Effect.catchCause((cause) =>
            handleScriptCallbackCause(listener, "packet", cause),
          ),
        );
      });

    const registerPacketListener = (
      listener: "packetFromClient" | "packetFromServer" | "onExtensionResponse",
      register: (
        handler: (packetValue: string) => Effect.Effect<void>,
      ) => Effect.Effect<() => void>,
    ) =>
      ((handler: ScriptPacketListener) =>
        wrapScriptEffect(
          Effect.uninterruptible(
            Effect.gen(function* () {
              const cleanupKey = `packet:${listener}:${++nextPacketCleanupId}`;
              let disposed = false;
              const dispose = yield* register((packetValue) =>
                runPacketHandler(listener, handler, packetValue),
              );
              const cleanup = Effect.sync(() => {
                if (!disposed) {
                  disposed = true;
                  dispose();
                }
              });

              yield* scriptScope.setCleanup(cleanupKey, cleanup);

              return () => {
                runFork(scriptScope.removeCleanup(cleanupKey));
              };
            }),
          ),
        )) satisfies ScriptApi["packet"][typeof listener];

    const runAntiCounterHandler = (
      listener: string,
      handler: ScriptAntiCounterListener,
      event: PacketDomainAntiCounterEvent,
    ): Effect.Effect<void> =>
      Effect.suspend(() => {
        if (scriptScope.isCancelled()) {
          return Effect.void;
        }

        const scriptEvent = toScriptAntiCounterEvent(event);
        const result = Effect.try({
          try: () => handler(scriptEvent),
          catch: (cause) =>
            new ScriptExecutionError({
              sourceName,
              message: `${listener} antiCounter handler threw before yielding`,
              cause,
            }),
        });

        return result.pipe(
          Effect.flatMap((handlerResult) => {
            if (Effect.isEffect(handlerResult)) {
              return wrapScriptEffect(
                handlerResult as Effect.Effect<unknown, unknown, never>,
              ).pipe(Effect.asVoid);
            }

            if (isGenerator(handlerResult)) {
              return Effect.gen(() => handlerResult).pipe(Effect.asVoid);
            }

            return Effect.void;
          }),
          Effect.catchCause((cause) =>
            handleScriptCallbackCause(listener, "antiCounter", cause),
          ),
        );
      });

    const registerAntiCounterListener = (
      listener: "onStart" | "onEnd",
      eventName: Extract<
        PacketDomainEvent,
        "antiCounterStart" | "antiCounterEnd"
      >,
    ) =>
      ((handler: ScriptAntiCounterListener) =>
        wrapScriptEffect(
          Effect.uninterruptible(
            Effect.gen(function* () {
              const cleanupKey = `antiCounter:${listener}:${++nextPacketCleanupId}`;
              let disposed = false;
              const dispose = yield* packetDomain.on(eventName, (event) =>
                runAntiCounterHandler(listener, handler, event),
              );
              const cleanup = Effect.sync(() => {
                if (!disposed) {
                  disposed = true;
                  dispose();
                }
              });

              yield* scriptScope.setCleanup(cleanupKey, cleanup);

              return () => {
                runFork(scriptScope.removeCleanup(cleanupKey));
              };
            }),
          ),
        )) satisfies ScriptAntiCounterShape[typeof listener];

    const toScriptWaitOptions = (
      options: ScriptWaitOptions | undefined,
    ): ScriptWaitOptions | undefined =>
      options === undefined
        ? undefined
        : {
            ...(options.timeout === undefined
              ? {}
              : { timeout: options.timeout }),
            ...(options.interval === undefined
              ? {}
              : { interval: options.interval }),
          };

    const assertScriptWaitBoolean = (
      value: unknown,
    ): Effect.Effect<boolean, ScriptExecutionError> =>
      typeof value === "boolean"
        ? Effect.succeed(value)
        : Effect.fail(
            new ScriptExecutionError({
              sourceName,
              message: "api.wait.until predicate must return a boolean",
              cause: value,
            }),
          );

    const evaluateScriptWaitPredicate = (
      predicate: ScriptWaitPredicate,
    ): Effect.Effect<boolean, unknown> =>
      Effect.suspend(() => {
        if (typeof predicate !== "function") {
          return Effect.fail(
            new ScriptExecutionError({
              sourceName,
              message: "api.wait.until(predicate) expects a function",
              cause: predicate,
            }),
          );
        }

        const result = Effect.try({
          try: () => predicate(),
          catch: (cause) =>
            new ScriptExecutionError({
              sourceName,
              message: "api.wait.until predicate threw before yielding",
              cause,
            }),
        });

        return result.pipe(
          Effect.flatMap((predicateResult) => {
            if (Effect.isEffect(predicateResult)) {
              return wrapScriptEffect(
                predicateResult as Effect.Effect<boolean, unknown, never>,
              ).pipe(Effect.flatMap(assertScriptWaitBoolean));
            }

            if (isGenerator(predicateResult)) {
              return Effect.gen(() => predicateResult).pipe(
                Effect.flatMap(assertScriptWaitBoolean),
              );
            }

            return assertScriptWaitBoolean(predicateResult);
          }),
        );
      });

    const waitUntilForScript: ScriptWaitShape["until"] = (predicate, options) =>
      wrapScriptEffect(
        wait.until(
          wrapScriptEffect(evaluateScriptWaitPredicate(predicate)),
          toScriptWaitOptions(options),
        ),
      );

    const waitForTargetMap = (map: string | undefined): BridgeEffect<boolean> =>
      Effect.gen(function* () {
        if (!(yield* world.map.isLoaded())) {
          return false;
        }

        if (map === undefined || map.trim() === "") {
          return true;
        }

        const targetMap = yield* parseMapTarget(map);
        const currentMapName = yield* world.map.getName();
        if (!equalsIgnoreCase(currentMapName, targetMap.name)) {
          return false;
        }

        if (targetMap.requireExactRoom && targetMap.roomNumber !== undefined) {
          const currentRoomNumber = yield* world.map.getRoomNumber();
          return currentRoomNumber === targetMap.roomNumber;
        }

        return true;
      });

    const waitForLocation = (location: {
      readonly cell?: string;
      readonly pad?: string;
    }): BridgeEffect<boolean> =>
      Effect.gen(function* () {
        if (location.cell === undefined && location.pad === undefined) {
          return true;
        }

        if (location.cell !== undefined) {
          const cell = yield* player.getCell();
          if (!equalsIgnoreCase(cell, location.cell)) {
            return false;
          }
        }

        if (location.pad !== undefined) {
          const pad = yield* player.getPad();
          if (!equalsIgnoreCase(pad, location.pad)) {
            return false;
          }
        }

        return true;
      });

    const isMonsterAlive = (monster: {
      readonly alive: boolean;
      isDead(): boolean;
    }): boolean => monster.alive && !monster.isDead();

    const monsterMatchesCell = (
      monster: { readonly cell: string },
      cell: string | undefined,
    ): boolean => cell === undefined || equalsIgnoreCase(monster.cell, cell);

    const getMonsterWaitCell = (
      options: { readonly cell?: string; readonly currentCell?: boolean } = {},
    ): BridgeEffect<string | undefined> =>
      options.currentCell === true
        ? player.getCell()
        : Effect.succeed(options.cell);

    const findMonster = (
      monster: MonsterIdentifierToken,
      cell: string | undefined,
    ) =>
      Effect.gen(function* () {
        const monMapId = parseMonsterMapIdToken(monster);
        if (monMapId !== undefined) {
          const byId = yield* world.monsters.get(monMapId);
          return Option.isSome(byId) && monsterMatchesCell(byId.value, cell)
            ? Option.some(byId.value)
            : Option.none();
        }

        return yield* world.monsters.findByName(String(monster), cell);
      });

    const isMonsterSpawned = (
      monster: MonsterIdentifierToken,
      options?: { readonly cell?: string; readonly currentCell?: boolean },
    ) =>
      Effect.gen(function* () {
        const cell = yield* getMonsterWaitCell(options);
        const match = yield* findMonster(monster, cell);
        return Option.isSome(match) && isMonsterAlive(match.value);
      });

    const isMonsterAvailable = (
      monster: MonsterIdentifierToken,
      options?: { readonly cell?: string; readonly currentCell?: boolean },
    ) =>
      Effect.gen(function* () {
        const cell = yield* getMonsterWaitCell(options);
        const match = yield* findMonster(monster, cell);
        if (Option.isNone(match) || !isMonsterAlive(match.value)) {
          return false;
        }

        return yield* bridge.call("world.isMonsterAvailable", [
          match.value.monMapId,
        ]);
      });

    const isMonsterDead = (
      monster: MonsterIdentifierToken,
      options?: { readonly cell?: string; readonly currentCell?: boolean },
    ) =>
      Effect.gen(function* () {
        const cell = yield* getMonsterWaitCell(options);
        const match = yield* findMonster(monster, cell);
        return Option.isNone(match) || !isMonsterAlive(match.value);
      });

    const scriptWait: ScriptWaitShape = {
      until: waitUntilForScript,
      isGameActionAvailable: wait.isGameActionAvailable,
      forGameAction: wait.forGameAction,
      forPlayerReady: (options) =>
        wait.until(player.isReady(), toScriptWaitOptions(options)),
      forPlayerPosition: (x, y, options) =>
        wait.until(
          Effect.map(player.getPosition(), ([currentX, currentY]) => {
            return currentX === x && currentY === y;
          }),
          toScriptWaitOptions(options),
        ),
      forCombatExit: (options) =>
        wait.until(
          world.players
            .withSelf((self) => !self.isInCombat())
            .pipe(Effect.map(Option.getOrElse(() => false))),
          toScriptWaitOptions(options),
        ),
      forFullyRested: (options) =>
        wait.until(
          Effect.gen(function* () {
            const [hp, mp, maxHp, maxMp] = yield* Effect.all([
              player.getHp(),
              player.getMp(),
              player.getMaxHp(),
              player.getMaxMp(),
            ]);

            return hp >= maxHp && mp >= maxMp;
          }),
          toScriptWaitOptions(options),
        ),
      forMapLoaded: (map, options) =>
        wait.until(waitForTargetMap(map), toScriptWaitOptions(options)),
      forLocation: (location, options) =>
        wait.until(waitForLocation(location), toScriptWaitOptions(options)),
      forPlayerCount: (count, options) =>
        wait.until(
          Effect.map(world.players.getAll(), (players) =>
            options?.exact === true
              ? players.size === count
              : players.size >= count,
          ),
          toScriptWaitOptions(options),
        ),
      forMonsterSpawn: (monster, options) =>
        wait.until(
          isMonsterSpawned(monster, options),
          toScriptWaitOptions(options),
        ),
      forMonsterAvailable: (monster, options) =>
        wait.until(
          isMonsterAvailable(monster, options),
          toScriptWaitOptions(options),
        ),
      forMonsterDeath: (monster, options) =>
        wait.until(
          isMonsterDead(monster, options),
          toScriptWaitOptions(options),
        ),
      forDrop: (item, options) =>
        wait.until(drops.containsDrop(item), toScriptWaitOptions(options)),
      forDropRemoved: (item, options) =>
        wait.until(
          drops.containsDrop(item).pipe(Effect.map((exists) => !exists)),
          toScriptWaitOptions(options),
        ),
      forInventoryItem: (item, options) =>
        wait.until(
          inventory.contains(item, options?.quantity),
          toScriptWaitOptions(options),
        ),
      forInventoryItemRemoved: (item, options) =>
        wait.until(
          inventory
            .contains(item, options?.quantity)
            .pipe(Effect.map((exists) => !exists)),
          toScriptWaitOptions(options),
        ),
      forItemEquipped: (item, options) =>
        wait.until(
          inventory
            .getItem(item)
            .pipe(
              Effect.map(
                (inventoryItem) =>
                  inventoryItem !== null &&
                  (inventoryItem.isEquipped() || inventoryItem.isWearing()),
              ),
            ),
          toScriptWaitOptions(options),
        ),
      forBankOpen: (options) =>
        wait.until(bank.isOpen(), toScriptWaitOptions(options)),
      forBankItem: (item, options) =>
        wait.until(
          bank.contains(item, options?.quantity),
          toScriptWaitOptions(options),
        ),
      forBankItemRemoved: (item, options) =>
        wait.until(
          bank
            .contains(item, options?.quantity)
            .pipe(Effect.map((exists) => !exists)),
          toScriptWaitOptions(options),
        ),
      forHouseItem: (item, options) =>
        wait.until(
          house.getItem(item).pipe(Effect.map((item) => item !== null)),
          toScriptWaitOptions(options),
        ),
      forQuestLoaded: (questId, options) =>
        wait.until(quests.has(questId), toScriptWaitOptions(options)),
      forQuestAccepted: (questId, options) =>
        wait.until(quests.isInProgress(questId), toScriptWaitOptions(options)),
      forQuestCompleted: (questId, options) =>
        wait.until(
          quests
            .isInProgress(questId)
            .pipe(Effect.map((accepted) => !accepted)),
          toScriptWaitOptions(options),
        ),
      forSkillReady: (index, options) =>
        wait.until(combat.canUseSkill(index), toScriptWaitOptions(options)),
    };

    const bestEffortScriptSetting = (
      setting: string,
      effect: BridgeEffect<void>,
    ): BridgeEffect<void> =>
      effect.pipe(
        Effect.catchTag("SwfCallError", () =>
          appendDiagnostic(sourceName, {
            severity: "warning",
            message: `Ignored transient setting failure: ${setting}`,
          }),
        ),
      );

    const scriptSettings: ScriptSettingsShape = {
      setEnemyMagnet: (enabled) =>
        bestEffortScriptSetting(
          "setEnemyMagnet",
          settings.setEnemyMagnetEnabled(enabled),
        ),
      setInfiniteRange: (enabled) =>
        bestEffortScriptSetting(
          "setInfiniteRange",
          settings.setInfiniteRangeEnabled(enabled),
        ),
      setProvokeCell: (enabled) =>
        bestEffortScriptSetting(
          "setProvokeCell",
          settings.setProvokeCellEnabled(enabled),
        ),
      setSkipCutscenes: (enabled) =>
        bestEffortScriptSetting(
          "setSkipCutscenes",
          settings.setSkipCutscenesEnabled(enabled),
        ),
      setCustomName: (name) =>
        bestEffortScriptSetting("setCustomName", settings.setCustomName(name)),
      setCustomGuild: (name) =>
        bestEffortScriptSetting(
          "setCustomGuild",
          settings.setCustomGuild(name),
        ),
      setWalkSpeed: (speed) =>
        bestEffortScriptSetting("setWalkSpeed", settings.setWalkSpeed(speed)),
      setDeathAdsVisible: (visible) =>
        bestEffortScriptSetting(
          "setDeathAdsVisible",
          settings.setDeathAdsVisible(visible),
        ),
      setCollisionsEnabled: (enabled) =>
        bestEffortScriptSetting(
          "setCollisionsEnabled",
          settings.setCollisionsEnabled(enabled),
        ),
      setEffectsEnabled: (enabled) =>
        bestEffortScriptSetting(
          "setEffectsEnabled",
          settings.setEffectsEnabled(enabled),
        ),
      setOtherPlayersVisible: (visible) =>
        bestEffortScriptSetting(
          "setOtherPlayersVisible",
          settings.setOtherPlayersVisible(visible),
        ),
      setLagKillerEnabled: (enabled) =>
        bestEffortScriptSetting(
          "setLagKillerEnabled",
          settings.setLagKillerEnabled(enabled),
        ),
      setFrameRate: (fps) =>
        bestEffortScriptSetting("setFrameRate", settings.setFrameRate(fps)),
    };

    const startLoopTauntEffectForScript: ArmyShape["startLoopTaunt"] = (
      options,
    ) =>
      Effect.gen(function* () {
        const handle = yield* army.startLoopTaunt(options);
        const cleanupKey = `loop-taunt:${handle.id}`;
        let stopped = false;

        const cleanup = Effect.gen(function* () {
          if (stopped) {
            return;
          }

          stopped = true;
          yield* handle.stop().pipe(Effect.asVoid);
        });

        yield* scriptScope.setCleanup(cleanupKey, cleanup);

        return {
          id: handle.id,
          stop: () =>
            Effect.gen(function* () {
              if (stopped) {
                return false;
              }

              const didStop = yield* handle.stop();
              stopped = true;
              yield* scriptScope.removeCleanup(cleanupKey);
              return didStop;
            }),
        };
      });

    const startLoopTauntForScript = (
      options: Parameters<ArmyShape["startLoopTaunt"]>[0],
    ) =>
      (function* () {
        const handle = yield* wrapScriptEffect(
          startLoopTauntEffectForScript(options) as Effect.Effect<
            ArmyLoopTauntHandle,
            unknown,
            never
          >,
        );

        return {
          id: handle.id,
          stop: () =>
            (function* () {
              return yield* wrapScriptEffect(
                handle.stop() as Effect.Effect<boolean, unknown, never>,
              );
            })(),
        };
      })();

    const getScriptPlayer = (username: string) =>
      Effect.gen(function* () {
        const exact = yield* world.players.get(username);
        if (Option.isSome(exact)) {
          return exact;
        }

        return yield* world.players.getByName(username);
      });

    const getScriptPlayerAuras = (username: string) =>
      Effect.gen(function* () {
        const target = yield* getScriptPlayer(username);
        if (Option.isNone(target)) {
          return [];
        }

        return yield* world.players.getAuras(target.value.data.entID);
      });

    const getScriptPlayerAura = (username: string, auraName: string) =>
      Effect.gen(function* () {
        const target = yield* getScriptPlayer(username);
        if (Option.isNone(target)) {
          return Option.none();
        }

        return yield* world.players.getAura(target.value.data.entID, auraName);
      });

    const getScriptSelfAuras = () =>
      Effect.gen(function* () {
        const me = yield* world.players.getSelf();
        if (Option.isNone(me)) {
          return [];
        }

        return yield* world.players.getAuras(me.value.data.entID);
      });

    const getScriptSelfAura = (auraName: string) =>
      Effect.gen(function* () {
        const me = yield* world.players.getSelf();
        if (Option.isNone(me)) {
          return Option.none();
        }

        return yield* world.players.getAura(me.value.data.entID, auraName);
      });

    const scriptWorld: ScriptWorldShape = {
      map: {
        getCellMonsters: world.map.getCellMonsters,
        getCells: world.map.getCells,
        getCellPads: world.map.getCellPads,
        isLoaded: world.map.isLoaded,
        getMapItem: world.map.getMapItem,
        loadSwf: world.map.loadSwf,
        reload: world.map.reload,
        setSpawnPoint: world.map.setSpawnPoint,
        getName: world.map.getName,
        getId: world.map.getId,
        getRoomNumber: world.map.getRoomNumber,
      },
      players: {
        me: {
          get: world.players.getSelf,
          getAuras: getScriptSelfAuras,
          getAura: getScriptSelfAura,
        },
        getAll: world.players.getAll,
        get: getScriptPlayer,
        getByName: world.players.getByName,
        getAuras: getScriptPlayerAuras,
        getAura: getScriptPlayerAura,
      },
      monsters: {
        getAll: world.monsters.getAll,
        get: world.monsters.get,
        findByName: world.monsters.findByName,
        getAura: world.monsters.getAura,
      },
    };

    const scriptOptions: ScriptRuntimeApi["options"] = {
      getUsePrivateRooms: () =>
        Ref.get(scriptOptionsRef).pipe(
          Effect.map((options) => options.usePrivateRooms),
        ),
      setUsePrivateRooms: (enabled) =>
        Effect.suspend(() => {
          if (typeof enabled !== "boolean") {
            return Effect.fail(
              new ScriptExecutionError({
                sourceName,
                message:
                  "script.options.setUsePrivateRooms(enabled) expects a boolean",
                cause: enabled,
              }),
            );
          }

          return Ref.update(scriptOptionsRef, (options) => ({
            ...options,
            usePrivateRooms: enabled,
          }));
        }),
      getAll: () =>
        Ref.get(scriptOptionsRef).pipe(
          Effect.map((options) => ({ ...options })),
        ),
      reset: () => Ref.set(scriptOptionsRef, DEFAULT_SCRIPT_OPTIONS),
    };

    const resolveScriptJoinMap = (map: string): Effect.Effect<string> =>
      Effect.gen(function* () {
        const options = yield* Ref.get(scriptOptionsRef);
        if (!options.usePrivateRooms) {
          return map;
        }

        const roomNumber = yield* randomPrivateRoomNumber();
        return withPrivateRoom(map, roomNumber);
      });

    const scriptPlayerService: PlayerShape = {
      ...player,
      joinMap: (map, cell, pad) =>
        Effect.gen(function* () {
          const targetMap = yield* resolveScriptJoinMap(map);
          yield* player.joinMap(targetMap, cell, pad);
        }),
    };

    const scriptAutoRelogin: ScriptAutoReloginShape = {
      isEnabled: autoRelogin.isEnabled,
      enable: () => autoRelogin.enable().pipe(Effect.asVoid),
      disable: () => autoRelogin.disable().pipe(Effect.asVoid),
      getDelay: autoRelogin.getDelay,
      setDelay: (delayMs) => autoRelogin.setDelay(delayMs).pipe(Effect.asVoid),
      getServer: autoRelogin.getServer,
      setServer: (serverName) =>
        autoRelogin.setServer(serverName).pipe(Effect.asVoid),
    };

    const scriptAutoZone: ScriptAutoZoneShape = {
      isEnabled: autoZone.isEnabled,
      getMap: autoZone.getMap,
      enable: () => autoZone.setEnabled(true),
      disable: () => autoZone.setEnabled(false),
      setMap: autoZone.setMap,
    };

    const scriptAntiCounter: ScriptAntiCounterShape = {
      isEnabled: settings.isAntiCounterEnabled,
      setEnabled: settings.setAntiCounterEnabled,
      enable: () => settings.setAntiCounterEnabled(true),
      disable: () => settings.setAntiCounterEnabled(false),
      onStart: registerAntiCounterListener("onStart", "antiCounterStart"),
      onEnd: registerAntiCounterListener("onEnd", "antiCounterEnd"),
    };

    const { getLoginSession: _getLoginSession, ...scriptAuth } = auth;
    const scriptArmyBase = wrapValue(army) as ScriptApi["army"];
    const scriptArmy = new Proxy(
      scriptArmyBase as Record<PropertyKey, unknown>,
      {
        get(target, property, receiver) {
          if (property === "startLoopTaunt") {
            return startLoopTauntForScript;
          }

          return Reflect.get(target, property, receiver);
        },
      },
    ) as ScriptApi["army"];

    const recipes = makeScriptRecipes({
      sourceName,
      auth,
      bank,
      bridge,
      combat,
      drops,
      inventory,
      packet,
      player: scriptPlayerService,
      quests,
      shops,
      tempInventory,
      wait,
      world,
    });

    const script: ScriptRuntimeApi = {
      signal: scriptScope.signal,
      options: scriptOptions,
      log: (message: string) => {
        const text = String(message);
        console.info(`[script:${sourceName}] ${text}`);
        runFork(
          appendDiagnostic(sourceName, {
            severity: "info",
            message: text,
          }),
        );
      },
      stop: stopScript,
      sleep,
      exit: exitScript,
    };

    const api: ScriptApi = {
      army: scriptArmy,
      auth: wrapValue(scriptAuth) as ScriptApi["auth"],
      bank: wrapValue(bank) as ScriptApi["bank"],
      combat: wrapValue(combat) as ScriptApi["combat"],
      drops: wrapValue(drops) as ScriptApi["drops"],
      environment: wrapValue(environment) as ScriptApi["environment"],
      house: wrapValue(house) as ScriptApi["house"],
      inventory: wrapValue(inventory) as ScriptApi["inventory"],
      outfits: wrapValue(outfits) as ScriptApi["outfits"],
      packet: {
        sendClient: ((...args) =>
          wrapScriptEffect(
            packet.sendClient(...args),
          )) as ScriptApi["packet"]["sendClient"],
        sendServer: ((...args) =>
          wrapScriptEffect(
            packet.sendServer(...args),
          )) as ScriptApi["packet"]["sendServer"],
        packetFromClient: registerPacketListener(
          "packetFromClient",
          packet.packetFromClient,
        ),
        packetFromServer: registerPacketListener(
          "packetFromServer",
          packet.packetFromServer,
        ),
        onExtensionResponse: registerPacketListener(
          "onExtensionResponse",
          packet.onExtensionResponse,
        ),
      },
      player: wrapValue(scriptPlayerService) as ScriptApi["player"],
      quests: wrapValue(quests) as ScriptApi["quests"],
      recipes: wrapValue(recipes) as ScriptApi["recipes"],
      settings: wrapValue(scriptSettings) as ScriptApi["settings"],
      shops: wrapValue(shops) as ScriptApi["shops"],
      tempInventory: wrapValue(tempInventory) as ScriptApi["tempInventory"],
      wait: wrapValue(scriptWait) as ScriptApi["wait"],
      world: wrapValue(scriptWorld) as ScriptApi["world"],
    };

    const features: ScriptFeaturesApi = {
      autoRelogin: wrapValue(
        scriptAutoRelogin,
      ) as ScriptFeaturesApi["autoRelogin"],
      autoZone: wrapValue(scriptAutoZone) as ScriptFeaturesApi["autoZone"],
      antiCounter: wrapValue(
        scriptAntiCounter,
      ) as ScriptFeaturesApi["antiCounter"],
    };

    const context: ScriptContext = {
      api,
      script,
      features,
    };

    return Effect.gen(function* () {
      runtime.setContext(context);

      const generator = yield* Effect.try({
        try: () => main(),
        catch: (cause) =>
          new ScriptExecutionError({
            sourceName,
            message: "Script failed before it yielded",
            cause,
          }),
      });

      if (!isGenerator(generator)) {
        return yield* new ScriptExecutionError({
          sourceName,
          message: "Script entrypoint did not return a generator",
          cause: generator,
        });
      }

      yield* Effect.gen(() => generator);
    }).pipe(
      Effect.catchCause((cause) =>
        Cause.hasInterruptsOnly(cause) || scriptScope.isCancelled()
          ? Effect.void
          : appendErrorDiagnostic(sourceName, causeMessage(cause), cause).pipe(
              Effect.andThen(
                Effect.logError({
                  message: "script execution failed",
                  sourceName,
                  cause,
                }),
              ),
            ),
      ),
      Effect.ensuring(
        scriptScope.close("script finished").pipe(
          Effect.ensuring(
            Effect.sync(() => {
              runtime.clearContext();
            }),
          ),
          Effect.ensuring(
            Effect.sync(() => {
              if (closeWindowOnExit) {
                window.ipc.windows.requestCloseGameWindow();
              }
            }),
          ),
        ),
      ),
    );
  };

  const runScriptPayload = (payload: ScriptExecutePayload): Promise<void> =>
    runPromise(
      run(payload.source, {
        name: scriptNameFromPayload(payload),
      }),
    );

  const runScriptPayloadFromIpc = (payload: ScriptExecutePayload) => {
    void runScriptPayload(payload).catch((cause) => {
      console.error("Failed to run script", {
        sourceName: scriptNameFromPayload(payload),
        cause,
      });
    });
  };

  const stopFromIpc = () => {
    runFork(stop("ipc request"));
  };

  const removeExecuteListener = window.ipc.scripting.onExecute(
    runScriptPayloadFromIpc,
  );
  const removeStopListener = window.ipc.scripting.onStop(() => {
    stopFromIpc();
  });

  yield* Effect.addFinalizer(() =>
    Effect.sync(() => {
      removeExecuteListener();
      removeStopListener();
    }),
  );

  const stop: ScriptRunnerShape["stop"] = (reason = "manual stop") =>
    interruptActiveScript(reason);

  const run: ScriptRunnerShape["run"] = (source, options) =>
    Effect.withFiber((launchFiber) =>
      Effect.gen(function* () {
        yield* replacePendingLaunch(launchFiber);

        const sourceName = options?.name?.trim()
          ? options.name
          : "inline-script";

        const loaded = yield* loadScriptModule(source, sourceName).pipe(
          Effect.tapError((error) =>
            Effect.gen(function* () {
              yield* Ref.set(diagnosticsRef, []);
              yield* appendErrorDiagnostic(sourceName, error.message, error);
            }),
          ),
        );

        yield* runSemaphore.withPermits(1)(
          Effect.gen(function* () {
            yield* ensureReady(sourceName);
            yield* stop("replaced by a new script");
            yield* Ref.set(diagnosticsRef, []);
            bridgeFailureDiagnosticState.clear();
            yield* Ref.update(scriptOptionsRef, (current) =>
              applyScriptOptionsPatch(current, options?.options),
            );

            const token = yield* Ref.updateAndGet(
              nextScriptTokenRef,
              (value) => value + 1,
            );
            const scriptScope = makeScriptAsyncScope(runFork);
            const fiber = yield* Effect.forkDetach(
              executeScript(
                sourceName,
                loaded.main,
                loaded.runtime,
                scriptScope,
              ).pipe(Effect.ensuring(clearActiveScript(token))),
            );

            yield* Ref.set(
              activeFiberRef,
              Option.some({ token, fiber, scope: scriptScope }),
            );
            yield* clearPendingLaunch(launchFiber);
            yield* Effect.logInfo(`[scripting] started script: ${sourceName}`);
          }),
        );
      }).pipe(
        Effect.catchTag("ScriptLoadError", (error: ScriptLoadError) =>
          Effect.fail(error),
        ),
        Effect.ensuring(clearPendingLaunch(launchFiber)),
      ),
    );

  const isRunning: ScriptRunnerShape["isRunning"] = () =>
    Ref.get(activeFiberRef).pipe(Effect.map(Option.isSome));

  const diagnostics: ScriptRunnerShape["diagnostics"] = () =>
    Ref.get(diagnosticsRef);

  const getOptions: ScriptRunnerShape["getOptions"] = () =>
    Ref.get(scriptOptionsRef).pipe(Effect.map((options) => ({ ...options })));

  const setUsePrivateRooms: ScriptRunnerShape["setUsePrivateRooms"] = (
    enabled,
  ) =>
    Ref.update(scriptOptionsRef, (options) => ({
      ...options,
      usePrivateRooms: enabled,
    }));

  return {
    run,
    stop,
    isRunning,
    diagnostics,
    getOptions,
    setUsePrivateRooms,
  } satisfies ScriptRunnerShape;
});

export const ScriptRunnerLive = Layer.effect(ScriptRunner, make);

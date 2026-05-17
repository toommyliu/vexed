import { Cause, Effect, Fiber, Layer, Option, Ref, Semaphore } from "effect";
import { type ScriptExecutePayload } from "../ipc";
import { Army, type ArmyShape } from "../../army/Services/Army";
import { Auth } from "../../flash/Services/Auth";
import { AutoRelogin } from "../../features/Services/AutoRelogin";
import { AutoZone } from "../../features/Services/AutoZone";
import { Bank } from "../../flash/Services/Bank";
import { Bridge } from "../../flash/Services/Bridge";
import { Combat } from "../../flash/Services/Combat";
import { Drops } from "../../flash/Services/Drops";
import { Environment } from "../../environment/Services/Environment";
import { House } from "../../flash/Services/House";
import { Inventory } from "../../flash/Services/Inventory";
import { Packet } from "../../flash/Services/Packet";
import { Player } from "../../flash/Services/Player";
import { Quests } from "../../flash/Services/Quests";
import { Settings } from "../../flash/Services/Settings";
import { Shops } from "../../flash/Services/Shops";
import { TempInventory } from "../../flash/Services/TempInventory";
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
  ScriptMain,
  ScriptPacketListener,
  ScriptRuntimeApi,
  ScriptSettingsShape,
  ScriptWorldShape,
} from "../ScriptApi";
import {
  type ScriptAsyncScope,
  makeScriptAsyncScope,
} from "../scriptAsyncScope";
import { makeScriptRecipes } from "../recipes";
import { loadScriptModule } from "../scriptLoader";

type ActiveScript = {
  readonly token: number;
  readonly fiber: Fiber.Fiber<void, unknown>;
  readonly scope: ScriptAsyncScope;
};

type LaunchFiber = Fiber.Fiber<unknown, unknown>;

const MAX_SCRIPT_DIAGNOSTICS = 50;

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

const causeMessage = (cause: Cause.Cause<unknown>): string => {
  const error = Cause.squash(cause);
  return error instanceof Error ? error.message : String(error);
};

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
  const packet = yield* Packet;
  const player = yield* Player;
  const quests = yield* Quests;
  const settings = yield* Settings;
  const shops = yield* Shops;
  const tempInventory = yield* TempInventory;
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
      ...(cause === undefined ? null : { details: { cause: String(cause) } }),
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
    scriptScope: ScriptAsyncScope,
  ) => {
    const wrapScriptEffect = <A, E>(
      effect: Effect.Effect<A, E, never>,
    ): Effect.Effect<A, E | ScriptNotReadyError> =>
      Effect.suspend(() => {
        if (scriptScope.isCancelled()) {
          return Effect.interrupt as Effect.Effect<A, E | ScriptNotReadyError>;
        }

        return ensureReady(sourceName).pipe(Effect.andThen(effect));
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

    const stopScript = (reason?: string): Effect.Effect<never> =>
      Effect.gen(function* () {
        const stopReason = reason?.trim() ? reason : "script request";

        yield* scriptScope.requestInterrupt(stopReason);
        runFork(interruptActiveScript(stopReason));

        return yield* Effect.interrupt;
      });

    const handlePacketHandlerCause = (
      listener: string,
      cause: Cause.Cause<unknown>,
    ) =>
      Cause.hasInterruptsOnly(cause) || scriptScope.isCancelled()
        ? Effect.void
        : appendErrorDiagnostic(
            sourceName,
            `${listener} packet handler failed: ${causeMessage(cause)}`,
            cause,
          ).pipe(
            Effect.andThen(
              Effect.logError({
                message: "script packet handler failed",
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
            handlePacketHandlerCause(listener, cause),
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

    const scriptSettings: ScriptSettingsShape = {
      setEnemyMagnet: settings.setEnemyMagnetEnabled,
      setInfiniteRange: settings.setInfiniteRangeEnabled,
      setProvokeCell: settings.setProvokeCellEnabled,
      setSkipCutscenes: settings.setSkipCutscenesEnabled,
      setCustomName: settings.setCustomName,
      setCustomGuild: settings.setCustomGuild,
      setWalkSpeed: settings.setWalkSpeed,
      setDeathAdsVisible: settings.setDeathAdsVisible,
      setCollisionsEnabled: settings.setCollisionsEnabled,
      setEffectsEnabled: settings.setEffectsEnabled,
      setOtherPlayersVisible: settings.setOtherPlayersVisible,
      setLagKillerEnabled: settings.setLagKillerEnabled,
      setFrameRate: settings.setFrameRate,
    };

    const startLoopTauntForScript: ArmyShape["startLoopTaunt"] = (options) =>
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
        isActionAvailable: world.map.isActionAvailable,
        getMapItem: world.map.getMapItem,
        loadSwf: world.map.loadSwf,
        reload: world.map.reload,
        setSpawnPoint: world.map.setSpawnPoint,
        waitForGameAction: world.map.waitForGameAction,
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

    const { getLoginSession: _getLoginSession, ...scriptAuth } = auth;
    const scriptArmy: ArmyShape = {
      ...army,
      startLoopTaunt: startLoopTauntForScript,
    };

    const recipes = makeScriptRecipes({
      sourceName,
      auth,
      bank,
      bridge,
      combat,
      drops,
      inventory,
      packet,
      player,
      quests,
      shops,
      tempInventory,
      world,
    });

    const script: ScriptRuntimeApi = {
      signal: scriptScope.signal,
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
    };

    const api: ScriptApi = {
      army: wrapValue(scriptArmy) as ScriptApi["army"],
      auth: wrapValue(scriptAuth) as ScriptApi["auth"],
      bank: wrapValue(bank) as ScriptApi["bank"],
      combat: wrapValue(combat) as ScriptApi["combat"],
      drops: wrapValue(drops) as ScriptApi["drops"],
      environment: wrapValue(environment) as ScriptApi["environment"],
      house: wrapValue(house) as ScriptApi["house"],
      inventory: wrapValue(inventory) as ScriptApi["inventory"],
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
      player: wrapValue(player) as ScriptApi["player"],
      quests: wrapValue(quests) as ScriptApi["quests"],
      recipes: wrapValue(recipes) as ScriptApi["recipes"],
      settings: wrapValue(scriptSettings) as ScriptApi["settings"],
      shops: wrapValue(shops) as ScriptApi["shops"],
      tempInventory: wrapValue(tempInventory) as ScriptApi["tempInventory"],
      world: wrapValue(scriptWorld) as ScriptApi["world"],
    };

    const context: ScriptContext = {
      api,
      script,
      autoRelogin: wrapValue(scriptAutoRelogin) as ScriptContext["autoRelogin"],
      autoZone: wrapValue(scriptAutoZone) as ScriptContext["autoZone"],
    };

    return Effect.gen(function* () {
      const generator = yield* Effect.try({
        try: () => main(context),
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
      Effect.ensuring(scriptScope.close("script finished")),
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

        const main = yield* loadScriptModule(source, sourceName).pipe(
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

            const token = yield* Ref.updateAndGet(
              nextScriptTokenRef,
              (value) => value + 1,
            );
            const scriptScope = makeScriptAsyncScope(runFork);
            const fiber = yield* Effect.forkDetach(
              executeScript(sourceName, main, scriptScope).pipe(
                Effect.ensuring(clearActiveScript(token)),
              ),
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

  return {
    run,
    stop,
    isRunning,
    diagnostics,
  } satisfies ScriptRunnerShape;
});

export const ScriptRunnerLive = Layer.effect(ScriptRunner, make);

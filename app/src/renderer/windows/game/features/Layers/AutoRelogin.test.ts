import { Server, type ServerData } from "@vexed/game";
import { Effect, Exit, Fiber, Layer } from "effect";
import { expect, test } from "vitest";
import { SwfCallError } from "../../flash/Errors";
import { Auth, type AuthShape } from "../../flash/Services/Auth";
import { Bridge, type BridgeShape } from "../../flash/Services/Bridge";
import {
  Jobs,
  type JobsShape,
  type PeriodicJobDefinition,
} from "../../jobs/Services/Jobs";
import { Player, type PlayerShape } from "../../flash/Services/Player";
import { Settings, type SettingsShape } from "../../flash/Services/Settings";
import { AutoRelogin, type AutoReloginShape } from "../Services/AutoRelogin";
import { AutoReloginLive } from "./AutoRelogin";

const twigServer: ServerData = {
  bOnline: 1,
  bUpg: 0,
  iChat: 0,
  iCount: 212,
  iLevel: 0,
  iMax: 1000,
  iPort: 5589,
  sIP: "sock8.aq.com",
  sLang: "xx",
  sName: "Twig",
};

const yorumiServer: ServerData = {
  ...twigServer,
  sName: "Yorumi",
};

type HarnessOptions = {
  readonly bridgeLoggedIn?: boolean;
  readonly emitConnectionOnConnect?: boolean;
  readonly iUpgDays?: number;
  readonly password?: string;
  readonly playerReadyAfterConnectDelayMs?: number;
  readonly playerReadyFailures?: number;
  readonly serverInfo?: string;
  readonly serverSelectStalls?: boolean;
  readonly servers?: readonly ServerData[];
  readonly settingsApplyFails?: boolean;
};

type Harness = {
  readonly authCalls: string[];
  readonly jobsState: {
    readonly definition: PeriodicJobDefinition | undefined;
    readonly task: Effect.Effect<void, unknown> | undefined;
  };
  readonly emitConnection: (status: ConnectionStatus) => void;
  readonly manualLogin: (server?: ServerData) => void;
  readonly settingsPatches: readonly unknown[];
};

const withAutoRelogin = async <A>(
  options: HarnessOptions,
  body: (
    autoRelogin: AutoReloginShape,
    harness: Harness,
  ) => Effect.Effect<A, unknown>,
): Promise<A> => {
  const authCalls: string[] = [];
  const settingsPatches: unknown[] = [];
  const connectionHandlers = new Set<(status: ConnectionStatus) => void>();
  const jobsState: {
    definition: PeriodicJobDefinition | undefined;
    task: Effect.Effect<void, unknown> | undefined;
  } = {
    definition: undefined,
    task: undefined,
  };
  let phase: "login" | "servers" | "game" = "login";
  let playerReady = false;

  const bridgeLoggedIn = options.bridgeLoggedIn ?? true;
  let serverInfo = options.serverInfo ?? JSON.stringify(twigServer);
  const iUpgDays = options.iUpgDays ?? 30;
  const password = options.password ?? "secret-password";
  const servers = options.servers ?? [twigServer];
  let remainingPlayerReadyFailures = options.playerReadyFailures ?? 0;

  const bridge = {
    call<K extends keyof Window["swf"]>(
      path: K,
      args?: Parameters<Window["swf"][K]>,
    ) {
      return Effect.sync(() => {
        if (path === "auth.isLoggedIn") {
          return bridgeLoggedIn as ReturnType<Window["swf"][K]>;
        }

        if (path === "flash.getGameObject") {
          const key = args?.[0];
          if (key === "objServerInfo") {
            return serverInfo as ReturnType<Window["swf"][K]>;
          }

          if (key === "mcLogin.currentLabel") {
            return (
              phase === "servers" && options.serverSelectStalls !== true
                ? "Servers"
                : "Login"
            ) as ReturnType<Window["swf"][K]>;
          }

          if (key === "currentLabel") {
            return (phase === "game" ? "Game" : "Login") as ReturnType<
              Window["swf"][K]
            >;
          }
        }

        if (path === "flash.isNull") {
          return true as ReturnType<Window["swf"][K]>;
        }

        if (path === "flash.getConnMcText") {
          return "loading" as ReturnType<Window["swf"][K]>;
        }

        if (path === "flash.isConnMcBackButtonVisible") {
          return false as ReturnType<Window["swf"][K]>;
        }

        throw new Error(`unexpected bridge call: ${String(path)}`);
      });
    },
    callGameFunction() {
      return Effect.void;
    },
    onConnection(handler: (status: ConnectionStatus) => void) {
      connectionHandlers.add(handler);
      return Effect.succeed(() => {
        connectionHandlers.delete(handler);
      });
    },
  } satisfies BridgeShape;

  const auth = {
    connectTo(server: string) {
      return Effect.gen(function* () {
        authCalls.push(`connectTo:${server}`);
        phase = "game";
        if (options.emitConnectionOnConnect === true) {
          for (const handler of connectionHandlers) {
            handler("OnConnection");
          }
        }

        if (options.playerReadyAfterConnectDelayMs !== undefined) {
          yield* Effect.sleep(
            `${options.playerReadyAfterConnectDelayMs} millis`,
          );
        }
        playerReady = true;
        return true;
      });
    },
    getServers() {
      return Effect.succeed(servers.map((server) => new Server(server)));
    },
    getUsername() {
      return Effect.succeed("Hero");
    },
    getPassword() {
      return Effect.succeed(password);
    },
    getLoginSession() {
      return Effect.succeed({
        ...twigServer,
        bSuccess: 1,
        iUpgDays,
        iUpg: 1,
        servers: [],
        sToken: "",
        unm: "Hero",
      });
    },
    isLoggedIn() {
      return Effect.succeed(bridgeLoggedIn);
    },
    isTemporarilyKicked() {
      return Effect.succeed(false);
    },
    login(username: string, loginPassword: string) {
      authCalls.push(`login:${username}:${loginPassword}`);
      phase = "servers";
      return Effect.void;
    },
    logout() {
      authCalls.push("logout");
      return Effect.void;
    },
  } satisfies AuthShape;

  const jobs = {
    start() {
      return Effect.succeed(true);
    },
    startPeriodic() {
      return Effect.succeed(true);
    },
    startPeriodicJob(definition: PeriodicJobDefinition) {
      jobsState.definition = definition;
      jobsState.task = definition.task;
      return Effect.succeed(true);
    },
    stop() {
      jobsState.definition = undefined;
      return Effect.succeed(true);
    },
    stopAll() {
      jobsState.definition = undefined;
      return Effect.void;
    },
    isRunning() {
      return Effect.succeed(jobsState.definition !== undefined);
    },
    getRunningKeys() {
      return Effect.succeed(
        jobsState.definition === undefined ? [] : [jobsState.definition.key],
      );
    },
  } satisfies JobsShape;

  const player = {
    isReady() {
      return Effect.gen(function* () {
        if (remainingPlayerReadyFailures > 0) {
          remainingPlayerReadyFailures -= 1;
          return yield* new SwfCallError({
            method: "player.isLoaded",
            cause: "player not ready",
          });
        }
        return playerReady;
      });
    },
  } as unknown as PlayerShape;

  const settings = {
    getState() {
      return Effect.succeed({
        collisionsEnabled: true,
        deathAdsVisible: true,
        effectsEnabled: true,
        enemyMagnetEnabled: false,
        frameRate: 24,
        infiniteRangeEnabled: false,
        lagKillerEnabled: true,
        otherPlayersVisible: true,
        provokeCellEnabled: false,
        skipCutscenesEnabled: true,
        walkSpeed: 8,
      });
    },
    apply(patch: unknown) {
      settingsPatches.push(patch);
      if (options.settingsApplyFails === true) {
        return Effect.fail(
          new SwfCallError({
            method: "settings.setLagKillerEnabled",
            cause: "world unavailable",
          }),
        );
      }
      return Effect.void;
    },
  } as unknown as SettingsShape;

  return await Effect.runPromise(
    Effect.scoped(
      Effect.gen(function* () {
        const autoRelogin = yield* AutoRelogin;
        return yield* body(autoRelogin, {
          authCalls,
          emitConnection(status) {
            for (const handler of connectionHandlers) {
              handler(status);
            }
          },
          jobsState,
          manualLogin(server = twigServer) {
            serverInfo = JSON.stringify(server);
            phase = "game";
            playerReady = true;
            for (const handler of connectionHandlers) {
              handler("OnConnection");
            }
          },
          settingsPatches,
        });
      }),
    ).pipe(
      Effect.provide(
        AutoReloginLive.pipe(
          Layer.provide(
            Layer.mergeAll(
              Layer.succeed(Auth)(auth),
              Layer.succeed(Bridge)(bridge),
              Layer.succeed(Jobs)(jobs),
              Layer.succeed(Player)(player),
              Layer.succeed(Settings)(settings),
            ),
          ),
        ),
      ),
    ),
  );
};

test("captures current session from objServerInfo without exposing password", async () => {
  const state = await withAutoRelogin({}, (autoRelogin) =>
    Effect.gen(function* () {
      yield* autoRelogin.enable();
      return yield* autoRelogin.getState();
    }),
  );

  expect(state).toMatchObject({
    captured: true,
    enabled: true,
    server: "Twig",
    username: "Hero",
  });
  expect(JSON.stringify(state)).not.toContain("secret-password");
});

test("ignores null objServerInfo", async () => {
  const state = await withAutoRelogin({ serverInfo: "null" }, (autoRelogin) =>
    Effect.gen(function* () {
      yield* autoRelogin.enable();
      return yield* autoRelogin.getState();
    }),
  );

  expect(state.captured).toBe(false);
  expect(state.lastError).toBe("current session is not capturable");
});

test("captures current session automatically on connection", async () => {
  const state = await withAutoRelogin({}, (autoRelogin, harness) =>
    Effect.gen(function* () {
      harness.emitConnection("OnConnection");
      yield* Effect.sleep("10 millis");
      return yield* autoRelogin.getState();
    }),
  );

  expect(state).toMatchObject({
    captured: true,
    enabled: false,
    server: "Twig",
    username: "Hero",
  });
});

test("removes listener when initial state emit throws", async () => {
  const result = await withAutoRelogin({}, (autoRelogin) =>
    Effect.gen(function* () {
      let failingCalls = 0;
      const exit = yield* Effect.exit(
        autoRelogin.onState(() => {
          failingCalls += 1;
          throw new Error("listener failed");
        }),
      );

      yield* autoRelogin.enable();

      return {
        failed: Exit.isFailure(exit),
        failingCalls,
      };
    }),
  );

  expect(result.failed).toBe(true);
  expect(result.failingCalls).toBe(1);
});

test("successful task logs in and connects to captured server", async () => {
  const harness = await withAutoRelogin({}, (autoRelogin, currentHarness) =>
    Effect.gen(function* () {
      yield* autoRelogin.enable();
      yield* autoRelogin.setDelayMs(0);
      yield* currentHarness.jobsState.task!;
      return currentHarness;
    }),
  );

  expect(harness.authCalls).toEqual([
    "login:Hero:secret-password",
    "connectTo:Twig",
  ]);
  expect(harness.settingsPatches).toEqual([
    { lagKillerEnabled: false, skipCutscenesEnabled: false },
    { lagKillerEnabled: true, skipCutscenesEnabled: true },
  ]);
});

test("socket connection during relogin does not interrupt before player ready", async () => {
  const result = await withAutoRelogin(
    {
      emitConnectionOnConnect: true,
      playerReadyAfterConnectDelayMs: 150,
    },
    (autoRelogin, harness) =>
      Effect.gen(function* () {
        yield* autoRelogin.enable();
        yield* autoRelogin.setDelayMs(0);
        yield* harness.jobsState.task!;
        return {
          calls: harness.authCalls,
          state: yield* autoRelogin.getState(),
        };
      }),
  );

  expect(result.calls).toEqual([
    "login:Hero:secret-password",
    "connectTo:Twig",
  ]);
  expect(result.state).toMatchObject({
    attempting: false,
    server: "Twig",
  });
  expect(result.state.lastError).toBeUndefined();
});

test("waits delayMs after logout before attempting", async () => {
  const result = await withAutoRelogin({}, (autoRelogin, harness) =>
    Effect.gen(function* () {
      yield* autoRelogin.enable();
      yield* autoRelogin.setDelayMs(50);
      yield* harness.jobsState.task!;
      const beforeDelay = [...harness.authCalls];
      yield* Effect.sleep("60 millis");
      yield* harness.jobsState.task!;
      return {
        beforeDelay,
        calls: harness.authCalls,
      };
    }),
  );

  expect(result.beforeDelay).toEqual([]);
  expect(result.calls).toEqual([
    "login:Hero:secret-password",
    "connectTo:Twig",
  ]);
});

test("does not start logout delay while connected but still loading", async () => {
  const harness = await withAutoRelogin({}, (autoRelogin, currentHarness) =>
    Effect.gen(function* () {
      yield* autoRelogin.enable();
      yield* autoRelogin.setDelayMs(0);
      currentHarness.emitConnection("OnConnection");
      yield* Effect.sleep("10 millis");
      yield* currentHarness.jobsState.task!;
      return currentHarness;
    }),
  );

  expect(harness.authCalls).toEqual([]);
});

test("starts delay from connection lost event", async () => {
  const result = await withAutoRelogin({}, (autoRelogin, harness) =>
    Effect.gen(function* () {
      yield* autoRelogin.enable();
      yield* autoRelogin.setDelayMs(50);
      harness.emitConnection("OnConnection");
      yield* Effect.sleep("10 millis");
      harness.emitConnection("OnConnectionLost");
      yield* Effect.sleep("60 millis");
      yield* harness.jobsState.task!;
      return harness.authCalls;
    }),
  );

  expect(result).toEqual(["login:Hero:secret-password", "connectTo:Twig"]);
});

test("transient player readiness bridge failures do not fail relogin", async () => {
  const result = await withAutoRelogin(
    { playerReadyFailures: 2 },
    (autoRelogin, harness) =>
      Effect.gen(function* () {
        yield* autoRelogin.enable();
        yield* autoRelogin.setDelayMs(0);
        yield* harness.jobsState.task!;
        return {
          calls: harness.authCalls,
          state: yield* autoRelogin.getState(),
        };
      }),
  );

  expect(result.calls).toEqual([
    "login:Hero:secret-password",
    "connectTo:Twig",
  ]);
  expect(result.state.lastError).toBeUndefined();
});

test("temporary setting failures do not block relogin", async () => {
  const result = await withAutoRelogin(
    { settingsApplyFails: true },
    (autoRelogin, harness) =>
      Effect.gen(function* () {
        yield* autoRelogin.enable();
        yield* autoRelogin.setDelayMs(0);
        yield* harness.jobsState.task!;
        return {
          calls: harness.authCalls,
          state: yield* autoRelogin.getState(),
        };
      }),
  );

  expect(result.calls).toEqual([
    "login:Hero:secret-password",
    "connectTo:Twig",
  ]);
  expect(result.state.lastError).toBeUndefined();
});

test("manual login during attempt interrupts without reconnecting captured server", async () => {
  const result = await withAutoRelogin(
    { serverSelectStalls: true },
    (autoRelogin, harness) =>
      Effect.gen(function* () {
        yield* autoRelogin.enable();
        yield* autoRelogin.setDelayMs(0);
        const fiber = yield* Effect.forkDetach(harness.jobsState.task!, {
          startImmediately: true,
        });
        yield* Effect.sleep("10 millis");
        harness.manualLogin(yorumiServer);
        yield* Fiber.join(fiber);
        return {
          calls: harness.authCalls,
          state: yield* autoRelogin.getState(),
        };
      }),
  );

  expect(result.calls).toEqual(["login:Hero:secret-password"]);
  expect(result.state).toMatchObject({
    attempting: false,
    server: "Yorumi",
  });
  expect(result.state.lastError).toBeUndefined();
});

test("manual login during owned connection interrupts when server changes", async () => {
  const result = await withAutoRelogin(
    {
      emitConnectionOnConnect: true,
      playerReadyAfterConnectDelayMs: 500,
    },
    (autoRelogin, harness) =>
      Effect.gen(function* () {
        yield* autoRelogin.enable();
        yield* autoRelogin.setDelayMs(0);
        const fiber = yield* Effect.forkDetach(harness.jobsState.task!, {
          startImmediately: true,
        });
        yield* Effect.sleep("1100 millis");
        harness.manualLogin(yorumiServer);
        yield* Fiber.join(fiber);
        return {
          calls: harness.authCalls,
          state: yield* autoRelogin.getState(),
        };
      }),
  );

  expect(result.calls).toEqual([
    "login:Hero:secret-password",
    "connectTo:Twig",
  ]);
  expect(result.state).toMatchObject({
    attempting: false,
    server: "Yorumi",
  });
  expect(result.state.lastError).toBeUndefined();
});

test("disable during attempt interrupts without reconnecting", async () => {
  const result = await withAutoRelogin(
    { serverSelectStalls: true },
    (autoRelogin, harness) =>
      Effect.gen(function* () {
        yield* autoRelogin.enable();
        yield* autoRelogin.setDelayMs(0);
        const fiber = yield* Effect.forkDetach(harness.jobsState.task!, {
          startImmediately: true,
        });
        yield* Effect.sleep("10 millis");
        yield* autoRelogin.disable();
        yield* Fiber.join(fiber);
        return {
          calls: harness.authCalls,
          state: yield* autoRelogin.getState(),
        };
      }),
  );

  expect(result.calls).toEqual(["login:Hero:secret-password"]);
  expect(result.state).toMatchObject({
    attempting: false,
    enabled: false,
  });
  expect(result.state.lastError).toBeUndefined();
});

test("does not choose another server when captured server is unavailable", async () => {
  const result = await withAutoRelogin(
    { servers: [yorumiServer] },
    (autoRelogin, harness) =>
      Effect.gen(function* () {
        yield* autoRelogin.enable();
        yield* autoRelogin.setDelayMs(0);
        yield* harness.jobsState.task!;
        return {
          calls: harness.authCalls,
          state: yield* autoRelogin.getState(),
        };
      }),
  );

  expect(result.calls).toEqual(["login:Hero:secret-password"]);
  expect(result.state.lastError).toContain("captured server is unavailable");
});

test("rejects member-only server when iUpgDays is negative", async () => {
  const memberServer = {
    ...twigServer,
    bUpg: 1,
  };

  const result = await withAutoRelogin(
    {
      iUpgDays: -1,
      serverInfo: JSON.stringify(memberServer),
      servers: [memberServer],
    },
    (autoRelogin, harness) =>
      Effect.gen(function* () {
        yield* autoRelogin.enable();
        yield* autoRelogin.setDelayMs(0);
        yield* harness.jobsState.task!;
        return {
          calls: harness.authCalls,
          state: yield* autoRelogin.getState(),
        };
      }),
  );

  expect(result.calls).toEqual(["login:Hero:secret-password"]);
  expect(result.state.lastError).toContain("captured server is not eligible");
});

test("missing captured session does not attempt login", async () => {
  const harness = await withAutoRelogin(
    { serverInfo: "null" },
    (autoRelogin, currentHarness) =>
      Effect.gen(function* () {
        yield* autoRelogin.enable();
        yield* autoRelogin.setDelayMs(0);
        yield* currentHarness.jobsState.task!;
        return currentHarness;
      }),
  );

  expect(harness.authCalls).toEqual([]);
});

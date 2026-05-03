import { Server, type ServerData } from "@vexed/game";
import {
  Data,
  Duration,
  Effect,
  Layer,
  Option,
  Schedule,
  SynchronizedRef,
} from "effect";
import {
  SwfCallError,
  SwfMethodNotFoundError,
  SwfUnavailableError,
} from "../../flash/Errors";
import { Auth } from "../../flash/Services/Auth";
import { Bridge } from "../../flash/Services/Bridge";
import { Jobs } from "../../flash/Services/Jobs";
import { Player } from "../../flash/Services/Player";
import { Settings } from "../../flash/Services/Settings";
import type { SettingsState } from "../../flash/Services/Settings";
import type { LoginSession } from "../../flash/Types";
import { waitFor } from "../../utils/waitFor";
import {
  AutoRelogin,
  type AutoReloginShape,
  type AutoReloginState,
  type AutoReloginStateListener,
} from "../Services/AutoRelogin";

const JOB_KEY = "features/autorelogin";
const JOB_INTERVAL = "1 second";
const DEFAULT_DELAY_MS = 3_000;
const TEMP_KICK_TIMEOUT = "70 seconds";
const SERVER_SELECT_TIMEOUT = "10 seconds";
const SERVERS_LOAD_TIMEOUT = "5 seconds";
const GAME_ENTRY_TIMEOUT = "15 seconds";
const PLAYER_READY_TIMEOUT = "10 seconds";
const MIN_FAILURE_COOLDOWN_MS = 5_000;
const MAX_FAILURE_COOLDOWN_MS = 60_000;
const MAX_RELOGIN_RETRIES = 3;

class AutoReloginAttemptError extends Data.TaggedError(
  "AutoReloginAttemptError",
)<{
  readonly message: string;
  readonly retryable: boolean;
}> {}

class AutoReloginInterrupted extends Data.TaggedError(
  "AutoReloginInterrupted",
)<{
  readonly reason: string;
}> {}

type CapturedSession = {
  readonly username: string;
  readonly password: string;
  readonly server: ServerData;
};

type ReservedAttempt = {
  readonly captured: CapturedSession;
  // Prevents stale attempts from continuing after a manual or successful reconnect.
  readonly connectionSeq: number;
};

type RuntimeState = {
  enabled: boolean;
  captured: CapturedSession | null;
  attempting: boolean;
  delayMs: number;
  lastError: string | undefined;
  // Retry spacing anchor; first-attempt delay is anchored by loggedOutSince.
  lastAttemptAt: number;
  // Set from the real disconnect event so delayMs means "after logout".
  loggedOutSince: number | undefined;
  // SmartFox can be connected while player.isReady() is still false.
  connected: boolean;
  // Prevents the relogin attempt's own socket connection from interrupting itself.
  ownedConnectionServerName: string | undefined;
  // Bumped on external connections so long waits can be interrupted safely.
  connectionSeq: number;
};

type LogoutObservation = {
  readonly firstObserved: boolean;
  readonly loggedOutSince: number;
};

const initialState = (): RuntimeState => ({
  enabled: false,
  captured: null,
  attempting: false,
  delayMs: DEFAULT_DELAY_MS,
  lastError: undefined,
  lastAttemptAt: 0,
  loggedOutSince: undefined,
  connected: false,
  ownedConnectionServerName: undefined,
  connectionSeq: 0,
});

const toPublicState = (state: RuntimeState): AutoReloginState => ({
  enabled: state.enabled,
  captured: state.captured !== null,
  attempting: state.attempting,
  ...(state.captured !== null ? { username: state.captured.username } : {}),
  ...(state.captured !== null ? { server: state.captured.server.sName } : {}),
  delayMs: state.delayMs,
  ...(state.lastError !== undefined ? { lastError: state.lastError } : {}),
});

const isServerData = (value: unknown): value is ServerData => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record["sName"] === "string" &&
    typeof record["sIP"] === "string" &&
    typeof record["sLang"] === "string" &&
    typeof record["bOnline"] === "number" &&
    typeof record["bUpg"] === "number" &&
    typeof record["iChat"] === "number" &&
    typeof record["iCount"] === "number" &&
    typeof record["iLevel"] === "number" &&
    typeof record["iMax"] === "number" &&
    typeof record["iPort"] === "number"
  );
};

const parseServerInfo = (value: string): ServerData | null => {
  // objServerInfo is exposed as JSON text, with literal "null" before capture.
  if (value === "null" || value.trim() === "") {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return isServerData(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const decodeFlashValue = (value: string): unknown => {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
};

const flashStringEquals = (value: string, expected: string): boolean =>
  decodeFlashValue(value) === expected || value === expected;

const normalizeDelayMs = (delayMs: number): number =>
  Number.isFinite(delayMs)
    ? Math.max(0, Math.trunc(delayMs))
    : DEFAULT_DELAY_MS;

const redacted = (message: string, secret: string | undefined): string =>
  secret === undefined || secret === ""
    ? message
    : message.replaceAll(secret, "[redacted]");

const formatReloginError = (error: unknown): string => {
  if (error instanceof AutoReloginAttemptError) {
    return error.message;
  }

  if (error instanceof SwfUnavailableError) {
    return `Flash bridge unavailable while calling ${error.method}`;
  }

  if (error instanceof SwfMethodNotFoundError) {
    return `Flash bridge method missing: ${error.method}`;
  }

  if (error instanceof SwfCallError) {
    return `Flash bridge call failed: ${error.method}`;
  }

  if (error instanceof Error && error.message !== "") {
    return error.message;
  }

  if (typeof error === "string" && error !== "") {
    return error;
  }

  return "autorelogin failed";
};

const isServerEligible = (
  server: Server,
  loginSession: LoginSession | null,
): boolean => {
  if (!server.isOnline() || server.isFull()) {
    return false;
  }

  if (server.name.toLowerCase().includes("test")) {
    return false;
  }

  if (loginSession === null) {
    return true;
  }

  const hasActiveMembership =
    typeof loginSession.iUpgDays === "number" && loginSession.iUpgDays >= 0;
  const upgradeOnly = server.isUpgrade() && !hasActiveMembership;
  const chatRestricted = server.data.iChat > 0 && loginSession.bCCOnly === 1;
  const underageNonMember =
    server.data.iChat > 0 &&
    typeof loginSession.iAge === "number" &&
    loginSession.iAge < 13 &&
    !hasActiveMembership;
  const emailUnconfirmed =
    server.data.iLevel > 0 &&
    typeof loginSession.iEmailStatus === "number" &&
    loginSession.iEmailStatus <= 2;

  return !(
    upgradeOnly ||
    chatRestricted ||
    underageNonMember ||
    emailUnconfirmed
  );
};

const findCapturedServer = (
  servers: readonly Server[],
  captured: ServerData,
): Server | undefined => {
  const capturedName = captured.sName.toLowerCase();
  const exact = servers.find(
    (server) => server.name.toLowerCase() === capturedName,
  );

  if (exact !== undefined) {
    return exact;
  }

  return servers.find((server) =>
    server.name.toLowerCase().includes(capturedName),
  );
};

const make = Effect.gen(function* () {
  const auth = yield* Auth;
  const bridge = yield* Bridge;
  const jobs = yield* Jobs;
  const player = yield* Player;
  const settings = yield* Settings;

  const runFork = Effect.runForkWith(yield* Effect.services());
  const stateRef = yield* SynchronizedRef.make<RuntimeState>(initialState());
  const listenersRef = yield* SynchronizedRef.make<
    Set<AutoReloginStateListener>
  >(new Set());

  const addStateListener = (listener: AutoReloginStateListener) =>
    SynchronizedRef.update(listenersRef, (listeners) => {
      listeners.add(listener);
      return listeners;
    });

  const removeStateListener = (listener: AutoReloginStateListener) =>
    SynchronizedRef.update(listenersRef, (listeners) => {
      listeners.delete(listener);
      return listeners;
    });

  const emitState = (state: AutoReloginState) =>
    Effect.gen(function* () {
      const listeners = yield* SynchronizedRef.get(listenersRef);
      if (listeners.size === 0) {
        return;
      }

      yield* Effect.forEach(
        Array.from(listeners),
        (listener, listenerIndex) =>
          Effect.sync(() => listener(state)).pipe(
            Effect.catchCause((cause) =>
              Effect.logError({
                message: "autorelogin listener failed",
                listenerIndex,
                cause,
              }),
            ),
          ),
        { discard: true },
      );
    });

  const getState: AutoReloginShape["getState"] = () =>
    SynchronizedRef.get(stateRef).pipe(Effect.map(toPublicState));

  const emitCurrentState = getState().pipe(Effect.flatMap(emitState));

  const logStage = (stage: string, details?: Record<string, unknown>) =>
    Effect.logInfo({
      message: "autorelogin",
      stage,
      ...(details ?? {}),
    });

  const updateState = (
    update: (state: RuntimeState) => void,
  ): Effect.Effect<AutoReloginState> =>
    Effect.gen(function* () {
      const publicState = yield* SynchronizedRef.modify(stateRef, (state) => {
        update(state);
        return [toPublicState(state), state] as const;
      });
      yield* emitState(publicState);
      return publicState;
    });

  const markFailure = (error: unknown) =>
    Effect.gen(function* () {
      const publicState = yield* updateState((state) => {
        state.lastError = redacted(
          formatReloginError(error),
          state.captured?.password,
        );
        state.attempting = false;
        state.connected = false;
        state.ownedConnectionServerName = undefined;
      });
      yield* Effect.logWarning({
        message: "autorelogin failed",
        error: publicState.lastError,
      });
      return publicState;
    });

  const markSuccess = () =>
    updateState((state) => {
      state.lastError = undefined;
      state.attempting = false;
      state.ownedConnectionServerName = undefined;
    });

  const markReloginSuccess = () =>
    updateState((state) => {
      state.lastError = undefined;
      state.attempting = false;
      state.connected = true;
      state.ownedConnectionServerName = undefined;
      state.loggedOutSince = undefined;
      state.lastAttemptAt = 0;
    });

  const markInterrupted = (interrupt: AutoReloginInterrupted) =>
    markSuccess().pipe(
      Effect.tap(() =>
        Effect.logInfo({
          message: "autorelogin interrupted",
          reason: interrupt.reason,
        }),
      ),
    );

  const clearAttempting = () =>
    updateState((state) => {
      state.attempting = false;
      state.ownedConnectionServerName = undefined;
    });

  const markLoggedIn = () =>
    SynchronizedRef.update(stateRef, (state) => {
      // A ready player closes the disconnect window.
      state.connected = true;
      state.ownedConnectionServerName = undefined;
      state.loggedOutSince = undefined;
      state.lastAttemptAt = 0;
      return state;
    });

  const markLoggedOut = (now: number): Effect.Effect<LogoutObservation> =>
    SynchronizedRef.modify(
      stateRef,
      (state): readonly [LogoutObservation, RuntimeState] => {
        // Keep the first logout timestamp stable across periodic job ticks.
        state.connected = false;
        state.ownedConnectionServerName = undefined;
        if (state.loggedOutSince !== undefined) {
          return [
            { firstObserved: false, loggedOutSince: state.loggedOutSince },
            state,
          ] as const;
        }

        state.loggedOutSince = now;
        state.lastAttemptAt = 0;
        return [{ firstObserved: true, loggedOutSince: now }, state] as const;
      },
    );

  const isPlayerReady = () =>
    player.isReady().pipe(Effect.catchCause(() => Effect.succeed(false)));

  const getInterruptReason = (connectionSeq: number) =>
    Effect.gen(function* () {
      const state = yield* SynchronizedRef.get(stateRef);
      if (!state.enabled) {
        return Option.some("disabled");
      }

      // A new connection means this attempt no longer owns the login flow.
      if (state.connectionSeq !== connectionSeq) {
        return Option.some("connection changed");
      }

      return Option.none<string>();
    });

  const interruptSignal = (connectionSeq: number) =>
    waitFor(getInterruptReason(connectionSeq).pipe(Effect.map(Option.isSome)), {
      schedule: Schedule.spaced("100 millis"),
    }).pipe(
      Effect.flatMap(() => getInterruptReason(connectionSeq)),
      Effect.flatMap((reason) =>
        Option.match(reason, {
          onNone: () => Effect.never,
          onSome: (value) =>
            Effect.fail(new AutoReloginInterrupted({ reason: value })),
        }),
      ),
    );

  const interruptible = <A, E>(
    connectionSeq: number,
    effect: Effect.Effect<A, E>,
  ) => Effect.raceFirst(effect, interruptSignal(connectionSeq));

  const setOwnedConnectionServerName = (serverName: string | undefined) =>
    SynchronizedRef.update(stateRef, (state) => {
      state.ownedConnectionServerName = serverName;
      return state;
    });

  const interruptIfOwnedConnectionChanged = (
    ownedConnectionServerName: string | undefined,
  ) =>
    ownedConnectionServerName === undefined
      ? Effect.void
      : SynchronizedRef.update(stateRef, (state) => {
          const currentServerName = state.captured?.server.sName;
          if (
            currentServerName !== undefined &&
            currentServerName.toLowerCase() !==
              ownedConnectionServerName.toLowerCase()
          ) {
            state.ownedConnectionServerName = undefined;
            state.connectionSeq += 1;
          }
          return state;
        });

  const captureCurrentSession: AutoReloginShape["captureCurrentSession"] = () =>
    Effect.gen(function* () {
      yield* logStage("capture start");
      const loggedIn = yield* bridge
        .call("auth.isLoggedIn")
        .pipe(Effect.catchCause(() => Effect.succeed(false)));
      if (!loggedIn) {
        yield* logStage("capture skipped", { reason: "not logged in" });
        yield* updateState((state) => {
          state.lastError = "not logged in";
        });
        return false;
      }

      // Hydrates Auth's cached credentials and membership flags.
      yield* auth.getLoginSession();

      const [username, password, serverInfo] = yield* Effect.all([
        auth.getUsername(),
        auth.getPassword(),
        bridge.call("flash.getGameObject", ["objServerInfo"]),
      ]);
      const server = parseServerInfo(serverInfo);

      if (username.trim() === "" || password === "" || server === null) {
        yield* logStage("capture skipped", {
          reason: "current session is not capturable",
          hasUsername: username.trim() !== "",
          hasPassword: password !== "",
          hasServer: server !== null,
        });
        yield* updateState((state) => {
          state.lastError = "current session is not capturable";
        });
        return false;
      }

      yield* updateState((state) => {
        state.captured = {
          username,
          password,
          server,
        };
        state.lastError = undefined;
      });

      yield* logStage("capture succeeded", { server: server.sName });
      return true;
    }).pipe(
      Effect.catchCause(() =>
        Effect.gen(function* () {
          yield* Effect.logError({
            message: "autorelogin capture failed",
            error: "failed to capture current session",
          });
          yield* updateState((state) => {
            state.lastError = "failed to capture current session";
          });
          return false;
        }),
      ),
    );

  const waitForServerSelect = waitFor(
    bridge
      .call("flash.getGameObject", ["mcLogin.currentLabel"])
      .pipe(Effect.map((label) => flashStringEquals(label, "Servers"))),
    {
      timeout: SERVER_SELECT_TIMEOUT,
      schedule: Schedule.spaced("100 millis"),
    },
  );

  const waitForServers = waitFor(
    auth.getServers().pipe(Effect.map((servers) => servers.length > 0)),
    {
      timeout: SERVERS_LOAD_TIMEOUT,
      schedule: Schedule.spaced("100 millis"),
    },
  );

  const waitForGameEntry = waitFor(
    Effect.gen(function* () {
      const [label, connStageNull, connText, backButtonVisible] =
        yield* Effect.all([
          bridge.call("flash.getGameObject", ["currentLabel"]),
          bridge.call("flash.isNull", ["mcConnDetail.stage"]),
          bridge.call("flash.getConnMcText"),
          bridge.call("flash.isConnMcBackButtonVisible"),
        ]);

      if (flashStringEquals(label, "Game") && connStageNull) {
        return true;
      }

      // Treat visible connect errors as terminal so the caller can inspect success.
      const normalizedConnText = connText.toLowerCase();
      if (
        connText === "null" ||
        normalizedConnText.includes("server is full") ||
        backButtonVisible
      ) {
        return true;
      }

      return false;
    }),
    {
      timeout: GAME_ENTRY_TIMEOUT,
      schedule: Schedule.spaced("500 millis"),
    },
  );

  const isGameEntrySuccessful = Effect.gen(function* () {
    const [label, connStageNull] = yield* Effect.all([
      bridge.call("flash.getGameObject", ["currentLabel"]),
      bridge.call("flash.isNull", ["mcConnDetail.stage"]),
    ]);
    return flashStringEquals(label, "Game") && connStageNull;
  });

  const reloginRetrySchedule = Schedule.exponential(
    `${MIN_FAILURE_COOLDOWN_MS} millis`,
  ).pipe(
    Schedule.jittered,
    Schedule.modifyDelay((_, delay) =>
      Effect.succeed(
        Duration.min(
          Duration.fromInputUnsafe(delay),
          Duration.millis(MAX_FAILURE_COOLDOWN_MS),
        ),
      ),
    ),
    Schedule.take(MAX_RELOGIN_RETRIES),
  );

  const failAttempt = (message: string, retryable: boolean) =>
    Effect.fail(new AutoReloginAttemptError({ message, retryable }));

  const restoreLoginSettings = (previousSettings: SettingsState) =>
    logStage("temporary settings restore").pipe(
      Effect.andThen(
        settings
          .apply({
            lagKillerEnabled: previousSettings.lagKillerEnabled,
            skipCutscenesEnabled: previousSettings.skipCutscenesEnabled,
          })
          .pipe(
            Effect.catchCause((cause) =>
              Effect.logWarning({
                message: "failed to restore autorelogin settings",
                cause,
              }),
            ),
          ),
      ),
    );

  const withTemporaryLoginSettings = <A, E>(
    effect: Effect.Effect<A, E>,
  ): Effect.Effect<A, E> =>
    Effect.gen(function* () {
      // These Flash settings improve login reliability but are non-critical.
      const previousSettings = yield* settings.getState().pipe(
        Effect.catchCause((cause) =>
          Effect.logWarning({
            message: "failed to read autorelogin settings",
            cause,
          }).pipe(Effect.as(null)),
        ),
      );
      yield* logStage("temporary settings apply");
      yield* settings
        .apply({
          lagKillerEnabled: false,
          skipCutscenesEnabled: false,
        })
        .pipe(
          Effect.catchCause((cause) =>
            Effect.logWarning({
              message: "failed to apply temporary autorelogin settings",
              cause,
            }),
          ),
        );

      return yield* effect.pipe(
        Effect.ensuring(
          previousSettings === null
            ? Effect.void
            : restoreLoginSettings(previousSettings),
        ),
      );
    });

  const performRelogin = (attempt: ReservedAttempt) =>
    withTemporaryLoginSettings(
      interruptible(
        attempt.connectionSeq,
        Effect.gen(function* () {
          const captured = attempt.captured;
          yield* logStage("attempt start", {
            server: captured.server.sName,
            connectionSeq: attempt.connectionSeq,
          });
          yield* logStage("waiting for temporary kick clear");
          const tempKickCleared = yield* waitFor(
            auth
              .isTemporarilyKicked()
              .pipe(Effect.map((temporarilyKicked) => !temporarilyKicked)),
            {
              timeout: TEMP_KICK_TIMEOUT,
              schedule: Schedule.spaced("1 second"),
            },
          );
          if (!tempKickCleared) {
            return yield* failAttempt("temporary kick did not clear", true);
          }

          yield* logStage("login start");
          const loginCompleted = yield* auth
            .login(captured.username, captured.password)
            .pipe(Effect.timeoutOption("15 seconds"));
          if (Option.isNone(loginCompleted)) {
            return yield* failAttempt("login timed out", true);
          }

          yield* logStage("waiting for server select");
          if (!(yield* waitForServerSelect)) {
            return yield* failAttempt("server select did not load", true);
          }

          yield* logStage("waiting for server list");
          if (!(yield* waitForServers)) {
            return yield* failAttempt("servers did not load", true);
          }

          const servers = yield* auth.getServers();
          yield* logStage("server list loaded", { count: servers.length });
          const targetServer = findCapturedServer(servers, captured.server);
          if (targetServer === undefined) {
            return yield* failAttempt(
              `captured server is unavailable: ${captured.server.sName}`,
              false,
            );
          }

          const loginSession = yield* auth
            .getLoginSession()
            .pipe(Effect.catchCause(() => Effect.succeed(null)));
          if (!isServerEligible(targetServer, loginSession)) {
            return yield* failAttempt(
              `captured server is not eligible: ${captured.server.sName}`,
              false,
            );
          }

          // Let Flash finish server-list click handlers before invoking connectTo.
          yield* Effect.sleep("1 second");

          yield* logStage("connect start", { server: targetServer.name });
          yield* setOwnedConnectionServerName(targetServer.name);
          yield* Effect.gen(function* () {
            const didConnect = yield* auth.connectTo(targetServer.name);
            if (!didConnect) {
              return yield* failAttempt(
                `failed to select captured server: ${captured.server.sName}`,
                true,
              );
            }

            yield* logStage("waiting for game entry");
            if (
              !(yield* waitForGameEntry) ||
              !(yield* isGameEntrySuccessful)
            ) {
              return yield* failAttempt("game entry failed", true);
            }

            yield* logStage("waiting for player ready");
            const ready = yield* waitFor(isPlayerReady(), {
              timeout: PLAYER_READY_TIMEOUT,
              schedule: Schedule.spaced("250 millis"),
            });
            if (!ready) {
              return yield* failAttempt("player did not become ready", true);
            }
          }).pipe(Effect.ensuring(setOwnedConnectionServerName(undefined)));
        }),
      ),
    );

  const reserveAttempt = (now: number) =>
    Effect.gen(function* () {
      const skipped = yield* SynchronizedRef.get(stateRef).pipe(
        Effect.map((state) => {
          const waitAnchor = Math.max(
            state.loggedOutSince ?? now,
            state.lastAttemptAt,
          );
          const remainingMs = Math.max(0, waitAnchor + state.delayMs - now);
          return {
            captured: state.captured !== null,
            enabled: state.enabled,
            remainingMs,
          };
        }),
      );

      const attempt = yield* SynchronizedRef.modify(stateRef, (state) => {
        const captured = state.captured;
        // First attempt waits from logout; retries wait from the previous attempt.
        const waitAnchor = Math.max(
          state.loggedOutSince ?? now,
          state.lastAttemptAt,
        );
        const readyForAttempt =
          state.enabled &&
          captured !== null &&
          !state.attempting &&
          state.loggedOutSince !== undefined &&
          now >= waitAnchor + state.delayMs;

        if (!readyForAttempt) {
          return [null, state] as const;
        }

        state.attempting = true;
        state.lastError = undefined;
        state.lastAttemptAt = now;
        return [
          {
            captured,
            connectionSeq: state.connectionSeq,
          },
          state,
        ] as const;
      });

      if (attempt !== null) {
        yield* emitCurrentState;
        yield* logStage("attempt reserved", {
          server: attempt.captured.server.sName,
          connectionSeq: attempt.connectionSeq,
        });
      } else if (
        skipped.enabled &&
        skipped.captured &&
        skipped.remainingMs > 0
      ) {
        yield* logStage("waiting for logout delay", {
          remainingMs: skipped.remainingMs,
        });
      }

      return attempt;
    });

  const runAttemptCycle = Effect.gen(function* () {
    const now = Date.now();
    const ready = yield* isPlayerReady();
    if (ready) {
      yield* markLoggedIn();
      return;
    }

    const connectionState = yield* SynchronizedRef.get(stateRef).pipe(
      Effect.map((state) => ({
        connected: state.connected,
        loggedOutSince: state.loggedOutSince,
      })),
    );
    if (connectionState.connected) {
      return;
    }

    const logoutState =
      connectionState.loggedOutSince === undefined
        ? yield* markLoggedOut(now)
        : {
            firstObserved: false,
            loggedOutSince: connectionState.loggedOutSince,
          };
    if (logoutState.firstObserved) {
      yield* logStage("logged out observed", {
        delayMs: (yield* getState()).delayMs,
      });
    }

    const attempt = yield* reserveAttempt(now);
    if (attempt === null) {
      return;
    }

    yield* interruptible(
      attempt.connectionSeq,
      performRelogin(attempt).pipe(
        Effect.retry({
          schedule: reloginRetrySchedule,
          while: (error) =>
            error instanceof AutoReloginAttemptError && error.retryable,
        }),
      ),
    ).pipe(
      Effect.matchEffect({
        onFailure: (error) =>
          error instanceof AutoReloginInterrupted
            ? markInterrupted(error).pipe(Effect.asVoid)
            : markFailure(error).pipe(Effect.asVoid),
        onSuccess: () =>
          logStage("attempt succeeded").pipe(
            Effect.andThen(markReloginSuccess()),
            Effect.asVoid,
          ),
      }),
    );
  }).pipe(
    Effect.catchCause(() =>
      Effect.gen(function* () {
        yield* clearAttempting();
        yield* Effect.logError({
          message: "autorelogin task crashed",
          error: "unexpected task failure",
        });
      }),
    ),
  );

  const startJob = jobs.startPeriodicJob({
    key: JOB_KEY,
    interval: JOB_INTERVAL,
    // Internal connection tracking filters out false positives from player readiness.
    runWhen: "loggedOut",
    runOnStart: false,
    replace: false,
    task: runAttemptCycle,
  });

  const stopJob = jobs.stop(JOB_KEY);

  const enable: AutoReloginShape["enable"] = () =>
    Effect.gen(function* () {
      yield* logStage("enable");
      yield* updateState((state) => {
        state.enabled = true;
        state.lastError = undefined;
      });
      yield* captureCurrentSession();
      yield* startJob;
      return yield* getState();
    });

  const disable: AutoReloginShape["disable"] = () =>
    Effect.gen(function* () {
      yield* logStage("disable");
      yield* stopJob;
      return yield* updateState((state) => {
        state.enabled = false;
        state.attempting = false;
        state.ownedConnectionServerName = undefined;
        state.lastError = undefined;
      });
    });

  const setDelayMs: AutoReloginShape["setDelayMs"] = (delayMs) =>
    Effect.gen(function* () {
      const normalizedDelayMs = normalizeDelayMs(delayMs);
      yield* logStage("set delay", { delayMs: normalizedDelayMs });
      return yield* updateState((state) => {
        state.delayMs = normalizedDelayMs;
      });
    });

  const onState: AutoReloginShape["onState"] = (listener, options) =>
    Effect.gen(function* () {
      yield* addStateListener(listener);

      if (options?.emitCurrent ?? true) {
        yield* getState().pipe(
          Effect.flatMap((state) => Effect.sync(() => listener(state))),
          Effect.catchCause((cause) =>
            removeStateListener(listener).pipe(
              Effect.andThen(Effect.failCause(cause)),
            ),
          ),
        );
      }

      return () => {
        runFork(removeStateListener(listener));
      };
    });

  const disposeConnection = yield* bridge.onConnection((status) => {
    if (status === "OnConnection") {
      runFork(
        SynchronizedRef.modify(stateRef, (state) => {
          const ownedConnectionServerName = state.ownedConnectionServerName;
          // objServerInfo is refreshed after SmartFox connects.
          state.loggedOutSince = undefined;
          state.lastAttemptAt = 0;
          state.connected = true;
          if (ownedConnectionServerName === undefined) {
            state.connectionSeq += 1;
          }
          return [ownedConnectionServerName, state] as const;
        }).pipe(
          Effect.tap(() => logStage("connection observed")),
          Effect.flatMap((ownedConnectionServerName) =>
            captureCurrentSession().pipe(
              Effect.andThen(
                interruptIfOwnedConnectionChanged(ownedConnectionServerName),
              ),
            ),
          ),
          Effect.asVoid,
        ),
      );
    } else if (status === "OnConnectionLost") {
      runFork(
        // Anchor delayMs at the disconnect event, not the next job tick.
        markLoggedOut(Date.now()).pipe(
          Effect.tap((logoutState) =>
            logoutState.firstObserved
              ? SynchronizedRef.get(stateRef).pipe(
                  Effect.flatMap((state) =>
                    logStage("logged out observed", { delayMs: state.delayMs }),
                  ),
                )
              : Effect.void,
          ),
          Effect.asVoid,
        ),
      );
    }
  });

  yield* Effect.addFinalizer(() =>
    Effect.gen(function* () {
      disposeConnection();
      yield* stopJob.pipe(Effect.asVoid);
    }),
  );

  return {
    getState,
    onState,
    enable,
    disable,
    setDelayMs,
    captureCurrentSession,
  } satisfies AutoReloginShape;
});

export const AutoReloginLive = Layer.effect(AutoRelogin, make);

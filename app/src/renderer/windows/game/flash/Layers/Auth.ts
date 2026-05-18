import { Server, type ServerData } from "@vexed/game";
import { Effect, Layer, Option, Schedule, SynchronizedRef } from "effect";
import type {
  AuthConnectFailureStatus,
  AuthConnectOutcome,
  AuthShape,
} from "../Services/Auth";
import { Auth } from "../Services/Auth";
import { Bridge } from "../Services/Bridge";
import { SwfCallError } from "../Errors";
import type {
  ConnectToSelectionResult,
  ConnectToSelectionStatus,
  LoginCredentials,
  LoginSession,
  LoginSessionPayload,
} from "../Types";
import { waitFor } from "../../utils/waitFor";

const CONNECT_TO_TIMEOUT = "15 seconds";
const LOGIN_READY_TIMEOUT = "15 seconds";
const LOGIN_CALL_RETRIES = 12;

const flashJsonError = (method: string, cause: unknown) =>
  new SwfCallError({ method, cause });

const invalidLoginJsonError = (cause: string) =>
  new SwfCallError({ method: "auth.getLoginSession", cause });

const parseJson = (
  method: string,
  value: string,
): Effect.Effect<unknown, SwfCallError> =>
  Effect.try({
    try: () => JSON.parse(value) as unknown,
    catch: (cause) => flashJsonError(method, cause),
  });

const optionalNumber = (
  record: Record<string, unknown>,
  key: string,
): Effect.Effect<number | undefined, SwfCallError> => {
  const value = record[key];
  if (value === undefined) {
    return Effect.sync((): number | undefined => undefined);
  }

  return typeof value === "number" && Number.isFinite(value)
    ? Effect.succeed(value)
    : Effect.fail(invalidLoginJsonError(`${key} must be a number`));
};

const optionalString = (
  record: Record<string, unknown>,
  key: string,
): Effect.Effect<string | undefined, SwfCallError> => {
  const value = record[key];
  if (value === undefined) {
    return Effect.sync((): string | undefined => undefined);
  }

  return typeof value === "string"
    ? Effect.succeed(value)
    : Effect.fail(invalidLoginJsonError(`${key} must be a string`));
};

const requiredString = (
  record: Record<string, unknown>,
  key: string,
): Effect.Effect<string, SwfCallError> => {
  const value = record[key];
  return typeof value === "string"
    ? Effect.succeed(value)
    : Effect.fail(invalidLoginJsonError(`${key} must be a string`));
};

const isServerData = (value: unknown): value is ServerData => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value["bOnline"] === "number" &&
    typeof value["bUpg"] === "number" &&
    typeof value["iChat"] === "number" &&
    typeof value["iCount"] === "number" &&
    typeof value["iLevel"] === "number" &&
    typeof value["iMax"] === "number" &&
    typeof value["iPort"] === "number" &&
    typeof value["sIP"] === "string" &&
    typeof value["sLang"] === "string" &&
    typeof value["sName"] === "string"
  );
};

const parseLoginSessionPayload = (
  value: unknown,
): Effect.Effect<LoginSessionPayload, SwfCallError> =>
  Effect.gen(function* () {
    if (!isRecord(value)) {
      return yield* invalidLoginJsonError("objLogin must be an object");
    }

    const servers = value["servers"];
    const bCCOnly = yield* optionalNumber(value, "bCCOnly");
    const bSuccess = yield* optionalNumber(value, "bSuccess");
    const iAccess = yield* optionalNumber(value, "iAccess");
    const iAge = yield* optionalNumber(value, "iAge");
    const iEmailStatus = yield* optionalNumber(value, "iEmailStatus");
    const iUpg = yield* optionalNumber(value, "iUpg");
    const iUpgDays = yield* optionalNumber(value, "iUpgDays");
    const sToken = yield* optionalString(value, "sToken");
    const unm = yield* optionalString(value, "unm");

    return {
      ...(bCCOnly === undefined ? {} : { bCCOnly }),
      ...(bSuccess === undefined ? {} : { bSuccess }),
      ...(iAccess === undefined ? {} : { iAccess }),
      ...(iAge === undefined ? {} : { iAge }),
      ...(iEmailStatus === undefined ? {} : { iEmailStatus }),
      ...(iUpg === undefined ? {} : { iUpg }),
      ...(iUpgDays === undefined ? {} : { iUpgDays }),
      ...(sToken === undefined ? {} : { sToken }),
      ...(Array.isArray(servers)
        ? { servers: servers.filter(isServerData) }
        : {}),
      ...(unm === undefined ? {} : { unm }),
    };
  });

const parseLoginCredentials = (
  value: unknown,
): Effect.Effect<LoginCredentials, SwfCallError> =>
  Effect.gen(function* () {
    if (!isRecord(value)) {
      return yield* invalidLoginJsonError("loginInfo must be an object");
    }

    const strToken = yield* optionalString(value, "strToken");
    return {
      strPassword: yield* requiredString(value, "strPassword"),
      ...(strToken === undefined ? {} : { strToken }),
      strUsername: yield* requiredString(value, "strUsername"),
    };
  });

const normalizeLoginSession = (
  loginSession: LoginSessionPayload,
  loginCredentials: LoginCredentials,
): Effect.Effect<LoginSession, SwfCallError> =>
  Effect.gen(function* () {
    const username = (loginSession.unm ?? loginCredentials.strUsername).trim();
    if (username === "") {
      return yield* invalidLoginJsonError("missing login username");
    }

    const password = loginCredentials.strPassword;
    if (password === "") {
      return yield* invalidLoginJsonError("missing login password");
    }

    const normalized = {
      ...loginSession,
      bSuccess: loginSession.bSuccess ?? 0,
      iUpg: loginSession.iUpg ?? 0,
      servers: loginSession.servers ?? [],
      sToken: loginSession.sToken ?? loginCredentials.strToken ?? "",
      unm: username,
    };

    return normalized;
  });

type RuntimeState = {
  readonly servers: Map<string, Server>;
  username: string;
  password: string;
  loginSession: LoginSession | undefined;
  connectionFailureSeq: number;
};

const initialState = (): RuntimeState => ({
  servers: new Map<string, Server>(),
  username: "",
  password: "",
  loginSession: undefined,
  connectionFailureSeq: 0,
});

const clearSession = (state: RuntimeState): RuntimeState => {
  state.username = "";
  state.password = "";
  state.loginSession = undefined;
  return state;
};

const connectToSelectionStatuses: ReadonlySet<string> = new Set([
  "selected",
  "not-ready",
  "offline",
  "full",
  "member-only",
  "chat-restricted",
  "underage-chat",
  "email-unconfirmed",
  "test-client-required",
  "not-found",
] satisfies ConnectToSelectionStatus[]);

const nonRetryableSelectionStatuses: ReadonlySet<ConnectToSelectionStatus> =
  new Set([
    "member-only",
    "chat-restricted",
    "underage-chat",
    "email-unconfirmed",
    "test-client-required",
    "not-found",
  ]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isConnectToSelectionStatus = (
  value: unknown,
): value is ConnectToSelectionStatus =>
  typeof value === "string" && connectToSelectionStatuses.has(value);

const parseConnectToSelectionResult = (
  value: unknown,
  requestedServer: string,
): ConnectToSelectionResult => {
  if (value === true) {
    return {
      status: "selected",
      message: "server selected",
      serverName: requestedServer,
    };
  }

  if (value === false) {
    return { status: "not-found", message: "server was not found" };
  }

  if (!isRecord(value) || !isConnectToSelectionStatus(value["status"])) {
    return {
      status: "not-ready",
      message: "invalid server selection response",
    };
  }

  const message =
    typeof value["message"] === "string"
      ? value["message"]
      : "server selection failed";
  const serverName =
    typeof value["serverName"] === "string" ? value["serverName"] : undefined;

  return {
    status: value["status"],
    message,
    ...(serverName === undefined ? {} : { serverName }),
  };
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

const serverNameFields = (serverName: string | undefined) =>
  serverName === undefined || serverName === "" ? {} : { serverName };

const connectedOutcome = (
  serverName: string | undefined,
): AuthConnectOutcome => ({
  status: "connected",
  message: "connected",
  retryable: false,
  ...serverNameFields(serverName),
});

const connectFailure = (
  status: AuthConnectFailureStatus,
  message: string,
  retryable: boolean,
  serverName: string | undefined,
): AuthConnectOutcome => ({
  status,
  message,
  retryable,
  ...serverNameFields(serverName),
});

const selectionToOutcome = (
  selection: ConnectToSelectionResult,
): AuthConnectOutcome => {
  if (selection.status === "selected") {
    return connectedOutcome(selection.serverName);
  }

  return connectFailure(
    selection.status,
    selection.message,
    !nonRetryableSelectionStatuses.has(selection.status),
    selection.serverName,
  );
};

const connectErrorMessage = (connText: string): string => {
  const decoded = decodeFlashValue(connText);
  return typeof decoded === "string" && decoded !== "null"
    ? decoded.trim()
    : "";
};

const make = Effect.gen(function* () {
  const bridge = yield* Bridge;
  const stateRef = yield* SynchronizedRef.make(initialState());
  const runFork = Effect.runForkWith(yield* Effect.services());

  const clearSessionState = SynchronizedRef.update(stateRef, clearSession);

  const observeConnectOutcome = (
    initialConnectionFailureSeq: number,
    selection: ConnectToSelectionResult,
  ) =>
    Effect.gen(function* () {
      const [label, connStageNull, connText, backButtonVisible, state] =
        yield* Effect.all([
          bridge.call("flash.getGameObject", ["currentLabel"]),
          bridge.call("flash.isNull", ["mcConnDetail.stage"]),
          bridge.call("flash.getConnMcText"),
          bridge.call("flash.isConnMcBackButtonVisible"),
          SynchronizedRef.get(stateRef),
        ]);

      const serverName = selection.serverName;
      if (state.connectionFailureSeq > initialConnectionFailureSeq) {
        return connectFailure(
          "connection-failed",
          "connection failed",
          true,
          serverName,
        );
      }

      if (flashStringEquals(label, "Game") && connStageNull) {
        return connectedOutcome(serverName);
      }

      const message = connectErrorMessage(connText);
      if (message.toLowerCase().includes("server is full")) {
        return connectFailure("full", "server is full", true, serverName);
      }

      if (backButtonVisible) {
        return connectFailure(
          "connection-error",
          message === "" ? "connection failed" : message,
          true,
          serverName,
        );
      }

      return null;
    });

  const waitForConnectOutcome = (
    initialConnectionFailureSeq: number,
    selection: ConnectToSelectionResult,
  ) =>
    Effect.gen(function* () {
      const completed = yield* observeConnectOutcome(
        initialConnectionFailureSeq,
        selection,
      ).pipe(
        Effect.repeat({
          until: (outcome) => outcome !== null,
          schedule: Schedule.passthrough<
            number,
            AuthConnectOutcome | null,
            never,
            never
          >(Schedule.spaced("250 millis")),
        }),
        Effect.timeoutOption(CONNECT_TO_TIMEOUT),
      );

      if (Option.isNone(completed)) {
        return connectFailure(
          "timeout",
          "timed out connecting to server",
          true,
          selection.serverName,
        );
      }

      return (
        completed.value ??
        connectFailure(
          "timeout",
          "timed out connecting to server",
          true,
          selection.serverName,
        )
      );
    });

  const connectTo: AuthShape["connectTo"] = (server) =>
    Effect.gen(function* () {
      const rawSelection = yield* bridge.call("auth.connectTo", [server]);
      const selection = parseConnectToSelectionResult(rawSelection, server);

      if (selection.status !== "selected") {
        return selectionToOutcome(selection);
      }

      const initialConnectionFailureSeq = (yield* SynchronizedRef.get(stateRef))
        .connectionFailureSeq;
      return yield* waitForConnectOutcome(
        initialConnectionFailureSeq,
        selection,
      );
    });

  const getServers: AuthShape["getServers"] = () =>
    SynchronizedRef.modifyEffect(stateRef, (state) =>
      Effect.map(bridge.call("auth.getServers"), (ogServers) => {
        const rawServers = Array.isArray(ogServers)
          ? (ogServers as ServerData[])
          : [];
        const nextKeys = new Set(rawServers.map((s) => s.sName));

        for (const key of state.servers.keys()) {
          if (!nextKeys.has(key)) {
            state.servers.delete(key);
          }
        }

        const servers = rawServers.map((server) => {
          const existing = state.servers.get(server.sName);
          if (existing) {
            existing.data = server;
            return existing;
          }

          const model = new Server(server);
          state.servers.set(server.sName, model);
          return model;
        });

        return [servers, state] as const;
      }),
    );

  const getUsername: AuthShape["getUsername"] = () =>
    SynchronizedRef.get(stateRef).pipe(Effect.map((state) => state.username));

  const getPassword: AuthShape["getPassword"] = () =>
    SynchronizedRef.get(stateRef).pipe(Effect.map((state) => state.password));

  // Account credentials, initial server info, and other account-related metadata
  const getLoginSession: AuthShape["getLoginSession"] = () =>
    SynchronizedRef.modifyEffect(stateRef, (state) => {
      if (state.loginSession !== undefined) {
        return Effect.succeed([state.loginSession, state] as const);
      }

      return Effect.gen(function* () {
        const [loginResponseStr, loginCredentialsStr] = yield* Effect.all([
          bridge.call("flash.getGameObjectS", ["objLogin"]),
          bridge.call("flash.getGameObjectS", ["loginInfo"]),
        ]);

        const loginSessionPayload = yield* parseJson(
          "flash.getGameObjectS(objLogin)",
          loginResponseStr,
        ).pipe(Effect.flatMap(parseLoginSessionPayload));
        const loginCredentials = yield* parseJson(
          "flash.getGameObjectS(loginInfo)",
          loginCredentialsStr,
        ).pipe(Effect.flatMap(parseLoginCredentials));
        const loginSession = yield* normalizeLoginSession(
          loginSessionPayload,
          loginCredentials,
        );

        state.loginSession = loginSession;
        state.username = loginSession.unm;
        state.password = loginCredentials.strPassword;
        return [loginSession, state] as const;
      });
    });

  const isLoggedIn: AuthShape["isLoggedIn"] = () =>
    SynchronizedRef.get(stateRef).pipe(
      Effect.map((state) => state.loginSession !== undefined),
    );

  const isTemporarilyKicked: AuthShape["isTemporarilyKicked"] = () =>
    bridge.call("auth.isTemporarilyKicked");

  const login: AuthShape["login"] = (username, password) =>
    Effect.gen(function* () {
      if (yield* isLoggedIn()) {
        yield* logout();
      }
      yield* clearSessionState;
      yield* Effect.sleep("1 second");
      const loginReady = yield* waitFor(
        bridge.call("flash.getGameObject", ["mcLogin.currentLabel"]).pipe(
          Effect.map(
            (label) =>
              typeof label === "string" && !flashStringEquals(label, "Init"),
          ),
          Effect.catchTag("SwfCallError", () => Effect.succeed(false)),
        ),
        {
          timeout: LOGIN_READY_TIMEOUT,
          schedule: Schedule.spaced("100 millis"),
        },
      );
      if (!loginReady) {
        return yield* new SwfCallError({
          method: "auth.login",
          cause: "login form did not become ready",
        });
      }

      return yield* bridge.call("auth.login", [username, password]).pipe(
        Effect.retry({
          schedule: Schedule.spaced("250 millis").pipe(
            Schedule.take(LOGIN_CALL_RETRIES),
          ),
          while: (error) => error instanceof SwfCallError,
        }),
      );
    });

  const logout: AuthShape["logout"] = () =>
    bridge.call("auth.logout").pipe(Effect.ensuring(clearSessionState));

  const dispose = yield* bridge.onConnection((status) => {
    if (status === "OnConnection") {
      runFork(getLoginSession().pipe(Effect.asVoid));
    } else if (status === "OnConnectionFailed") {
      runFork(
        SynchronizedRef.update(stateRef, (state) => {
          state.connectionFailureSeq += 1;
          return state;
        }),
      );
    } else if (status === "OnConnectionLost") {
      runFork(clearSessionState);
    }
  });

  yield* Effect.addFinalizer(() => Effect.sync(dispose));

  return {
    connectTo,
    getServers,
    getUsername,
    getPassword,
    getLoginSession,
    isLoggedIn,
    isTemporarilyKicked,
    login,
    logout,
  } satisfies AuthShape;
});

export const AuthLive = Layer.effect(Auth, make);

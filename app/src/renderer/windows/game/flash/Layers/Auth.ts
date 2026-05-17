import { Server, type ServerData } from "@vexed/game";
import { Effect, Layer, Option, Schedule, Schema, SynchronizedRef } from "effect";
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
  LoginSession,
} from "../Types";
import { waitFor } from "../../utils/waitFor";

const CONNECT_TO_TIMEOUT = "15 seconds";

const ServerDataSchema = Schema.Struct({
  bOnline: Schema.Number,
  bUpg: Schema.Number,
  iChat: Schema.Number,
  iCount: Schema.Number,
  iLevel: Schema.Number,
  iMax: Schema.Number,
  iPort: Schema.Number,
  sIP: Schema.String,
  sLang: Schema.String,
  sName: Schema.String,
});

const LoginSessionSchema = Schema.Struct({
  servers: Schema.mutable(Schema.Array(ServerDataSchema)),
  bSuccess: Schema.Number,
  bCCOnly: Schema.optionalKey(Schema.Number),
  iAccess: Schema.optionalKey(Schema.Number),
  iAge: Schema.optionalKey(Schema.Number),
  iEmailStatus: Schema.optionalKey(Schema.Number),
  iUpg: Schema.Number,
  iUpgDays: Schema.optionalKey(Schema.Number),
  unm: Schema.String,
  sToken: Schema.String,
});

const LoginCredentialsSchema = Schema.Struct({
  strUsername: Schema.String,
  strPassword: Schema.String,
  strToken: Schema.String,
});

const decodeLoginSession = Schema.decodeUnknownEffect(
  Schema.fromJsonString(LoginSessionSchema),
);

const decodeLoginCredentials = Schema.decodeUnknownEffect(
  Schema.fromJsonString(LoginCredentialsSchema),
);

const flashJsonError = (method: string, cause: unknown) =>
  new SwfCallError({ method, cause });

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
          >(
            Schedule.spaced("250 millis"),
          ),
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

        const loginSession = yield* decodeLoginSession(loginResponseStr).pipe(
          Effect.mapError((cause) =>
            flashJsonError("flash.getGameObjectS(objLogin)", cause),
          ),
        );
        const loginCredentials = yield* decodeLoginCredentials(
          loginCredentialsStr,
        ).pipe(
          Effect.mapError((cause) =>
            flashJsonError("flash.getGameObjectS(loginInfo)", cause),
          ),
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
      yield* waitFor(
        Effect.gen(function* () {
          const label = yield* bridge.call("flash.getGameObject", [
            "mcLogin.currentLabel",
          ]);
          return label !== "Init";
        }),
        { schedule: Schedule.spaced("100 millis") },
      );
      return yield* bridge.call("auth.login", [username, password]);
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

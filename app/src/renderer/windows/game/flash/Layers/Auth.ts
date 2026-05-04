import { Server, type ServerData } from "@vexed/game";
import { Effect, Layer, Schedule, SynchronizedRef } from "effect";
import type { AuthShape } from "../Services/Auth";
import { Auth } from "../Services/Auth";
import { Bridge } from "../Services/Bridge";
import type { LoginSession, LoginCredentials } from "../Types";
import { waitFor } from "../../utils/waitFor";

type RuntimeState = {
  readonly servers: Map<string, Server>;
  username: string;
  password: string;
  loginSession: LoginSession | undefined;
};

const initialState = (): RuntimeState => ({
  servers: new Map<string, Server>(),
  username: "",
  password: "",
  loginSession: undefined,
});

const clearSession = (state: RuntimeState): RuntimeState => {
  state.username = "";
  state.password = "";
  state.loginSession = undefined;
  return state;
};

const make = Effect.gen(function* () {
  const bridge = yield* Bridge;
  const stateRef = yield* SynchronizedRef.make(initialState());
  const runFork = Effect.runForkWith(yield* Effect.services());

  const clearSessionState = SynchronizedRef.update(stateRef, clearSession);

  const connectTo: AuthShape["connectTo"] = (server) =>
    bridge.call("auth.connectTo", [server]);

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

        const loginSession = JSON.parse(loginResponseStr) as LoginSession;
        const loginCredentials = JSON.parse(
          loginCredentialsStr,
        ) as LoginCredentials;

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

import { Server, type ServerData } from "@vexed/game";
import { Effect, Layer, SynchronizedRef } from "effect";
import type { AuthShape } from "../Services/Auth";
import { Auth } from "../Services/Auth";
import { Bridge } from "../Services/Bridge";
import type { LoginInfo } from "../Types";

type RuntimeState = {
  readonly servers: Map<string, Server>;
  username: string;
  password: string;
  loginInfo: LoginInfo | undefined;
};

const initialState = (): RuntimeState => ({
  servers: new Map<string, Server>(),
  username: "",
  password: "",
  loginInfo: undefined,
});

const clearSession = (state: RuntimeState): RuntimeState => {
  state.username = "";
  state.password = "";
  state.loginInfo = undefined;
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
    SynchronizedRef.modifyEffect(stateRef, (state) => {
      if (state.username !== "") {
        return Effect.succeed([state.username, state] as const);
      }

      return Effect.map(
        bridge.call("flash.getGameObjectS", ["loginInfo.strUsername"]),
        (username) => {
          state.username = username;
          return [username, state] as const;
        },
      );
    });

  const getPassword: AuthShape["getPassword"] = () =>
    SynchronizedRef.get(stateRef).pipe(Effect.map((state) => state.password));

  // Account credentials, initial server info, and other account-related metadata
  const getLoginInfo: AuthShape["getLoginInfo"] = () =>
    SynchronizedRef.modifyEffect(stateRef, (state) => {
      if (state.loginInfo !== undefined) {
        return Effect.succeed([state.loginInfo, state] as const);
      }

      return Effect.map(bridge.call("flash.getGameObjectS", ["objLogin"]), (info) => {
        const loginInfo = JSON.parse(info) as LoginInfo;
        state.loginInfo = loginInfo;
        state.username = (loginInfo?.unm ?? "").toLowerCase();
        state.password = (loginInfo?.sToken ?? "").toLowerCase();
        return [loginInfo, state] as const;
      });
    });

  const isLoggedIn: AuthShape["isLoggedIn"] = () =>
    SynchronizedRef.get(stateRef).pipe(
      Effect.map((state) => state.loginInfo !== undefined),
    );

  const isTemporarilyKicked: AuthShape["isTemporarilyKicked"] = () =>
    bridge.call("auth.isTemporarilyKicked");

  const login: AuthShape["login"] = (username, password) =>
    Effect.gen(function* () {
      yield* clearSessionState;
      yield* bridge.call("flash.callGameFunction", ["removeAllChildren"]);
      yield* bridge.call("flash.callGameFunction", ["gotoAndPlay", "login"]);
      return yield* bridge.call("auth.login", [username, password]);
    });

  const logout: AuthShape["logout"] = () =>
    bridge.call("auth.logout").pipe(Effect.ensuring(clearSessionState));

  const dispose = yield* bridge.onConnection((status) => {
    if (status === "OnConnection") {
      runFork(getLoginInfo().pipe(Effect.asVoid));
    } else if (status === "OnConnectionLost") {
      runFork(clearSessionState);
    }
  });

  yield* Effect.addFinalizer(() =>
    Effect.sync(() => {
      dispose();
    }),
  );

  return {
    connectTo,
    getServers,
    getUsername,
    getPassword,
    getLoginInfo,
    isLoggedIn,
    isTemporarilyKicked,
    login,
    logout,
  } satisfies AuthShape;
});

export const AuthLive = Layer.effect(Auth, make);

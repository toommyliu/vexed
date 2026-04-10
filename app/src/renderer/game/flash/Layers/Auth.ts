import { Server, type ServerData } from "@vexed/game";
import { Effect, Layer } from "effect";
import type { AuthShape } from "../Services/Auth";
import { Auth } from "../Services/Auth";
import { Bridge } from "../Services/Bridge";
import type { LoginInfo } from "../Types";
import { runtime } from "../runtime";

const make = Effect.gen(function* () {
  const bridge = yield* Bridge;

  const _servers = new Map<string, Server>();
  let _username = "";
  let _password = "";
  let _loginInfo: LoginInfo | undefined = undefined;

  const clearSession = () => {
    _username = "";
    _password = "";
    _loginInfo = undefined;
  };

  const dispose = yield* bridge.onConnection(async (status) => {
    await runtime.runPromise(
      Effect.gen(function* () {
        if (status === "OnConnection") {
          yield* getLoginInfo();
        } else if (status === "OnConnectionLost") {
          clearSession();
        }
      }),
    );
  });

  yield* Effect.addFinalizer(() =>
    Effect.sync(() => {
      dispose();
    }),
  );

  const connectTo = (server: string) => bridge.call("auth.connectTo", [server]);

  const getServers = () =>
    Effect.map(bridge.call("auth.getServers"), (ogServers) => {
      const rawServers = Array.isArray(ogServers)
        ? (ogServers as ServerData[])
        : [];
      const nextKeys = new Set(rawServers.map((s) => s.sName));

      // Remove stale servers
      for (const key of _servers.keys()) {
        if (!nextKeys.has(key)) _servers.delete(key);
      }

      return rawServers.map((server) => {
        const existing = _servers.get(server.sName);
        if (existing) {
          existing.data = server;
          return existing;
        }

        const model = new Server(server);
        _servers.set(server.sName, model);
        return model;
      });
    });

  const getUsername = () => {
    if (_username !== "") {
      return Effect.succeed(_username);
    }

    return Effect.tap(
      bridge.call("flash.getGameObjectS", ["loginInfo.strUsername"]),
      (username) =>
        Effect.sync(() => {
          _username = username;
        }),
    );
  };

  const getPassword = () => Effect.succeed(_password);

  const getLoginInfo = () => {
    if (_loginInfo !== undefined) {
      return Effect.succeed(_loginInfo);
    }

    return Effect.tap(
      bridge.call("flash.getGameObjectS", ["objLogin"]),
      (info) =>
        Effect.sync(() => {
          _loginInfo = JSON.parse(info) as LoginInfo;
          _username = (_loginInfo?.unm ?? "").toLowerCase();
          _password = (_loginInfo?.sToken ?? "").toLowerCase();
        }),
    );
  };

  const isLoggedIn = () => Effect.succeed(_loginInfo !== undefined);

  const isTemporarilyKicked = () => bridge.call("auth.isTemporarilyKicked");

  const login = (username: string, password: string) =>
    Effect.gen(function* () {
      yield* Effect.sync(() => {
        clearSession();
      });
      yield* bridge.call("flash.callGameFunction", ["removeAllChildren"]);
      yield* bridge.call("flash.callGameFunction", ["gotoAndPlay", "login"]);
      return yield* bridge.call("auth.login", [username, password]);
    });

  const logout = () =>
    bridge.call("auth.logout").pipe(
      Effect.ensuring(
        Effect.sync(() => {
          clearSession();
        }),
      ),
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

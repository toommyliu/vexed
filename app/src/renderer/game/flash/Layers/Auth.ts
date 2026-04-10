import { Effect, Layer } from "effect";
import { Auth } from "../Services/Auth";
import type { AuthShape } from "../Services/Auth";
import { Bridge } from "../Services/Bridge";

const make = Effect.gen(function* () {
  const bridge = yield* Bridge;

  return {
    connectTo: (server: string) => bridge.call("auth.connectTo", [server]),
    getServers: () => bridge.call("auth.getServers"),
    isLoggedIn: () => bridge.call("auth.isLoggedIn"),
    isTemporarilyKicked: () => bridge.call("auth.isTemporarilyKicked"),
    login: (username: string, password: string) =>
      bridge.call("auth.login", [username, password]),
    logout: () => bridge.call("auth.logout"),
  } satisfies AuthShape;
});

export const AuthLive = Layer.effect(Auth, make);

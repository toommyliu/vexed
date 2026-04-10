import { ServiceMap } from "effect";
import type { BridgeEffect } from "./Bridge";

export interface AuthShape {
  connectTo(server: string): BridgeEffect<boolean>;
  getServers(): BridgeEffect<unknown[]>;
  isLoggedIn(): BridgeEffect<boolean>;
  isTemporarilyKicked(): BridgeEffect<boolean>;
  login(username: string, password: string): BridgeEffect<void>;
  logout(): BridgeEffect<void>;
}

export class Auth extends ServiceMap.Service<Auth, AuthShape>()(
  "flash/Services/Auth",
) {}

import { ServiceMap } from "effect";
import type { BridgeEffect } from "./Bridge";
import type { Server } from "@vexed/game";
import type { LoginInfo } from "../Types";

export interface AuthShape {
  connectTo(server: string): BridgeEffect<boolean>;
  getServers(): BridgeEffect<Server[]>;
  getUsername(): BridgeEffect<string>;
  getPassword(): BridgeEffect<string>;
  getLoginInfo(): BridgeEffect<LoginInfo>;
  isLoggedIn(): BridgeEffect<boolean>;
  isTemporarilyKicked(): BridgeEffect<boolean>;
  login(username: string, password: string): BridgeEffect<void>;
  logout(): BridgeEffect<void>;
}

export class Auth extends ServiceMap.Service<Auth, AuthShape>()(
  "flash/Services/Auth",
) {}

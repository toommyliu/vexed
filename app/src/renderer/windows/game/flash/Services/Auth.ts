import { ServiceMap } from "effect";
import type { BridgeEffect } from "./Bridge";
import type { Server } from "@vexed/game";
import type { ConnectToSelectionStatus, LoginSession } from "../Types";

export type AuthConnectFailureStatus =
  | Exclude<ConnectToSelectionStatus, "selected">
  | "connection-failed"
  | "connection-error"
  | "timeout";

export type AuthConnectOutcome =
  | {
      readonly status: "connected";
      readonly message: string;
      readonly retryable: false;
      readonly serverName?: string;
    }
  | {
      readonly status: AuthConnectFailureStatus;
      readonly message: string;
      readonly retryable: boolean;
      readonly serverName?: string;
    };

export interface AuthShape {
  connectTo(server: string): BridgeEffect<AuthConnectOutcome>;
  getServers(): BridgeEffect<Server[]>;
  getUsername(): BridgeEffect<string>;
  getPassword(): BridgeEffect<string>;
  getLoginSession(): BridgeEffect<LoginSession>;
  isLoggedIn(): BridgeEffect<boolean>;
  isTemporarilyKicked(): BridgeEffect<boolean>;
  login(username: string, password: string): BridgeEffect<void>;
  logout(): BridgeEffect<void>;
}

export class Auth extends ServiceMap.Service<Auth, AuthShape>()(
  "flash/Services/Auth",
) {}

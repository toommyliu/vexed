import { Effect, ServiceMap } from "effect";

export interface AutoReloginState {
  readonly enabled: boolean;
  readonly captured: boolean;
  readonly attempting: boolean;
  readonly waitingDelay: boolean;
  readonly username?: string;
  readonly server?: string;
  readonly delayMs: number;
  readonly lastError?: string;
  readonly attemptsRemaining?: number;
}

export type AutoReloginStateDisposer = () => void;

export type AutoReloginStateListener = (state: AutoReloginState) => void;

export interface AutoReloginStateSubscriptionOptions {
  readonly emitCurrent?: boolean;
}

export interface AutoLoginCredentials {
  readonly username: string;
  readonly password: string;
  readonly server?: string;
}

export type AutoLoginOutcome =
  | {
      readonly stage: "server-select";
    }
  | {
      readonly stage: "player-ready";
    };

export interface AutoReloginShape {
  getState(): Effect.Effect<AutoReloginState>;
  isEnabled(): Effect.Effect<boolean>;
  getDelay(): Effect.Effect<number>;
  getServer(): Effect.Effect<string | undefined>;
  onState(
    listener: AutoReloginStateListener,
    options?: AutoReloginStateSubscriptionOptions,
  ): Effect.Effect<AutoReloginStateDisposer>;
  enable(): Effect.Effect<AutoReloginState>;
  disable(): Effect.Effect<AutoReloginState>;
  setDelay(delayMs: number): Effect.Effect<AutoReloginState>;
  setServer(serverName: string): Effect.Effect<AutoReloginState>;
  captureCurrentSession(): Effect.Effect<boolean>;
  login(
    credentials: AutoLoginCredentials,
  ): Effect.Effect<AutoLoginOutcome, unknown>;
  loginAndWaitReady(
    credentials: AutoLoginCredentials,
  ): Effect.Effect<void, unknown>;
}

export class AutoRelogin extends ServiceMap.Service<
  AutoRelogin,
  AutoReloginShape
>()("features/Services/AutoRelogin") {}

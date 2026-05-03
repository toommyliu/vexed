import { Effect, ServiceMap } from "effect";

export interface AutoReloginState {
  readonly enabled: boolean;
  readonly captured: boolean;
  readonly attempting: boolean;
  readonly username?: string;
  readonly server?: string;
  readonly delayMs: number;
  readonly lastError?: string;
}

export type AutoReloginStateDisposer = () => void;

export type AutoReloginStateListener = (state: AutoReloginState) => void;

export interface AutoReloginStateSubscriptionOptions {
  readonly emitCurrent?: boolean;
}

export interface AutoReloginShape {
  getState(): Effect.Effect<AutoReloginState>;
  onState(
    listener: AutoReloginStateListener,
    options?: AutoReloginStateSubscriptionOptions,
  ): Effect.Effect<AutoReloginStateDisposer>;
  enable(): Effect.Effect<AutoReloginState>;
  disable(): Effect.Effect<AutoReloginState>;
  setDelayMs(delayMs: number): Effect.Effect<AutoReloginState>;
  captureCurrentSession(): Effect.Effect<boolean>;
}

export class AutoRelogin extends ServiceMap.Service<
  AutoRelogin,
  AutoReloginShape
>()("features/Services/AutoRelogin") {}

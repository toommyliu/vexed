import { Effect, ServiceMap } from "effect";
import type {
  FollowerStartPayload,
  FollowerState,
} from "../../../../../shared/follower";
import type { CombatProfileLibrary } from "../../../../../shared/combat-profiles";

export interface FollowerStartOptions {
  readonly config: FollowerStartPayload;
  readonly library: CombatProfileLibrary;
}

export type FollowerStateDisposer = () => void;

export type FollowerStateListener = (state: FollowerState) => void;

export interface FollowerStateSubscriptionOptions {
  readonly emitCurrent?: boolean;
}

export interface FollowerShape {
  readonly getState: () => Effect.Effect<FollowerState>;
  readonly onState: (
    listener: FollowerStateListener,
    options?: FollowerStateSubscriptionOptions,
  ) => Effect.Effect<FollowerStateDisposer>;
  readonly start: (
    options: FollowerStartOptions,
  ) => Effect.Effect<FollowerState, unknown>;
  readonly toggle: (
    library: CombatProfileLibrary,
  ) => Effect.Effect<FollowerState, unknown>;
  readonly stop: (reason?: string) => Effect.Effect<FollowerState>;
}

export class Follower extends ServiceMap.Service<Follower, FollowerShape>()(
  "features/Services/Follower",
) {}

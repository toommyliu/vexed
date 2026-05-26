import type { GameAction } from "@vexed/game";
import { ServiceMap } from "effect";
import type { Duration, Effect, Option, Schedule } from "effect";
import type { BridgeEffect } from "./Bridge";

export interface WaitOptions {
  readonly timeout?: Duration.Input;
  readonly interval?: Duration.Input;
  readonly schedule?: Schedule.Schedule<unknown>;
}

export interface WaitShape {
  until<E>(
    condition: Effect.Effect<boolean, E>,
    options?: WaitOptions,
  ): Effect.Effect<boolean, E>;
  untilSome<A, E>(
    condition: Effect.Effect<Option.Option<A>, E>,
    options?: WaitOptions,
  ): Effect.Effect<Option.Option<A>, E>;
  isGameActionAvailable(gameAction: GameAction): BridgeEffect<boolean>;
  forGameAction(
    gameAction: GameAction,
    options?: WaitOptions | Duration.Input,
  ): BridgeEffect<boolean>;
}

export class Wait extends ServiceMap.Service<Wait, WaitShape>()(
  "flash/Services/Wait",
) {}

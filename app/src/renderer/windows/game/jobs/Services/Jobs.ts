import { ServiceMap } from "effect";
import type { Duration, Effect } from "effect";
import type { JobRunWhen } from "./JobGate";

export interface JobStartOptions {
  readonly replace?: boolean;
}

export interface PeriodicJobStartOptions extends JobStartOptions {
  readonly runOnStart?: boolean;
  readonly runWhen?: JobRunWhen;
}

export interface PeriodicJobDefinition extends PeriodicJobStartOptions {
  readonly key: string;
  readonly interval: Duration.Input;
  readonly task: Effect.Effect<void, unknown>;
}

export interface JobsShape {
  start(
    key: string,
    task: Effect.Effect<void, unknown>,
    options?: JobStartOptions,
  ): Effect.Effect<boolean>;

  startPeriodic(
    key: string,
    interval: Duration.Input,
    task: Effect.Effect<void, unknown>,
    options?: PeriodicJobStartOptions,
  ): Effect.Effect<boolean>;

  startPeriodicJob(definition: PeriodicJobDefinition): Effect.Effect<boolean>;

  stop(key: string): Effect.Effect<boolean>;
  stopAll(): Effect.Effect<void>;
  isRunning(key: string): Effect.Effect<boolean>;
  getRunningKeys(): Effect.Effect<readonly string[]>;
}

export class Jobs extends ServiceMap.Service<Jobs, JobsShape>()(
  "jobs/Services/Jobs",
) {}

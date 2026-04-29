import { Effect } from "effect";

export const ScriptEffect = {
  all: Effect.all,
  gen: Effect.gen,
  logDebug: Effect.logDebug,
  logError: Effect.logError,
  logInfo: Effect.logInfo,
  logWarning: Effect.logWarning,
  promise: Effect.promise,
  race: Effect.race,
  sleep: Effect.sleep,
  timeout: Effect.timeout,
  tryPromise: Effect.tryPromise,
} satisfies Pick<
  typeof Effect,
  | "all"
  | "gen"
  | "logDebug"
  | "logError"
  | "logInfo"
  | "logWarning"
  | "promise"
  | "race"
  | "sleep"
  | "timeout"
  | "tryPromise"
>;

export type ScriptEffect = typeof ScriptEffect;

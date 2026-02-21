import { TaggedError } from "better-result";

export class EnvironmentMissingSenderError extends TaggedError(
  "EnvironmentMissingSenderError",
)<{ message: string }>() {}

export class EnvironmentMissingGameWindowError extends TaggedError(
  "EnvironmentMissingGameWindowError",
)<{ message: string }>() {}

export type EnvironmentServiceError =
  | EnvironmentMissingGameWindowError
  | EnvironmentMissingSenderError;

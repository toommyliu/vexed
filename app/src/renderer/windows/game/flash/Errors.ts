import { Data } from "effect";

export class SwfUnavailableError extends Data.TaggedError(
  "SwfUnavailableError",
)<{
  readonly method: string;
}> {}

export class SwfMethodNotFoundError extends Data.TaggedError(
  "SwfMethodNotFoundError",
)<{
  readonly method: string;
}> {}

export class SwfCallError extends Data.TaggedError("SwfCallError")<{
  readonly method: string;
  readonly cause: unknown;
}> {}

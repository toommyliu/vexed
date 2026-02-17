import type {
  FsEnsureDirError,
  FsJsonParseError,
  FsJsonSerializeError,
  FsReadError,
  FsWriteError,
} from "@vexed/fs";
import { TaggedError } from "better-result";

export class FastTravelNotFoundError extends TaggedError(
  "FastTravelNotFoundError",
)<{
  message: string;
  name: string;
}>() {}

export class FastTravelDuplicateNameError extends TaggedError(
  "FastTravelDuplicateNameError",
)<{
  message: string;
  name: string;
}>() {}

export type FastTravelError =
  | FastTravelDuplicateNameError
  | FastTravelNotFoundError
  | FsEnsureDirError
  | FsJsonParseError
  | FsJsonSerializeError
  | FsReadError
  | FsWriteError;

import { TaggedError } from "better-result";

/**
 * Error for directory operations.
 */
export class FsEnsureDirError extends TaggedError("FsEnsureDirError")<{
  message: string;
  path: string;
  cause?: unknown;
}>() {}

/**
 * Error for existence checks.
 */
export class FsPathExistsError extends TaggedError("FsPathExistsError")<{
  message: string;
  path: string;
  cause?: unknown;
}>() {}

/**
 * Error for file reading operations.
 */
export class FsReadError extends TaggedError("FsReadError")<{
  message: string;
  path: string;
  cause?: unknown;
}>() {}

/**
 * Error for file writing operations.
 */
export class FsWriteError extends TaggedError("FsWriteError")<{
  message: string;
  path: string;
  cause?: unknown;
}>() {}

/**
 * Error for file appending operations.
 */
export class FsAppendError extends TaggedError("FsAppendError")<{
  message: string;
  path: string;
  cause?: unknown;
}>() {}

/**
 * Error for JSON parsing operations.
 */
export class FsJsonParseError extends TaggedError("FsJsonParseError")<{
  message: string;
  path: string;
  cause?: unknown;
}>() {}

/**
 * Error for JSON serialization operations.
 */
export class FsJsonSerializeError extends TaggedError("FsJsonSerializeError")<{
  message: string;
  path: string;
  cause?: unknown;
}>() {}

/**
 * Error for file ensuring operations.
 */
export class FsEnsureFileError extends TaggedError("FsEnsureFileError")<{
  message: string;
  path: string;
  cause?: unknown;
}>() {}

/**
 * Error for stat operations.
 */
export class FsStatError extends TaggedError("FsStatError")<{
  message: string;
  path: string;
  cause?: unknown;
}>() {}

/**
 * Error for file deletion operations.
 */
export class FsDeleteFileError extends TaggedError("FsDeleteFileError")<{
  message: string;
  path: string;
  cause?: unknown;
}>() {}

/**
 * Error for directory deletion operations.
 */
export class FsDeleteDirError extends TaggedError("FsDeleteDirError")<{
  message: string;
  path: string;
  cause?: unknown;
}>() {}

/**
 * Error for directory reading operations.
 */
export class FsReadDirError extends TaggedError("FsReadDirError")<{
  message: string;
  path: string;
  cause?: unknown;
}>() {}

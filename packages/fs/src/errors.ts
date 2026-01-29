import { TaggedError } from "better-result";

const formatCause = (cause: unknown): string =>
  cause instanceof Error ? cause.message : String(cause);

export class FsEnsureDirError extends TaggedError("FsEnsureDirError")<{
  message: string;
  path: string;
  cause: unknown;
}>() {
  constructor(args: { path: string; cause: unknown }) {
    super({
      ...args,
      message: `Failed to ensure directory: ${args.path} - ${formatCause(args.cause)}`,
    });
  }
}

export class FsPathExistsError extends TaggedError("FsPathExistsError")<{
  message: string;
  path: string;
  cause: unknown;
}>() {
  constructor(args: { path: string; cause: unknown }) {
    super({
      ...args,
      message: `Failed to check path existence: ${args.path} - ${formatCause(args.cause)}`,
    });
  }
}

export class FsReadError extends TaggedError("FsReadError")<{
  message: string;
  path: string;
  cause: unknown;
}>() {
  constructor(args: { path: string; cause: unknown }) {
    super({
      ...args,
      message: `Failed to read file: ${args.path} - ${formatCause(args.cause)}`,
    });
  }
}

export class FsWriteError extends TaggedError("FsWriteError")<{
  message: string;
  path: string;
  cause: unknown;
}>() {
  constructor(args: { path: string; cause: unknown }) {
    super({
      ...args,
      message: `Failed to write file: ${args.path} - ${formatCause(args.cause)}`,
    });
  }
}

export class FsAppendError extends TaggedError("FsAppendError")<{
  message: string;
  path: string;
  cause: unknown;
}>() {
  constructor(args: { path: string; cause: unknown }) {
    super({
      ...args,
      message: `Failed to append file: ${args.path} - ${formatCause(args.cause)}`,
    });
  }
}

export class FsJsonParseError extends TaggedError("FsJsonParseError")<{
  message: string;
  path: string;
  cause: unknown;
}>() {
  constructor(args: { path: string; cause: unknown }) {
    super({
      ...args,
      message: `Failed to parse JSON file: ${args.path} - ${formatCause(args.cause)}`,
    });
  }
}

export class FsJsonSerializeError extends TaggedError("FsJsonSerializeError")<{
  message: string;
  path: string;
  cause: unknown;
}>() {
  constructor(args: { path: string; cause: unknown }) {
    super({
      ...args,
      message: `Failed to stringify JSON for file: ${args.path} - ${formatCause(args.cause)}`,
    });
  }
}

export class FsEnsureFileError extends TaggedError("FsEnsureFileError")<{
  message: string;
  path: string;
  cause: unknown;
}>() {
  constructor(args: { path: string; cause: unknown }) {
    super({
      ...args,
      message: `Failed to ensure file: ${args.path} - ${formatCause(args.cause)}`,
    });
  }
}

export class FsStatError extends TaggedError("FsStatError")<{
  message: string;
  path: string;
  cause: unknown;
}>() {
  constructor(args: { path: string; cause: unknown }) {
    super({
      ...args,
      message: `Failed to stat file: ${args.path} - ${formatCause(args.cause)}`,
    });
  }
}

export class FsDeleteFileError extends TaggedError("FsDeleteFileError")<{
  message: string;
  path: string;
  cause: unknown;
}>() {
  constructor(args: { path: string; cause: unknown }) {
    super({
      ...args,
      message: `Failed to delete file: ${args.path} - ${formatCause(args.cause)}`,
    });
  }
}

export class FsDeleteDirError extends TaggedError("FsDeleteDirError")<{
  message: string;
  path: string;
  cause: unknown;
}>() {
  constructor(args: { path: string; cause: unknown }) {
    super({
      ...args,
      message: `Failed to delete directory: ${args.path} - ${formatCause(args.cause)}`,
    });
  }
}

export class FsReadDirError extends TaggedError("FsReadDirError")<{
  message: string;
  path: string;
  cause: unknown;
}>() {
  constructor(args: { path: string; cause: unknown }) {
    super({
      ...args,
      message: `Failed to read directory recursively: ${args.path} - ${formatCause(args.cause)}`,
    });
  }
}

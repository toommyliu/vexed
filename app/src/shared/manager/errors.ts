import { TaggedError } from "better-result";

export type ManagerOperation =
  | "getAccounts"
  | "addAccount"
  | "removeAccount"
  | "updateAccount";

export class ManagerDuplicateUsernameError extends TaggedError(
  "ManagerDuplicateUsernameError",
)<{
  message: string;
  username: string;
}>() {
  public constructor(args: { username: string }) {
    super({
      ...args,
      message: `username "${args.username}" already exists`,
    });
  }
}

export class ManagerAccountNotFoundError extends TaggedError(
  "ManagerAccountNotFoundError",
)<{
  message: string;
  username: string;
}>() {
  public constructor(args: { username: string }) {
    super({
      ...args,
      message: `account "${args.username}" not found`,
    });
  }
}

export class ManagerOperationFailedError extends TaggedError(
  "ManagerOperationFailedError",
)<{
  cause?: string | undefined;
  message: string;
  operation: ManagerOperation;
}>() {
  public constructor(args: {
    cause?: string | undefined;
    operation: ManagerOperation;
  }) {
    super({
      ...args,
      message: `manager operation "${args.operation}" failed`,
    });
  }
}

export type ManagerIpcError =
  | ManagerAccountNotFoundError
  | ManagerDuplicateUsernameError
  | ManagerOperationFailedError;

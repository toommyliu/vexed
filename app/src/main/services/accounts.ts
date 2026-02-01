import { join } from "path";
import { readJson, writeJson } from "@vexed/fs";
import type {
  FsEnsureDirError,
  FsJsonParseError,
  FsJsonSerializeError,
  FsReadError,
  FsWriteError,
} from "@vexed/fs";
import { equalsIgnoreCase } from "@vexed/utils";
import { Result, TaggedError } from "better-result";
import { DOCUMENTS_PATH } from "~/shared";
import type { Account } from "~/shared/types";

const ACCOUNTS_PATH = join(DOCUMENTS_PATH, "accounts.json");

export class AccountNotFoundError extends TaggedError("AccountNotFoundError")<{
  message: string;
  username: string;
}>() {
  public constructor(args: { username: string }) {
    super({
      ...args,
      message: `Account not found: ${args.username}`,
    });
  }
}

export class DuplicateUsernameError extends TaggedError(
  "DuplicateUsernameError",
)<{
  message: string;
  username: string;
}>() {
  public constructor(args: { username: string }) {
    super({
      ...args,
      message: `Username already exists: ${args.username}`,
    });
  }
}

export type AccountsError =
  | AccountNotFoundError
  | DuplicateUsernameError
  | FsEnsureDirError
  | FsJsonParseError
  | FsJsonSerializeError
  | FsReadError
  | FsWriteError;

export const accounts = {
  getAll: async (): Promise<Result<Account[], AccountsError>> =>
    Result.gen(async function* () {
      const data = yield* Result.await(readJson<Account[]>(ACCOUNTS_PATH));
      return Result.ok(data ?? []);
    }),

  add: async (account: Account): Promise<Result<void, AccountsError>> =>
    Result.gen(async function* () {
      const allAccounts = yield* Result.await(accounts.getAll());
      const exists = allAccounts.some((acc) =>
        equalsIgnoreCase(acc.username, account.username),
      );
      if (exists)
        return Result.err(
          new DuplicateUsernameError({ username: account.username }),
        );

      const updated = [...allAccounts, account];
      yield* Result.await(writeJson(ACCOUNTS_PATH, updated));
      return Result.ok();
    }),

  update: async (
    originalUsername: string,
    updatedAccount: Account,
  ): Promise<Result<void, AccountsError>> =>
    Result.gen(async function* () {
      const allAccounts = yield* Result.await(accounts.getAll());
      const idx = allAccounts.findIndex(
        (acc) => acc.username === originalUsername,
      );
      if (idx === -1)
        return Result.err(
          new AccountNotFoundError({ username: originalUsername }),
        );

      if (!equalsIgnoreCase(originalUsername, updatedAccount.username)) {
        const existingIdx = allAccounts.findIndex(
          (acc) => acc.username === updatedAccount.username,
        );
        if (existingIdx !== -1)
          return Result.err(
            new DuplicateUsernameError({ username: updatedAccount.username }),
          );
      }

      const updated = [...allAccounts];
      updated[idx] = updatedAccount;
      yield* Result.await(writeJson(ACCOUNTS_PATH, updated));
      return Result.ok();
    }),

  remove: async (username: string): Promise<Result<void, AccountsError>> =>
    Result.gen(async function* () {
      const allAccounts = yield* Result.await(accounts.getAll());
      const idx = allAccounts.findIndex((acc) =>
        equalsIgnoreCase(acc.username, username),
      );
      if (idx === -1) return Result.err(new AccountNotFoundError({ username }));
      const updated = allAccounts.filter((_, currIdx) => currIdx !== idx);
      yield* Result.await(writeJson(ACCOUNTS_PATH, updated));
      return Result.ok();
    }),
};

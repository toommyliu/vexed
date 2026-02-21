import { Result, type ResultDeserializationError } from "better-result";
import type { ManagerIpcError } from "~/shared/manager/errors";
import type { Account, AccountWithServer } from "../../../shared/types";
import { client } from "../../../shared/tipc";
import { managerState } from "./state.svelte";

export const startAccount = async (account: AccountWithServer) => {
  const { timeouts } = managerState;

  if (timeouts.has(account.username)) {
    clearTimeout(timeouts.get(account.username)!);
    timeouts.delete(account.username);
  }

  const timeout = setTimeout(() => {
    timeouts.delete(account.username);
  }, 10_000); // 10s should be sufficient
  managerState.timeouts.set(account.username, timeout);

  await client.app.launchGame({
    username: account.username,
    password: account.password,
    server: account.server ?? null,
    scriptPath:
      managerState.startWithScript && managerState.scriptPath
        ? managerState.scriptPath
        : null,
  });
};

export const removeAccount = async (account: Account) => {
  const { timeouts } = managerState;

  if (timeouts.has(account.username)) {
    clearTimeout(timeouts.get(account.username)!);
    timeouts.delete(account.username);
  }

  try {
    const serialized = await client.manager.removeAccount({
      username: account.username,
    });
    const result = Result.deserialize<void, ManagerIpcError>(serialized);
    if (result.isErr()) {
      console.error("Failed to remove account:", result.error);
    }
    return result.isOk();
  } catch (error) {
    console.error("Failed to remove account:", error);
    return false;
  }
};

export const editAccount = async (
  originalUsername: string,
  updatedAccount: Account,
): Promise<Result<void, ManagerIpcError | ResultDeserializationError> | null> => {
  const { accounts } = managerState;

  try {
    const serialized = await client.manager.updateAccount({
      originalUsername,
      updatedAccount,
    });
    const result = Result.deserialize<void, ManagerIpcError>(serialized);
    const originalKey = originalUsername.toLowerCase();
    const updatedKey = updatedAccount.username.toLowerCase();

    if (result.isOk()) {
      if (originalKey === updatedKey) {
        accounts.set(updatedKey, updatedAccount);
      } else {
        const newAccounts = new Map();

        for (const [key, value] of accounts) {
          if (key === originalKey) {
            newAccounts.set(updatedKey, updatedAccount);
          } else {
            newAccounts.set(key, value);
          }
        }

        accounts.clear();
        for (const [key, value] of newAccounts) accounts.set(key, value);
      }
    } else {
      console.error("Failed to edit account:", result.error);
    }

    return result;
  } catch (error) {
    console.error("Failed to edit account:", error);
    return null;
  }
};

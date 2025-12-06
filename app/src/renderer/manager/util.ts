import { client } from "../../shared/tipc";
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

  await client.manager.launchGame({
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
    return await client.manager.removeAccount({ username: account.username });
  } catch (error) {
    console.error("Failed to remove account:", error);
    return false;
  }
};

export const editAccount = async (
  originalUsername: string,
  updatedAccount: Account,
) => {
  const { accounts } = managerState;

  try {
    const res = await client.manager.updateAccount({
      originalUsername,
      updatedAccount,
    });

    if (res?.msg === "SUCCESS") {
      if (originalUsername === updatedAccount.username) {
        accounts.set(updatedAccount.username.toLowerCase(), updatedAccount);
      } else {
        const newAccounts = new Map();

        for (const [key, value] of accounts) {
          if (key === originalUsername) {
            newAccounts.set(
              updatedAccount.username.toLowerCase(),
              updatedAccount,
            );
          } else {
            newAccounts.set(key, value);
          }
        }

        accounts.clear();
        for (const [key, value] of newAccounts) accounts.set(key, value);
      }
    }

    return res;
  } catch (error) {
    console.error("Failed to edit account:", error);
    return null;
  }
};

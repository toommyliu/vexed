import { client } from "../../shared/tipc";
import { managerState } from "./state.svelte";

export const startAccount = async (account: Account) => {
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
    server: managerState.selectedServer!,
    ...(managerState.scriptPath && {
      scriptPath: managerState.scriptPath,
    }),
  });
};

export const removeAccount = async (account: Account) => {
  const { timeouts, accounts } = managerState;

  try {
    if (timeouts.has(account.username)) {
      clearTimeout(timeouts.get(account.username)!);
      timeouts.delete(account.username);
    }

    await client.manager.removeAccount({ username: account.username });
    accounts.delete(account.username);
  } catch (error) {
    console.error("Failed to remove account:", error);
  }
};

// Update an existing account in the accounts Map, while preserving the order
export const editAccount = async (
  originalUsername: string,
  updatedAccount: Account,
) => {
  const { accounts } = managerState;

  try {
    const success = await client.manager.updateAccount({
      originalUsername,
      updatedAccount,
    });

    if (success) {
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

        // Update the accounts map now
        for (const [key, value] of newAccounts) accounts.set(key, value);
      }

      return true;
    }

    return false;
  } catch (error) {
    console.error("Failed to edit account:", error);
    return false;
  }
};

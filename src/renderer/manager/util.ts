import { managerState } from "./state.svelte";
import { client } from "../../shared/tipc";

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

  await client.launchGame({
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

    await client.removeAccount({ username: account.username });
    accounts.delete(account.username);
  } catch {}
};

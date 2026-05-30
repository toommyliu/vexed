import type { AccountGameServer } from "../../shared/ipc";

export type StoredAccountLoginServerPreference = string | null | undefined;

const ACCOUNT_LOGIN_SERVER_STORAGE_KEY = "vexed.account-manager.login-server";

const parseStoredAccountLoginServerPreference = (
  value: string,
): StoredAccountLoginServerPreference => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return undefined;
  }

  if (
    typeof parsed === "object" &&
    parsed !== null &&
    "type" in parsed &&
    parsed.type === "none"
  ) {
    return null;
  }

  if (
    typeof parsed === "object" &&
    parsed !== null &&
    "type" in parsed &&
    parsed.type === "server" &&
    "name" in parsed &&
    typeof parsed.name === "string" &&
    parsed.name.trim() !== ""
  ) {
    return parsed.name;
  }

  return undefined;
};

export function readStoredAccountLoginServerPreference(): StoredAccountLoginServerPreference {
  try {
    const storedValue = window.localStorage.getItem(
      ACCOUNT_LOGIN_SERVER_STORAGE_KEY,
    );
    return storedValue === null
      ? undefined
      : parseStoredAccountLoginServerPreference(storedValue);
  } catch {
    return undefined;
  }
}

export function writeStoredAccountLoginServerPreference(
  serverName: string,
): void {
  try {
    window.localStorage.setItem(
      ACCOUNT_LOGIN_SERVER_STORAGE_KEY,
      JSON.stringify(
        serverName === ""
          ? { type: "none" }
          : { type: "server", name: serverName },
      ),
    );
  } catch {}
}

export function resolveAccountLoginServerPreference(
  servers: readonly AccountGameServer[],
  preferredServerName: StoredAccountLoginServerPreference,
): string {
  if (preferredServerName === null) {
    return "";
  }

  if (preferredServerName !== undefined) {
    const preferredServer = servers.find(
      (server) => server.name === preferredServerName,
    );
    if (preferredServer?.online === true) {
      return preferredServer.name;
    }
  }

  return (
    servers.find((server) => server.online && server.playerCount < server.maxPlayers)
      ?.name ?? ""
  );
}

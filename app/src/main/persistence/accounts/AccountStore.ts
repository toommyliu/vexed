import type { ManagedAccount, ManagedAccountGroups } from "../../../shared/ipc";

export interface AccountManagerStorage {
  readonly accounts: readonly ManagedAccount[];
  readonly groups: ManagedAccountGroups;
}

const emptyStorage: AccountManagerStorage = {
  accounts: [],
  groups: {},
};

export const ACCOUNT_MANAGER_STORAGE_FILE = "accounts.json";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isManagedAccount = (value: unknown): value is ManagedAccount => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value["label"] === "string" &&
    typeof value["username"] === "string" &&
    typeof value["password"] === "string"
  );
};

export const normalizeStoredAccount = (
  account: ManagedAccount,
): ManagedAccount => ({
  label: account.label,
  username: account.username,
  password: account.password,
});

export const dedupeAccountsByUsername = (
  accounts: readonly ManagedAccount[],
): readonly ManagedAccount[] => {
  const seen = new Set<string>();
  const nextAccounts: ManagedAccount[] = [];

  for (const account of accounts) {
    const key = account.username.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    nextAccounts.push(account);
  }

  return nextAccounts;
};

const normalizeAccounts = (value: unknown): readonly ManagedAccount[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return dedupeAccountsByUsername(
    value.filter(isManagedAccount).map(normalizeStoredAccount),
  );
};

const normalizeStoredGroupMembers = (
  value: unknown,
  accounts: readonly ManagedAccount[],
): readonly string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const accountUsernames = new Set(accounts.map((account) => account.username));
  const seen = new Set<string>();
  const usernames: string[] = [];

  for (const member of value) {
    if (typeof member !== "string" || !accountUsernames.has(member)) {
      continue;
    }

    const key = member.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    usernames.push(member);
  }

  return usernames;
};

const normalizeGroups = (
  value: unknown,
  accounts: readonly ManagedAccount[],
): ManagedAccountGroups => {
  if (!isRecord(value)) {
    return {};
  }

  const groups: Record<string, readonly string[]> = {};
  const seen = new Set<string>();

  for (const [rawName, rawMembers] of Object.entries(value)) {
    const name = rawName.trim();
    const key = name.toLowerCase();
    if (name === "" || seen.has(key)) {
      continue;
    }

    seen.add(key);
    groups[name] = normalizeStoredGroupMembers(rawMembers, accounts);
  }

  return groups;
};

export const normalizeAccountManagerStorage = (
  value: unknown,
): AccountManagerStorage => {
  if (!isRecord(value)) {
    return emptyStorage;
  }

  const accounts = normalizeAccounts(value["accounts"]);

  return {
    accounts,
    groups: normalizeGroups(value["groups"], accounts),
  };
};

export const renameGroupMemberUsername = (
  groups: ManagedAccountGroups,
  currentUsername: string,
  nextUsername: string,
): ManagedAccountGroups => {
  if (currentUsername === nextUsername) {
    return groups;
  }

  const nextGroups: Record<string, readonly string[]> = {};
  for (const [name, usernames] of Object.entries(groups)) {
    const seen = new Set<string>();
    const nextUsernames: string[] = [];
    for (const username of usernames) {
      const next = username === currentUsername ? nextUsername : username;
      const key = next.toLowerCase();
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      nextUsernames.push(next);
    }
    nextGroups[name] = nextUsernames;
  }

  return nextGroups;
};

export const removeGroupMemberUsername = (
  groups: ManagedAccountGroups,
  accountUsername: string,
): ManagedAccountGroups => {
  const nextGroups: Record<string, readonly string[]> = {};
  for (const [name, usernames] of Object.entries(groups)) {
    nextGroups[name] = usernames.filter(
      (username) => username !== accountUsername,
    );
  }

  return nextGroups;
};

export const serializeAccountManagerStorage = (
  storage: AccountManagerStorage,
): AccountManagerStorage => {
  const accounts = dedupeAccountsByUsername(
    storage.accounts.map(normalizeStoredAccount),
  );
  return {
    accounts,
    groups: normalizeGroups(storage.groups, accounts),
  };
};

export const emptyAccountManagerStorage = (): AccountManagerStorage =>
  normalizeAccountManagerStorage(emptyStorage);

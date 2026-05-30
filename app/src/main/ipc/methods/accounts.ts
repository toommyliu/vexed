import { BrowserWindow, type IpcMainInvokeEvent } from "electron";
import { get } from "https";
import type { ServerData } from "@vexed/game";
import { Data, Effect, Scope } from "effect";
import {
  ACCOUNT_SERVER_REFRESH_COOLDOWN_MS,
  AccountManagerIpcChannels,
  type AccountGameLaunchPayload,
  type AccountGameServer,
  type AccountGameServersResult,
  type AccountLaunchResult,
  type AccountLaunchRequest,
  type AccountManagerState,
  type AccountScriptSession,
  type AccountScriptStatusUpdate,
  type ManagedAccount,
  type ManagedAccountGroupDraft,
  type ManagedAccountGroups,
  type ManagedAccountGroupPatch,
  type ManagedAccountDraft,
  type ManagedAccountPatch,
  type ScriptExecutePayload,
} from "../../../shared/ipc";
import { WindowIds } from "../../../shared/windows";
import {
  type AccountManagerRepositoryShape,
  AccountManagerRepository,
} from "../../persistence/accounts/AccountRepository";
import {
  type AccountManagerStorage,
  removeGroupMemberUsername,
  renameGroupMemberUsername,
} from "../../persistence/accounts/AccountStore";
import { getArtixLauncherRequestHeaders } from "../../artix-launcher-headers";
import {
  Observability,
  type ObservabilityShape,
} from "../../app/MainObservability";
import { MainIpc } from "../MainIpc";
import {
  WindowService,
  type WindowEffectRunner,
} from "../../window/WindowService";
import {
  WorkspaceFiles,
  type WorkspaceFilesShape,
} from "../../workspace/WorkspaceFiles";
import { refreshScriptPayload } from "../../workspace/scripting";

const SERVERS_API_URL = "https://game.aq.com/game/api/data/servers";
const SERVERS_CACHE_TTL_MS = 5 * 60 * 1_000;
const SERVER_REQUEST_TIMEOUT_MS = 10_000;

let lastServerRefreshRequestTime = 0;
let cachedServers: ServerData[] = [];
let lastServerFetchTime = 0;

const sessions = new Map<number, AccountScriptSession>();
const gameLaunchPayloads = new Map<number, AccountGameLaunchPayload>();

const now = (): number => Date.now();

class AccountServersFetchError extends Data.TaggedError(
  "AccountServersFetchError",
)<{
  readonly message: string;
  readonly cause: unknown;
}> {}

class AccountServersPayloadError extends Data.TaggedError(
  "AccountServersPayloadError",
)<{
  readonly message: string;
  readonly cause: unknown;
}> {}

const normalizeRequiredString = (value: unknown, field: string): string => {
  if (typeof value !== "string") {
    throw new Error(`${field} must be a string`);
  }

  const normalized = value.trim();
  if (normalized === "") {
    throw new Error(`${field} is required`);
  }

  return normalized;
};

const normalizeOptionalString = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
};

const hasAccountUsername = (
  accounts: readonly ManagedAccount[],
  username: string,
  options?: { readonly exceptUsername?: string },
): boolean => {
  const normalized = username.toLowerCase();
  const except = options?.exceptUsername?.toLowerCase();

  return accounts.some(
    (account) =>
      account.username.toLowerCase() === normalized &&
      account.username.toLowerCase() !== except,
  );
};

const readStorage = async (
  repository: AccountManagerRepositoryShape,
): Promise<AccountManagerStorage> => Effect.runPromise(repository.get);

const writeStorage = async (
  repository: AccountManagerRepositoryShape,
  storage: AccountManagerStorage,
): Promise<void> => {
  await Effect.runPromise(repository.set(storage));
};

const readAccounts = async (
  repository: AccountManagerRepositoryShape,
): Promise<readonly ManagedAccount[]> =>
  (await readStorage(repository)).accounts;

const groupNameKey = (name: string): string => name.toLowerCase();

const findGroupName = (
  groups: ManagedAccountGroups,
  name: string,
): string | undefined => {
  const key = groupNameKey(name);
  return Object.keys(groups).find(
    (groupName) => groupNameKey(groupName) === key,
  );
};

const hasGroupName = (
  groups: ManagedAccountGroups,
  name: string,
  options?: { readonly exceptName?: string },
): boolean => {
  const existingName = findGroupName(groups, name);
  return (
    existingName !== undefined &&
    groupNameKey(existingName) !== groupNameKey(options?.exceptName ?? "")
  );
};

const normalizeGroupMembersInput = (
  value: unknown,
  accounts: readonly ManagedAccount[],
): readonly string[] => {
  if (!Array.isArray(value)) {
    throw new Error("Group usernames must be an array");
  }

  const usernames = new Set(accounts.map((account) => account.username));
  const seen = new Set<string>();
  const members: string[] = [];

  for (const username of value) {
    if (typeof username !== "string") {
      throw new Error("Group username must be a string");
    }

    const normalized = normalizeRequiredString(username, "group username");
    if (!usernames.has(normalized)) {
      throw new Error(`Account not found: ${normalized}`);
    }

    const key = normalized.toLowerCase();
    if (seen.has(key)) {
      throw new Error(`Duplicate group member: ${normalized}`);
    }

    seen.add(key);
    members.push(normalized);
  }

  return members;
};

const normalizeGroupDraft = (
  draft: unknown,
  accounts: readonly ManagedAccount[],
): ManagedAccountGroupDraft => {
  if (typeof draft !== "object" || draft === null) {
    throw new Error("Group draft must be an object");
  }

  const input = draft as Partial<ManagedAccountGroupDraft>;
  return {
    name: normalizeRequiredString(input.name, "group name"),
    usernames: normalizeGroupMembersInput(input.usernames, accounts),
  };
};

const normalizeGroupPatch = (
  patch: unknown,
  accounts: readonly ManagedAccount[],
): ManagedAccountGroupPatch => {
  if (typeof patch !== "object" || patch === null) {
    throw new Error("Group patch must be an object");
  }

  const input = patch as Partial<ManagedAccountGroupPatch>;
  return {
    ...(input.name === undefined
      ? {}
      : { name: normalizeRequiredString(input.name, "group name") }),
    ...(input.usernames === undefined
      ? {}
      : { usernames: normalizeGroupMembersInput(input.usernames, accounts) }),
  };
};

const visibleSessions = (): readonly AccountScriptSession[] => {
  const latestByUsername = new Map<string, AccountScriptSession>();

  for (const session of sessions.values()) {
    const current = latestByUsername.get(session.username);
    if (current === undefined || session.updatedAt >= current.updatedAt) {
      latestByUsername.set(session.username, session);
    }
  }

  return [...latestByUsername.values()];
};

const toState = async (
  repository: AccountManagerRepositoryShape,
): Promise<AccountManagerState> => {
  const storage = await readStorage(repository);
  return {
    accounts: storage.accounts,
    groups: storage.groups,
    sessions: visibleSessions(),
    storagePath: repository.storagePath,
  };
};

const toAccountGameServer = (server: {
  readonly bOnline: number;
  readonly bUpg: number;
  readonly iCount: number;
  readonly iMax: number;
  readonly sLang: string;
  readonly sName: string;
}): AccountGameServer => ({
  name: server.sName,
  language: server.sLang,
  online: server.bOnline === 1,
  upgrade: server.bUpg === 1,
  playerCount: server.iCount,
  maxPlayers: server.iMax,
});

const isServerData = (value: unknown): value is ServerData => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record["sName"] === "string" &&
    typeof record["sIP"] === "string" &&
    typeof record["sLang"] === "string" &&
    typeof record["bOnline"] === "number" &&
    typeof record["bUpg"] === "number" &&
    typeof record["iChat"] === "number" &&
    typeof record["iCount"] === "number" &&
    typeof record["iLevel"] === "number" &&
    typeof record["iMax"] === "number" &&
    typeof record["iPort"] === "number"
  );
};

const fetchJson = (url: string): Promise<unknown> =>
  new Promise((resolve, reject) => {
    const request = get(
      url,
      {
        headers: {
          Accept: "application/json",
          ...getArtixLauncherRequestHeaders(),
        },
      },
      (response) => {
        const statusCode = response.statusCode ?? 0;
        const chunks: Buffer[] = [];

        response.on("error", reject);
        response.on("data", (chunk: Buffer | string) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });
        response.on("end", () => {
          const source = Buffer.concat(chunks).toString("utf8");
          if (statusCode < 200 || statusCode >= 300) {
            reject(
              new Error(
                `Failed to fetch servers: ${statusCode} ${
                  response.statusMessage ?? ""
                }`.trim(),
              ),
            );
            return;
          }

          try {
            resolve(JSON.parse(source));
          } catch (error) {
            reject(error);
          }
        });
      },
    );

    request.setTimeout(SERVER_REQUEST_TIMEOUT_MS, () => {
      request.destroy(new Error("Timed out while fetching servers"));
    });
    request.on("error", reject);
  });

const fetchServersJson = Effect.tryPromise({
  try: () => fetchJson(SERVERS_API_URL),
  catch: (cause) =>
    new AccountServersFetchError({
      message:
        cause instanceof Error ? cause.message : "Failed to fetch servers",
      cause,
    }),
});

const getCachedAccountServers = (
  observability: ObservabilityShape,
): Effect.Effect<
  readonly ServerData[],
  AccountServersFetchError | AccountServersPayloadError
> =>
  Effect.gen(function* () {
    const timestamp = now();
    if (
      cachedServers.length > 0 &&
      timestamp - lastServerFetchTime < SERVERS_CACHE_TTL_MS
    ) {
      return cachedServers;
    }

    const data = yield* fetchServersJson.pipe(
      Effect.catch((error: AccountServersFetchError) =>
        cachedServers.length > 0
          ? observability
              .warn("accounts", "Failed to fetch servers; using cache", {
                error,
                cachedServerCount: cachedServers.length,
              })
              .pipe(Effect.as(cachedServers as unknown))
          : Effect.fail(error),
      ),
    );

    if (!Array.isArray(data)) {
      if (cachedServers.length > 0) {
        yield* observability.warn(
          "accounts",
          "Invalid servers payload; using cache",
          {
            payload: data,
            cachedServerCount: cachedServers.length,
          },
        );
        return cachedServers;
      }

      return yield* new AccountServersPayloadError({
        message: "Invalid servers payload",
        cause: data,
      });
    }

    yield* Effect.sync(() => {
      cachedServers = data.filter(isServerData);
      lastServerFetchTime = now();
    });

    return cachedServers;
  });

const refreshAccountServers = (
  observability: ObservabilityShape,
): Effect.Effect<
  readonly ServerData[],
  AccountServersFetchError | AccountServersPayloadError
> =>
  Effect.sync(() => {
    lastServerFetchTime = 0;
  }).pipe(Effect.flatMap(() => getCachedAccountServers(observability)));

const getOpenAccountManagerWindow = (
  runWindowEffect: WindowEffectRunner,
): Promise<BrowserWindow | null> =>
  runWindowEffect(
    Effect.gen(function* () {
      const windows = yield* WindowService;
      return yield* windows.getOpenWindow(WindowIds.AccountManager);
    }),
  );

const requireAccountManagerSender = async (
  event: IpcMainInvokeEvent,
  runWindowEffect: WindowEffectRunner,
): Promise<void> => {
  const window = await getOpenAccountManagerWindow(runWindowEffect);
  if (window?.webContents.id !== event.sender.id) {
    throw new Error(
      "Account credentials are only available to Account Manager",
    );
  }
};

const publishStateToAccountManager = async (
  runWindowEffect: WindowEffectRunner,
  repository: AccountManagerRepositoryShape,
): Promise<AccountManagerState> => {
  const state = await toState(repository);
  const window = await getOpenAccountManagerWindow(runWindowEffect);

  if (window && !window.isDestroyed() && !window.webContents.isDestroyed()) {
    window.webContents.send(AccountManagerIpcChannels.changed, state);
  }

  return state;
};

const normalizeDraft = (draft: unknown): ManagedAccount => {
  if (typeof draft !== "object" || draft === null) {
    throw new Error("Account draft must be an object");
  }

  const input = draft as Partial<ManagedAccountDraft>;
  const username = normalizeRequiredString(input.username, "username");
  const label =
    typeof input.label === "string" && input.label.trim() !== ""
      ? input.label.trim()
      : username;

  return {
    label,
    username,
    password: normalizeRequiredString(input.password, "password"),
  };
};

const normalizePatch = (patch: unknown): ManagedAccountPatch => {
  if (typeof patch !== "object" || patch === null) {
    throw new Error("Account patch must be an object");
  }

  const input = patch as Partial<ManagedAccountPatch>;
  const output: Record<string, string> = {};

  for (const key of ["label", "username", "password"] as const) {
    if (input[key] !== undefined) {
      output[key] = normalizeRequiredString(input[key], key);
    }
  }

  return output;
};

const scriptName = (script: ScriptExecutePayload | null | undefined): string =>
  script?.name || script?.path || "script";

const scriptRefreshErrorMessage = (
  script: ScriptExecutePayload,
  error: unknown,
): string => {
  const message = error instanceof Error ? error.message : "";
  const name = scriptName(script);
  return message
    ? `Failed to refresh ${name}: ${message}`
    : `Failed to refresh ${name}`;
};

const isScriptPayload = (value: unknown): value is ScriptExecutePayload => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const payload = value as Partial<ScriptExecutePayload>;
  return (
    typeof payload.source === "string" &&
    (payload.path === undefined || typeof payload.path === "string") &&
    (payload.name === undefined || typeof payload.name === "string")
  );
};

const normalizeLaunchRequest = (request: unknown): AccountLaunchRequest => {
  if (typeof request !== "object" || request === null) {
    throw new Error("Launch request must be an object");
  }

  const input = request as Partial<AccountLaunchRequest>;
  const username = normalizeRequiredString(input.username, "username");
  const server = normalizeOptionalString(input.server);
  const script =
    input.script === null || input.script === undefined
      ? null
      : isScriptPayload(input.script)
        ? input.script
        : undefined;

  if (script === undefined) {
    throw new Error("Invalid launch script payload");
  }

  return {
    username,
    script,
    ...(server === "" ? {} : { server }),
  };
};

const normalizeGameWindowId = (value: unknown): number => {
  if (!Number.isInteger(value) || (value as number) <= 0) {
    throw new Error("gameWindowId is required");
  }

  return value as number;
};

const setSession = async (
  update: AccountScriptStatusUpdate,
  runWindowEffect: WindowEffectRunner,
  repository: AccountManagerRepositoryShape,
): Promise<void> => {
  const gameWindowId = normalizeGameWindowId(update.gameWindowId);

  sessions.set(gameWindowId, {
    username: update.username,
    gameWindowId,
    status: update.status,
    updatedAt: now(),
    ...(update.scriptName === undefined
      ? {}
      : { scriptName: update.scriptName }),
    ...(update.message === undefined ? {} : { message: update.message }),
  });

  await publishStateToAccountManager(runWindowEffect, repository);
};

const clearSession = async (
  gameWindowId: number,
  runWindowEffect: WindowEffectRunner,
  repository: AccountManagerRepositoryShape,
): Promise<void> => {
  sessions.delete(normalizeGameWindowId(gameWindowId));
  await publishStateToAccountManager(runWindowEffect, repository);
};

const getEventWindowId = (event: IpcMainInvokeEvent): number | null =>
  BrowserWindow.fromWebContents(event.sender)?.id ?? null;

const sendGameLaunchPayload = (
  window: BrowserWindow,
  payload: AccountGameLaunchPayload,
): void => {
  if (window.isDestroyed() || window.webContents.isDestroyed()) {
    return;
  }

  window.webContents.send(AccountManagerIpcChannels.gameLaunch, payload);
};

const refreshGameLaunchScript = async (
  payload: AccountGameLaunchPayload,
  workspace: WorkspaceFilesShape,
): Promise<AccountGameLaunchPayload> => {
  if (payload.script === undefined) {
    return payload;
  }

  const script = await refreshScriptPayload(
    workspace.scriptsDir,
    payload.script,
  );
  const nextPayload: AccountGameLaunchPayload = {
    ...payload,
    script,
  };

  gameLaunchPayloads.set(payload.gameWindowId, nextPayload);
  return nextPayload;
};

export interface AccountGameLaunchInput {
  readonly account: ManagedAccount;
  readonly script?: ScriptExecutePayload | null;
  readonly server?: string;
}

export interface AccountGameLaunchDependencies {
  readonly runWindowEffect: WindowEffectRunner;
  readonly repository: AccountManagerRepositoryShape;
  readonly workspace: WorkspaceFilesShape;
  readonly observability: Pick<ObservabilityShape, "error">;
}

export const startAccountGameLaunch = async (
  input: AccountGameLaunchInput,
  dependencies: AccountGameLaunchDependencies,
): Promise<AccountLaunchResult> => {
  const requestedScript = input.script ?? null;
  const launchScript =
    requestedScript === null
      ? null
      : await refreshScriptPayload(
          dependencies.workspace.scriptsDir,
          requestedScript,
        );

  const gameWindow = await dependencies.runWindowEffect(
    Effect.gen(function* () {
      const windows = yield* WindowService;
      return yield* windows.openGameWindow();
    }),
  );
  const gameWindowId = gameWindow.id;
  const gameLaunchPayload: AccountGameLaunchPayload = {
    account: input.account,
    ...(launchScript === null ? {} : { script: launchScript }),
    ...(input.server === undefined ? {} : { server: input.server }),
    gameWindowId,
    requestedAt: now(),
  };

  gameLaunchPayloads.set(gameWindowId, gameLaunchPayload);

  await setSession(
    {
      username: input.account.username,
      gameWindowId,
      status: "starting",
      message:
        launchScript === null
          ? "Signing in"
          : `Queued ${scriptName(launchScript)}`,
      ...(launchScript === null
        ? {}
        : { scriptName: scriptName(launchScript) }),
    },
    dependencies.runWindowEffect,
    dependencies.repository,
  );

  gameWindow.once("closed", () => {
    gameLaunchPayloads.delete(gameWindowId);
    void clearSession(
      gameWindowId,
      dependencies.runWindowEffect,
      dependencies.repository,
    ).catch((error) => {
      void Effect.runPromise(
        dependencies.observability.error(
          "accounts",
          "Failed to clear account session on close",
          error,
          { gameWindowId },
        ),
      );
    });
  });

  sendGameLaunchPayload(gameWindow, gameLaunchPayload);

  return { gameWindowId };
};

const serverLoadErrorMessage = (error: unknown): string => {
  const message = error instanceof Error ? error.message : "";
  const statusCode = /Failed to fetch servers: (\d{3})/.exec(message)?.[1];

  return statusCode === undefined
    ? message || "Unable to load servers"
    : `Unable to load login servers (HTTP ${statusCode})`;
};

const runAccountServersEffect = async (
  effect: Effect.Effect<readonly ServerData[], unknown>,
): Promise<AccountGameServersResult> => {
  try {
    const servers = await Effect.runPromise(effect);
    return {
      refreshAvailableAt:
        lastServerRefreshRequestTime === 0
          ? 0
          : lastServerRefreshRequestTime + ACCOUNT_SERVER_REFRESH_COOLDOWN_MS,
      servers: servers.map(toAccountGameServer),
    };
  } catch (error) {
    throw new Error(serverLoadErrorMessage(error));
  }
};

export const registerAccountManagerIpcHandlers = (
  runWindowEffect: WindowEffectRunner,
): Effect.Effect<
  void,
  never,
  | AccountManagerRepository
  | MainIpc
  | Observability
  | Scope.Scope
  | WorkspaceFiles
> =>
  Effect.gen(function* () {
    const ipc = yield* MainIpc;
    const observability = yield* Observability;

    const withServices = <A>(
      run: (services: {
        readonly repository: AccountManagerRepositoryShape;
        readonly workspace: WorkspaceFilesShape;
      }) => Promise<A>,
    ) =>
      Effect.gen(function* () {
        const repository = yield* AccountManagerRepository;
        const workspace = yield* WorkspaceFiles;
        return yield* Effect.promise(() => run({ repository, workspace }));
      });

    yield* ipc.handle(AccountManagerIpcChannels.getState, (event) =>
      withServices(async ({ repository }) => {
        // Full account state includes passwords; only Account Manager can request it.
        await requireAccountManagerSender(event, runWindowEffect);
        return await toState(repository);
      }),
    );

    yield* ipc.handle(AccountManagerIpcChannels.getServers, () =>
      Effect.promise(() =>
        runAccountServersEffect(getCachedAccountServers(observability)),
      ),
    );

    yield* ipc.handle(AccountManagerIpcChannels.refreshServers, () =>
      Effect.promise(async () => {
        const timestamp = now();
        if (
          lastServerRefreshRequestTime > 0 &&
          timestamp - lastServerRefreshRequestTime <
            ACCOUNT_SERVER_REFRESH_COOLDOWN_MS
        ) {
          return await runAccountServersEffect(
            getCachedAccountServers(observability),
          );
        }

        lastServerRefreshRequestTime = timestamp;
        return await runAccountServersEffect(
          refreshAccountServers(observability),
        );
      }),
    );

    yield* ipc.handle(AccountManagerIpcChannels.getGameLaunch, (event) =>
      withServices(async ({ repository, workspace }) => {
        const gameWindowId = getEventWindowId(event);
        if (gameWindowId === null) {
          return null;
        }

        const payload = gameLaunchPayloads.get(gameWindowId);
        if (!payload) {
          return null;
        }

        try {
          return await refreshGameLaunchScript(payload, workspace);
        } catch (error) {
          if (payload.script !== undefined) {
            await setSession(
              {
                username: payload.account.username,
                gameWindowId,
                status: "failed",
                scriptName: scriptName(payload.script),
                message: scriptRefreshErrorMessage(payload.script, error),
              },
              runWindowEffect,
              repository,
            );
          }
          throw error;
        }
      }),
    );

    yield* ipc.handle(AccountManagerIpcChannels.createAccount, (event, draft) =>
      withServices(async ({ repository }) => {
        await requireAccountManagerSender(event, runWindowEffect);
        const accountDraft = normalizeDraft(draft);
        const storage = await readStorage(repository);
        if (hasAccountUsername(storage.accounts, accountDraft.username)) {
          throw new Error("An account with this username already exists");
        }

        await writeStorage(repository, {
          ...storage,
          accounts: [...storage.accounts, accountDraft],
        });

        return await publishStateToAccountManager(runWindowEffect, repository);
      }),
    );

    yield* ipc.handle(
      AccountManagerIpcChannels.updateAccount,
      (event, username, patch) =>
        withServices(async ({ repository }) => {
          await requireAccountManagerSender(event, runWindowEffect);
          const currentUsername = normalizeRequiredString(username, "username");
          const accountPatch = normalizePatch(patch);
          const storage = await readStorage(repository);
          const nextUsername = accountPatch.username ?? currentUsername;
          if (
            hasAccountUsername(storage.accounts, nextUsername, {
              exceptUsername: currentUsername,
            })
          ) {
            throw new Error("An account with this username already exists");
          }

          let found = false;
          const nextAccounts = storage.accounts.map((account) => {
            if (account.username !== currentUsername) {
              return account;
            }

            found = true;
            return {
              ...account,
              ...accountPatch,
              label: accountPatch.label ?? account.label,
            };
          });

          if (!found) {
            throw new Error("Account not found");
          }

          if (currentUsername !== nextUsername) {
            for (const [gameWindowId, session] of sessions) {
              if (session.username === currentUsername) {
                sessions.set(gameWindowId, {
                  ...session,
                  username: nextUsername,
                  updatedAt: now(),
                });
              }
            }
          }

          await writeStorage(repository, {
            accounts: nextAccounts,
            groups: renameGroupMemberUsername(
              storage.groups,
              currentUsername,
              nextUsername,
            ),
          });
          return await publishStateToAccountManager(
            runWindowEffect,
            repository,
          );
        }),
    );

    yield* ipc.handle(
      AccountManagerIpcChannels.deleteAccount,
      (event, username) =>
        withServices(async ({ repository }) => {
          await requireAccountManagerSender(event, runWindowEffect);
          const accountUsername = normalizeRequiredString(username, "username");
          const storage = await readStorage(repository);
          const nextAccounts = storage.accounts.filter(
            (account) => account.username !== accountUsername,
          );

          if (nextAccounts.length === storage.accounts.length) {
            throw new Error("Account not found");
          }

          for (const [gameWindowId, session] of sessions) {
            if (session.username === accountUsername) {
              sessions.delete(gameWindowId);
            }
          }
          await writeStorage(repository, {
            accounts: nextAccounts,
            groups: removeGroupMemberUsername(storage.groups, accountUsername),
          });
          return await publishStateToAccountManager(
            runWindowEffect,
            repository,
          );
        }),
    );

    yield* ipc.handle(AccountManagerIpcChannels.createGroup, (event, draft) =>
      withServices(async ({ repository }) => {
        await requireAccountManagerSender(event, runWindowEffect);
        const storage = await readStorage(repository);
        const groupDraft = normalizeGroupDraft(draft, storage.accounts);
        if (hasGroupName(storage.groups, groupDraft.name)) {
          throw new Error("A group with this name already exists");
        }

        await writeStorage(repository, {
          ...storage,
          groups: {
            ...storage.groups,
            [groupDraft.name]: groupDraft.usernames,
          },
        });

        return await publishStateToAccountManager(runWindowEffect, repository);
      }),
    );

    yield* ipc.handle(
      AccountManagerIpcChannels.updateGroup,
      (event, name, patch) =>
        withServices(async ({ repository }) => {
          await requireAccountManagerSender(event, runWindowEffect);
          const currentName = normalizeRequiredString(name, "group name");
          const storage = await readStorage(repository);
          const existingName = findGroupName(storage.groups, currentName);
          if (existingName === undefined) {
            throw new Error("Group not found");
          }

          const groupPatch = normalizeGroupPatch(patch, storage.accounts);
          const nextName = groupPatch.name ?? existingName;
          if (
            hasGroupName(storage.groups, nextName, {
              exceptName: existingName,
            })
          ) {
            throw new Error("A group with this name already exists");
          }

          const groups: Record<string, readonly string[]> = {};
          for (const [groupName, usernames] of Object.entries(storage.groups)) {
            if (groupName === existingName) {
              groups[nextName] = groupPatch.usernames ?? usernames;
            } else {
              groups[groupName] = usernames;
            }
          }

          await writeStorage(repository, {
            ...storage,
            groups,
          });

          return await publishStateToAccountManager(
            runWindowEffect,
            repository,
          );
        }),
    );

    yield* ipc.handle(AccountManagerIpcChannels.deleteGroup, (event, name) =>
      withServices(async ({ repository }) => {
        await requireAccountManagerSender(event, runWindowEffect);
        const groupName = normalizeRequiredString(name, "group name");
        const storage = await readStorage(repository);
        const existingName = findGroupName(storage.groups, groupName);
        if (existingName === undefined) {
          throw new Error("Group not found");
        }

        const groups: Record<string, readonly string[]> = {};
        for (const [name, usernames] of Object.entries(storage.groups)) {
          if (name !== existingName) {
            groups[name] = usernames;
          }
        }

        await writeStorage(repository, {
          ...storage,
          groups,
        });

        return await publishStateToAccountManager(runWindowEffect, repository);
      }),
    );

    yield* ipc.handle(AccountManagerIpcChannels.launch, (event, request) =>
      withServices(async ({ repository, workspace }) => {
        await requireAccountManagerSender(event, runWindowEffect);
        const launchRequest = normalizeLaunchRequest(request);
        const accounts = await readAccounts(repository);
        const account = accounts.find(
          (candidate) => candidate.username === launchRequest.username,
        );

        if (!account) {
          throw new Error("Account not found");
        }

        return await startAccountGameLaunch(
          {
            account,
            ...(launchRequest.script === undefined
              ? {}
              : { script: launchRequest.script }),
            ...(launchRequest.server === undefined
              ? {}
              : { server: launchRequest.server }),
          },
          {
            runWindowEffect,
            repository,
            workspace,
            observability,
          },
        );
      }),
    );

    yield* ipc.handle(
      AccountManagerIpcChannels.updateScriptStatus,
      (event, update) =>
        withServices(async ({ repository }) => {
          if (typeof update !== "object" || update === null) {
            throw new Error("Status update must be an object");
          }

          const input = update as Partial<AccountScriptStatusUpdate>;
          const gameWindowId = normalizeGameWindowId(input.gameWindowId);
          if (getEventWindowId(event) !== gameWindowId) {
            throw new Error("Status update sender does not match game window");
          }

          const activeUsername =
            gameLaunchPayloads.get(gameWindowId)?.account.username ??
            sessions.get(gameWindowId)?.username;
          if (
            typeof input.username !== "string" ||
            input.username !== activeUsername
          ) {
            throw new Error("Status update is not active for this game window");
          }

          const status = input.status;
          if (
            status !== "idle" &&
            status !== "starting" &&
            status !== "running" &&
            status !== "stopped" &&
            status !== "failed"
          ) {
            throw new Error("Invalid script status");
          }

          await setSession(
            {
              username: normalizeRequiredString(input.username, "username"),
              status,
              gameWindowId,
              ...(input.scriptName === undefined
                ? {}
                : { scriptName: input.scriptName }),
              ...(input.message === undefined
                ? {}
                : { message: input.message }),
            },
            runWindowEffect,
            repository,
          );
        }),
    );
  });

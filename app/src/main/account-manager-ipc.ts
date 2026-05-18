import { BrowserWindow, ipcMain, type IpcMainInvokeEvent } from "electron";
import { get } from "https";
import type { ServerData } from "@vexed/game";
import { Data, Effect } from "effect";
import {
  ACCOUNT_SERVER_REFRESH_COOLDOWN_MS,
  AccountManagerIpcChannels,
  type AccountGameLaunchPayload,
  type AccountGameServer,
  type AccountGameServersResult,
  type AccountLaunchRequest,
  type AccountManagerState,
  type AccountScriptSession,
  type AccountScriptStatusUpdate,
  type ManagedAccount,
  type ManagedAccountDraft,
  type ManagedAccountPatch,
  type ScriptExecutePayload,
} from "../shared/ipc";
import { WindowIds } from "../shared/windows";
import { getArtixLauncherRequestHeaders } from "./artix-launcher-headers";
import { refreshCachedScriptPayload } from "./scripting";
import * as Files from "./settings/Files";
import { WindowService, type WindowEffectRunner } from "./windows";

const SERVERS_API_URL = "https://game.aq.com/game/api/data/servers";
const SERVERS_CACHE_TTL_MS = 5 * 60 * 1_000;
const SERVER_REQUEST_TIMEOUT_MS = 10_000;

let accountManagerIpcRegistered = false;
let lastServerRefreshRequestTime = 0;
let cachedServers: ServerData[] = [];
let lastServerFetchTime = 0;

const sessions = new Map<number, AccountScriptSession>();
const gameLaunchPayloads = new Map<number, AccountGameLaunchPayload>();

const now = (): number => Date.now();

const getAccountsPath = (): string => Files.appDataJoin("accounts.json");

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

const isManagedAccount = (value: unknown): value is ManagedAccount => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const account = value as Partial<ManagedAccount>;
  return (
    typeof account.label === "string" &&
    typeof account.username === "string" &&
    typeof account.password === "string"
  );
};

const normalizeStoredAccount = (account: ManagedAccount): ManagedAccount => ({
  label: account.label,
  username: account.username,
  password: account.password,
});

const dedupeAccountsByUsername = (
  accounts: readonly ManagedAccount[],
): readonly ManagedAccount[] => {
  const seen = new Set<string>();
  const nextAccounts: ManagedAccount[] = [];

  for (const account of accounts) {
    const key = account.username.toLowerCase();
    if (seen.has(key)) {
      console.error("Ignoring duplicate account username", account.username);
      continue;
    }

    seen.add(key);
    nextAccounts.push(account);
  }

  return nextAccounts;
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

const normalizeAccounts = (value: unknown): readonly ManagedAccount[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return dedupeAccountsByUsername(
    value.filter(isManagedAccount).map(normalizeStoredAccount),
  );
};

const readAccounts = async (): Promise<readonly ManagedAccount[]> =>
  Files.ensureJson(getAccountsPath(), [], normalizeAccounts);

const writeAccounts = async (
  accounts: readonly ManagedAccount[],
): Promise<void> => {
  Files.writeJson(
    getAccountsPath(),
    dedupeAccountsByUsername(accounts).map(normalizeStoredAccount),
  );
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

const toState = async (): Promise<AccountManagerState> => ({
  accounts: await readAccounts(),
  sessions: visibleSessions(),
  storagePath: getAccountsPath(),
});

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

const getCachedAccountServers = (): Effect.Effect<
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
          ? Effect.sync((): unknown => {
              console.error("Failed to fetch servers", error);
              return cachedServers;
            })
          : Effect.fail(error),
      ),
    );

    if (!Array.isArray(data)) {
      if (cachedServers.length > 0) {
        yield* Effect.sync(() => {
          console.error("Invalid servers payload", data);
        });
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

const refreshAccountServers = (): Effect.Effect<
  readonly ServerData[],
  AccountServersFetchError | AccountServersPayloadError
> =>
  Effect.sync(() => {
    lastServerFetchTime = 0;
  }).pipe(Effect.flatMap(() => getCachedAccountServers()));

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
): Promise<AccountManagerState> => {
  const state = await toState();
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

  await publishStateToAccountManager(runWindowEffect);
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
): Promise<AccountGameLaunchPayload> => {
  if (payload.script === undefined) {
    return payload;
  }

  const script = await refreshCachedScriptPayload(payload.script);
  const nextPayload: AccountGameLaunchPayload = {
    ...payload,
    script,
  };

  gameLaunchPayloads.set(payload.gameWindowId, nextPayload);
  return nextPayload;
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
): void => {
  if (accountManagerIpcRegistered) {
    return;
  }

  ipcMain.handle(AccountManagerIpcChannels.getState, async (event) => {
    // Full account state includes passwords; only Account Manager can request it.
    await requireAccountManagerSender(event, runWindowEffect);
    return await toState();
  });

  ipcMain.handle(AccountManagerIpcChannels.getServers, async () => {
    return await runAccountServersEffect(getCachedAccountServers());
  });

  ipcMain.handle(AccountManagerIpcChannels.refreshServers, async () => {
    const timestamp = now();
    if (
      lastServerRefreshRequestTime > 0 &&
      timestamp - lastServerRefreshRequestTime <
        ACCOUNT_SERVER_REFRESH_COOLDOWN_MS
    ) {
      return await runAccountServersEffect(getCachedAccountServers());
    }

    lastServerRefreshRequestTime = timestamp;
    return await runAccountServersEffect(refreshAccountServers());
  });

  ipcMain.handle(AccountManagerIpcChannels.getGameLaunch, async (event) => {
    const gameWindowId = getEventWindowId(event);
    if (gameWindowId === null) {
      return null;
    }

    const payload = gameLaunchPayloads.get(gameWindowId);
    if (!payload) {
      return null;
    }

    try {
      return await refreshGameLaunchScript(payload);
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
        );
      }
      throw error;
    }
  });

  ipcMain.handle(
    AccountManagerIpcChannels.createAccount,
    async (event, draft: unknown) => {
      await requireAccountManagerSender(event, runWindowEffect);
      const accountDraft = normalizeDraft(draft);
      const accounts = await readAccounts();
      if (hasAccountUsername(accounts, accountDraft.username)) {
        throw new Error("An account with this username already exists");
      }

      await writeAccounts([...accounts, accountDraft]);

      return await publishStateToAccountManager(runWindowEffect);
    },
  );

  ipcMain.handle(
    AccountManagerIpcChannels.updateAccount,
    async (event, username: unknown, patch: unknown) => {
      await requireAccountManagerSender(event, runWindowEffect);
      const currentUsername = normalizeRequiredString(username, "username");
      const accountPatch = normalizePatch(patch);
      const accounts = await readAccounts();
      const nextUsername = accountPatch.username ?? currentUsername;
      if (
        hasAccountUsername(accounts, nextUsername, {
          exceptUsername: currentUsername,
        })
      ) {
        throw new Error("An account with this username already exists");
      }

      let found = false;
      const nextAccounts = accounts.map((account) => {
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

      await writeAccounts(nextAccounts);
      return await publishStateToAccountManager(runWindowEffect);
    },
  );

  ipcMain.handle(
    AccountManagerIpcChannels.deleteAccount,
    async (event, username: unknown) => {
      await requireAccountManagerSender(event, runWindowEffect);
      const accountUsername = normalizeRequiredString(username, "username");
      const accounts = await readAccounts();
      const nextAccounts = accounts.filter(
        (account) => account.username !== accountUsername,
      );

      if (nextAccounts.length === accounts.length) {
        throw new Error("Account not found");
      }

      for (const [gameWindowId, session] of sessions) {
        if (session.username === accountUsername) {
          sessions.delete(gameWindowId);
        }
      }
      await writeAccounts(nextAccounts);
      return await publishStateToAccountManager(runWindowEffect);
    },
  );

  ipcMain.handle(
    AccountManagerIpcChannels.launch,
    async (event, request: unknown) => {
      await requireAccountManagerSender(event, runWindowEffect);
      const launchRequest = normalizeLaunchRequest(request);
      const accounts = await readAccounts();
      const account = accounts.find(
        (candidate) => candidate.username === launchRequest.username,
      );

      if (!account) {
        throw new Error("Account not found");
      }

      const requestedScript = launchRequest.script ?? null;
      const launchScript =
        requestedScript === null
          ? null
          : await refreshCachedScriptPayload(requestedScript);

      const gameWindow = await runWindowEffect(
        Effect.gen(function* () {
          const windows = yield* WindowService;
          return yield* windows.openGameWindow;
        }),
      );
      const gameWindowId = gameWindow.id;
      const gameLaunchPayload: AccountGameLaunchPayload = {
        account,
        ...(launchScript === null ? {} : { script: launchScript }),
        ...(launchRequest.server === undefined
          ? {}
          : { server: launchRequest.server }),
        gameWindowId,
        requestedAt: now(),
      };

      gameLaunchPayloads.set(gameWindowId, gameLaunchPayload);

      await setSession(
        {
          username: account.username,
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
        runWindowEffect,
      );

      gameWindow.once("closed", () => {
        gameLaunchPayloads.delete(gameWindowId);
        void setSession(
          {
            username: account.username,
            gameWindowId,
            status: "stopped",
            message: "Game window closed",
            ...(launchScript === null
              ? {}
              : { scriptName: scriptName(launchScript) }),
          },
          runWindowEffect,
        ).catch((error) => {
          console.error("Failed to update account session on close:", error);
        });
      });

      sendGameLaunchPayload(gameWindow, gameLaunchPayload);

      return { gameWindowId };
    },
  );

  ipcMain.handle(
    AccountManagerIpcChannels.updateScriptStatus,
    async (event, update: unknown) => {
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
          ...(input.message === undefined ? {} : { message: input.message }),
        },
        runWindowEffect,
      );
    },
  );

  accountManagerIpcRegistered = true;
};

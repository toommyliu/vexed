import { contextBridge, ipcRenderer } from "electron";
import {
  applyAppearanceSnapshotToDocument,
  readAppearanceSnapshotArgument,
} from "../shared/appearance-snapshot";
import {
  AccountManagerIpcChannels,
  ArmyIpcChannels,
  SettingsIpcChannels,
  ScriptingIpcChannels,
  WindowIpcChannels,
  type AccountGameLaunchPayload,
  type AccountGameServersResult,
  type AccountLaunchRequest,
  type AccountLaunchResult,
  type AccountManagerState,
  type AccountScriptStatusUpdate,
  type AppBridge,
  type ArmyBarrierPayload,
  type ArmyConfigPayload,
  type ArmyLeavePayload,
  type ArmySessionPayload,
  type ArmyStartPayload,
  type ArmyStatusPayload,
  type ArmyStatusResult,
  type AppSettings,
  type AppPlatform,
  type AppearancePatch,
  type HotkeysPatch,
  type ManagedAccountDraft,
  type ManagedAccountPatch,
  type PreferencesPatch,
  type ScriptExecutePayload,
} from "../shared/ipc";
import type { WindowId } from "../shared/windows";

const applyInitialAppearanceSnapshot = (): void => {
  const snapshot = readAppearanceSnapshotArgument(process.argv);
  if (!snapshot || !document.documentElement) {
    return;
  }

  applyAppearanceSnapshotToDocument(document.documentElement, snapshot);
};

applyInitialAppearanceSnapshot();

const platform: AppPlatform =
  process.platform === "darwin"
    ? "mac"
    : process.platform === "win32"
      ? "windows"
      : "linux";

const accountGameLaunchListeners = new Set<
  (payload: AccountGameLaunchPayload) => void
>();
const pendingAccountGameLaunchPayloads: AccountGameLaunchPayload[] = [];
let lastDeliveredAccountGameLaunchKey = "";

const accountGameLaunchKey = (payload: AccountGameLaunchPayload): string =>
  `${payload.gameWindowId}:${payload.requestedAt}`;

const deliverAccountGameLaunchPayload = (
  payload: AccountGameLaunchPayload,
): void => {
  const key = accountGameLaunchKey(payload);
  if (key === lastDeliveredAccountGameLaunchKey) {
    return;
  }

  if (accountGameLaunchListeners.size === 0) {
    if (
      !pendingAccountGameLaunchPayloads.some(
        (pendingPayload) => accountGameLaunchKey(pendingPayload) === key,
      )
    ) {
      pendingAccountGameLaunchPayloads.push(payload);
    }
    return;
  }

  lastDeliveredAccountGameLaunchKey = key;

  for (const listener of accountGameLaunchListeners) {
    listener(payload);
  }
};

ipcRenderer.on(
  AccountManagerIpcChannels.gameLaunch,
  (_event, payload: AccountGameLaunchPayload) => {
    deliverAccountGameLaunchPayload(payload);
  },
);

const bridge: AppBridge = {
  accounts: {
    getState: async () => {
      return (await ipcRenderer.invoke(
        AccountManagerIpcChannels.getState,
      )) as AccountManagerState;
    },
    getServers: async () => {
      return (await ipcRenderer.invoke(
        AccountManagerIpcChannels.getServers,
      )) as AccountGameServersResult;
    },
    refreshServers: async () => {
      return (await ipcRenderer.invoke(
        AccountManagerIpcChannels.refreshServers,
      )) as AccountGameServersResult;
    },
    getGameLaunch: async () => {
      return (await ipcRenderer.invoke(
        AccountManagerIpcChannels.getGameLaunch,
      )) as AccountGameLaunchPayload | null;
    },
    createAccount: async (draft: ManagedAccountDraft) => {
      return (await ipcRenderer.invoke(
        AccountManagerIpcChannels.createAccount,
        draft,
      )) as AccountManagerState;
    },
    updateAccount: async (username: string, patch: ManagedAccountPatch) => {
      return (await ipcRenderer.invoke(
        AccountManagerIpcChannels.updateAccount,
        username,
        patch,
      )) as AccountManagerState;
    },
    deleteAccount: async (username: string) => {
      return (await ipcRenderer.invoke(
        AccountManagerIpcChannels.deleteAccount,
        username,
      )) as AccountManagerState;
    },
    launch: async (request: AccountLaunchRequest) => {
      return (await ipcRenderer.invoke(
        AccountManagerIpcChannels.launch,
        request,
      )) as AccountLaunchResult;
    },
    updateScriptStatus: async (update: AccountScriptStatusUpdate) => {
      await ipcRenderer.invoke(
        AccountManagerIpcChannels.updateScriptStatus,
        update,
      );
    },
    onChanged: (listener) => {
      const subscription = (_event: unknown, state: AccountManagerState) => {
        listener(state);
      };

      ipcRenderer.on(AccountManagerIpcChannels.changed, subscription);

      return () => {
        ipcRenderer.removeListener(
          AccountManagerIpcChannels.changed,
          subscription,
        );
      };
    },
    onGameLaunch: (listener) => {
      accountGameLaunchListeners.add(listener);

      while (pendingAccountGameLaunchPayloads.length > 0) {
        const payload = pendingAccountGameLaunchPayloads.shift();
        if (payload) {
          deliverAccountGameLaunchPayload(payload);
        }
      }

      void ipcRenderer
        .invoke(AccountManagerIpcChannels.getGameLaunch)
        .then((payload: unknown) => {
          if (payload) {
            deliverAccountGameLaunchPayload(
              payload as AccountGameLaunchPayload,
            );
          }
        })
        .catch((error: unknown) => {
          console.error("Failed to get account game launch:", error);
        });

      return () => {
        accountGameLaunchListeners.delete(listener);
      };
    },
  },
  army: {
    loadConfig: async (fileName: string) => {
      return (await ipcRenderer.invoke(
        ArmyIpcChannels.loadConfig,
        fileName,
      )) as ArmyConfigPayload;
    },
    start: async (payload: ArmyStartPayload) => {
      return (await ipcRenderer.invoke(
        ArmyIpcChannels.start,
        payload,
      )) as ArmySessionPayload;
    },
    leave: async (payload: ArmyLeavePayload) => {
      await ipcRenderer.invoke(ArmyIpcChannels.leave, payload);
    },
    barrier: async (payload: ArmyBarrierPayload) => {
      await ipcRenderer.invoke(ArmyIpcChannels.barrier, payload);
    },
    status: async (payload: ArmyStatusPayload) => {
      return (await ipcRenderer.invoke(
        ArmyIpcChannels.status,
        payload,
      )) as ArmyStatusResult;
    },
  },
  platform: {
    os: platform,
  },
  scripting: {
    openFile: async () => {
      return (await ipcRenderer.invoke(
        ScriptingIpcChannels.openFile,
      )) as ScriptExecutePayload | null;
    },
    readFile: async (path: string) => {
      return (await ipcRenderer.invoke(
        ScriptingIpcChannels.readFile,
        path,
      )) as ScriptExecutePayload;
    },
    onExecute: (listener) => {
      const subscription = (_event: unknown, payload: ScriptExecutePayload) => {
        listener(payload);
      };

      ipcRenderer.on(ScriptingIpcChannels.execute, subscription);

      return () => {
        ipcRenderer.removeListener(ScriptingIpcChannels.execute, subscription);
      };
    },
    onStop: (listener) => {
      const subscription = (_event: unknown) => {
        listener();
      };

      ipcRenderer.on(ScriptingIpcChannels.stop, subscription);

      return () => {
        ipcRenderer.removeListener(ScriptingIpcChannels.stop, subscription);
      };
    },
  },
  settings: {
    get: async () => {
      return (await ipcRenderer.invoke(SettingsIpcChannels.get)) as AppSettings;
    },
    updatePreferences: async (patch: PreferencesPatch) => {
      return (await ipcRenderer.invoke(
        SettingsIpcChannels.updatePreferences,
        patch,
      )) as AppSettings;
    },
    updateAppearance: async (patch: AppearancePatch) => {
      return (await ipcRenderer.invoke(
        SettingsIpcChannels.updateAppearance,
        patch,
      )) as AppSettings;
    },
    updateHotkeys: async (patch: HotkeysPatch) => {
      return (await ipcRenderer.invoke(
        SettingsIpcChannels.updateHotkeys,
        patch,
      )) as AppSettings;
    },
    resetAppearance: async () => {
      return (await ipcRenderer.invoke(
        SettingsIpcChannels.resetAppearance,
      )) as AppSettings;
    },
    resetHotkeys: async () => {
      return (await ipcRenderer.invoke(
        SettingsIpcChannels.resetHotkeys,
      )) as AppSettings;
    },
    onChanged: (listener) => {
      const subscription = (_event: unknown, settings: AppSettings) => {
        listener(settings);
      };

      ipcRenderer.on(SettingsIpcChannels.changed, subscription);

      return () => {
        ipcRenderer.removeListener(SettingsIpcChannels.changed, subscription);
      };
    },
  },
  windows: {
    open: async (id: WindowId) => {
      await ipcRenderer.invoke(WindowIpcChannels.open, id);
    },
  },
};

contextBridge.exposeInMainWorld("ipc", bridge);

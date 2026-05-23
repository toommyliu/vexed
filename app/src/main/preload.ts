import { contextBridge, ipcRenderer } from "electron";
import {
  applyAppearanceSnapshotToDocument,
  readAppearanceSnapshotArgument,
} from "../shared/appearance-snapshot";
import {
  AccountManagerIpcChannels,
  ArmyIpcChannels,
  CombatProfilesIpcChannels,
  EnvironmentIpcChannels,
  FollowerIpcChannels,
  PacketsIpcChannels,
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
  type CombatProfile,
  type CombatProfileAutoAttackState,
  type CombatProfileLibrary,
  type EnvironmentItemRules,
  type EnvironmentQuestAutoRegisterOptions,
  type EnvironmentState,
  type FollowerRequestMessage,
  type FollowerResponseMessage,
  type FollowerStartPayload,
  type FollowerState,
  type HotkeysPatch,
  type ManagedAccountGroupDraft,
  type ManagedAccountGroupPatch,
  type ManagedAccountDraft,
  type ManagedAccountPatch,
  type PacketCapturedPayload,
  type PacketQueuePayload,
  type PacketsRequestMessage,
  type PacketsResponseMessage,
  type PacketsStatusPayload,
  type PacketSendPayload,
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

const environmentFetchBoostsListeners = new Set<
  () => Promise<readonly string[]> | readonly string[]
>();

const followerGetStateRequestListeners = new Set<
  () => Promise<FollowerState> | FollowerState
>();
const followerMeRequestListeners = new Set<() => Promise<string> | string>();
const followerStartRequestListeners = new Set<
  (payload: FollowerStartPayload) => Promise<FollowerState> | FollowerState
>();
const followerStopRequestListeners = new Set<
  () => Promise<FollowerState> | FollowerState
>();
const packetRequestListeners = new Set<
  (request: PacketsRequestMessage) => void
>();

const latestEnvironmentFetchBoostsListener = ():
  | (() => Promise<readonly string[]> | readonly string[])
  | undefined => {
  let listener:
    | (() => Promise<readonly string[]> | readonly string[])
    | undefined;
  for (const next of environmentFetchBoostsListeners) {
    listener = next;
  }
  return listener;
};

const latestSetListener = <A>(listeners: ReadonlySet<A>): A | undefined => {
  let listener: A | undefined;
  for (const next of listeners) {
    listener = next;
  }
  return listener;
};

const followerRequestErrorMessage = (cause: unknown): string =>
  cause instanceof Error && cause.message !== ""
    ? cause.message
    : "Follower request failed";

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

ipcRenderer.on(
  EnvironmentIpcChannels.fetchBoostsRequest,
  (_event, requestId: string) => {
    const listener = latestEnvironmentFetchBoostsListener();
    void Promise.resolve(listener?.() ?? [])
      .then((boosts) => {
        ipcRenderer.send(
          EnvironmentIpcChannels.fetchBoostsResponse,
          requestId,
          boosts,
        );
      })
      .catch((error: unknown) => {
        console.error("Failed to fetch environment boosts:", error);
        ipcRenderer.send(
          EnvironmentIpcChannels.fetchBoostsResponse,
          requestId,
          [],
        );
      });
  },
);

ipcRenderer.on(
  FollowerIpcChannels.request,
  (_event, request: FollowerRequestMessage) => {
    const respond = (message: FollowerResponseMessage): void => {
      ipcRenderer.send(FollowerIpcChannels.response, message);
    };

    const run = async (): Promise<unknown> => {
      if (request.kind === "getState") {
        const listener = latestSetListener(followerGetStateRequestListeners);
        if (!listener) {
          throw new Error("Follower is not available in this game window");
        }
        return await listener();
      }

      if (request.kind === "me") {
        const listener = latestSetListener(followerMeRequestListeners);
        if (!listener) {
          throw new Error("Follower is not available in this game window");
        }
        return await listener();
      }

      if (request.kind === "start") {
        const listener = latestSetListener(followerStartRequestListeners);
        if (!listener) {
          throw new Error("Follower is not available in this game window");
        }
        return await listener(request.payload as FollowerStartPayload);
      }

      if (request.kind === "stop") {
        const listener = latestSetListener(followerStopRequestListeners);
        if (!listener) {
          throw new Error("Follower is not available in this game window");
        }
        return await listener();
      }

      const unknownRequest = request as { readonly kind: unknown };
      throw new Error(
        `Unsupported follower request kind: ${String(unknownRequest.kind)}`,
      );
    };

    void run()
      .then((value) =>
        respond({ requestId: request.requestId, ok: true, value }),
      )
      .catch((cause: unknown) =>
        respond({
          requestId: request.requestId,
          ok: false,
          error: followerRequestErrorMessage(cause),
        }),
      );
  },
);

ipcRenderer.on(
  PacketsIpcChannels.request,
  (_event, request: PacketsRequestMessage) => {
    for (const listener of packetRequestListeners) {
      listener(request);
    }
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
    createGroup: async (draft: ManagedAccountGroupDraft) => {
      return (await ipcRenderer.invoke(
        AccountManagerIpcChannels.createGroup,
        draft,
      )) as AccountManagerState;
    },
    updateGroup: async (name: string, patch: ManagedAccountGroupPatch) => {
      return (await ipcRenderer.invoke(
        AccountManagerIpcChannels.updateGroup,
        name,
        patch,
      )) as AccountManagerState;
    },
    deleteGroup: async (name: string) => {
      return (await ipcRenderer.invoke(
        AccountManagerIpcChannels.deleteGroup,
        name,
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
  combatProfiles: {
    getState: async () => {
      return (await ipcRenderer.invoke(
        CombatProfilesIpcChannels.getState,
      )) as CombatProfileLibrary;
    },
    saveProfile: async (profile: CombatProfile) => {
      return (await ipcRenderer.invoke(
        CombatProfilesIpcChannels.saveProfile,
        profile,
      )) as CombatProfileLibrary;
    },
    deleteProfile: async (profileId: string) => {
      return (await ipcRenderer.invoke(
        CombatProfilesIpcChannels.deleteProfile,
        profileId,
      )) as CombatProfileLibrary;
    },
    setAutoAttack: async (state: CombatProfileAutoAttackState) => {
      return (await ipcRenderer.invoke(
        CombatProfilesIpcChannels.setAutoAttack,
        state,
      )) as CombatProfileLibrary;
    },
    onChanged: (listener) => {
      const subscription = (_event: unknown, state: CombatProfileLibrary) => {
        listener(state);
      };

      ipcRenderer.on(CombatProfilesIpcChannels.changed, subscription);

      return () => {
        ipcRenderer.removeListener(
          CombatProfilesIpcChannels.changed,
          subscription,
        );
      };
    },
  },
  environment: {
    getState: async () => {
      return (await ipcRenderer.invoke(
        EnvironmentIpcChannels.getState,
      )) as EnvironmentState;
    },
    clear: async () => {
      return (await ipcRenderer.invoke(
        EnvironmentIpcChannels.clear,
      )) as EnvironmentState;
    },
    addQuest: async (
      questId: number | string,
      rewardItemId?: number | string,
    ) => {
      return (await ipcRenderer.invoke(
        EnvironmentIpcChannels.addQuest,
        questId,
        rewardItemId,
      )) as EnvironmentState;
    },
    removeQuest: async (questId: number | string) => {
      return (await ipcRenderer.invoke(
        EnvironmentIpcChannels.removeQuest,
        questId,
      )) as EnvironmentState;
    },
    setQuestReward: async (
      questId: number | string,
      rewardItemId: number | string,
    ) => {
      return (await ipcRenderer.invoke(
        EnvironmentIpcChannels.setQuestReward,
        questId,
        rewardItemId,
      )) as EnvironmentState;
    },
    clearQuestReward: async (questId: number | string) => {
      return (await ipcRenderer.invoke(
        EnvironmentIpcChannels.clearQuestReward,
        questId,
      )) as EnvironmentState;
    },
    clearQuests: async () => {
      return (await ipcRenderer.invoke(
        EnvironmentIpcChannels.clearQuests,
      )) as EnvironmentState;
    },
    setQuestAutoRegister: async (
      options: EnvironmentQuestAutoRegisterOptions,
    ) => {
      return (await ipcRenderer.invoke(
        EnvironmentIpcChannels.setQuestAutoRegister,
        options,
      )) as EnvironmentState;
    },
    addItem: async (name: string) => {
      return (await ipcRenderer.invoke(
        EnvironmentIpcChannels.addItem,
        name,
      )) as EnvironmentState;
    },
    removeItem: async (name: string) => {
      return (await ipcRenderer.invoke(
        EnvironmentIpcChannels.removeItem,
        name,
      )) as EnvironmentState;
    },
    setItemRules: async (rules: EnvironmentItemRules) => {
      return (await ipcRenderer.invoke(
        EnvironmentIpcChannels.setItemRules,
        rules,
      )) as EnvironmentState;
    },
    clearItems: async () => {
      return (await ipcRenderer.invoke(
        EnvironmentIpcChannels.clearItems,
      )) as EnvironmentState;
    },
    addBoost: async (name: string) => {
      return (await ipcRenderer.invoke(
        EnvironmentIpcChannels.addBoost,
        name,
      )) as EnvironmentState;
    },
    removeBoost: async (name: string) => {
      return (await ipcRenderer.invoke(
        EnvironmentIpcChannels.removeBoost,
        name,
      )) as EnvironmentState;
    },
    clearBoosts: async () => {
      return (await ipcRenderer.invoke(
        EnvironmentIpcChannels.clearBoosts,
      )) as EnvironmentState;
    },
    fetchBoosts: async () => {
      return (await ipcRenderer.invoke(
        EnvironmentIpcChannels.fetchBoosts,
      )) as readonly string[];
    },
    syncToAll: async () => {
      return (await ipcRenderer.invoke(
        EnvironmentIpcChannels.syncToAll,
      )) as EnvironmentState;
    },
    onChanged: (listener) => {
      const subscription = (_event: unknown, state: EnvironmentState) => {
        listener(state);
      };

      ipcRenderer.on(EnvironmentIpcChannels.changed, subscription);

      return () => {
        ipcRenderer.removeListener(
          EnvironmentIpcChannels.changed,
          subscription,
        );
      };
    },
    onFetchBoostsRequest: (listener) => {
      environmentFetchBoostsListeners.add(listener);

      return () => {
        environmentFetchBoostsListeners.delete(listener);
      };
    },
  },
  follower: {
    getState: async () => {
      return (await ipcRenderer.invoke(
        FollowerIpcChannels.getState,
      )) as FollowerState;
    },
    me: async () => {
      return (await ipcRenderer.invoke(FollowerIpcChannels.me)) as string;
    },
    start: async (payload: FollowerStartPayload) => {
      return (await ipcRenderer.invoke(
        FollowerIpcChannels.start,
        payload,
      )) as FollowerState;
    },
    stop: async () => {
      return (await ipcRenderer.invoke(
        FollowerIpcChannels.stop,
      )) as FollowerState;
    },
    publishState: async (state: FollowerState) => {
      await ipcRenderer.invoke(FollowerIpcChannels.publishState, state);
    },
    onChanged: (listener) => {
      const subscription = (_event: unknown, state: FollowerState) => {
        listener(state);
      };

      ipcRenderer.on(FollowerIpcChannels.changed, subscription);

      return () => {
        ipcRenderer.removeListener(FollowerIpcChannels.changed, subscription);
      };
    },
    onGetStateRequest: (listener) => {
      followerGetStateRequestListeners.add(listener);

      return () => {
        followerGetStateRequestListeners.delete(listener);
      };
    },
    onMeRequest: (listener) => {
      followerMeRequestListeners.add(listener);

      return () => {
        followerMeRequestListeners.delete(listener);
      };
    },
    onStartRequest: (listener) => {
      followerStartRequestListeners.add(listener);

      return () => {
        followerStartRequestListeners.delete(listener);
      };
    },
    onStopRequest: (listener) => {
      followerStopRequestListeners.add(listener);

      return () => {
        followerStopRequestListeners.delete(listener);
      };
    },
  },
  packets: {
    startCapture: async () => {
      await ipcRenderer.invoke(PacketsIpcChannels.startCapture);
    },
    stopCapture: async () => {
      await ipcRenderer.invoke(PacketsIpcChannels.stopCapture);
    },
    send: async (payload: PacketSendPayload) => {
      await ipcRenderer.invoke(PacketsIpcChannels.send, payload);
    },
    startQueue: async (payload: PacketQueuePayload) => {
      await ipcRenderer.invoke(PacketsIpcChannels.startQueue, payload);
    },
    stopQueue: async () => {
      await ipcRenderer.invoke(PacketsIpcChannels.stopQueue);
    },
    publishCaptured: async (payload: PacketCapturedPayload) => {
      await ipcRenderer.invoke(PacketsIpcChannels.publishCaptured, payload);
    },
    publishStatus: async (payload: PacketsStatusPayload) => {
      await ipcRenderer.invoke(PacketsIpcChannels.publishStatus, payload);
    },
    onCaptured: (listener) => {
      const subscription = (
        _event: unknown,
        payload: PacketCapturedPayload,
      ) => {
        listener(payload);
      };

      ipcRenderer.on(PacketsIpcChannels.captured, subscription);

      return () => {
        ipcRenderer.removeListener(PacketsIpcChannels.captured, subscription);
      };
    },
    onStatus: (listener) => {
      const subscription = (_event: unknown, payload: PacketsStatusPayload) => {
        listener(payload);
      };

      ipcRenderer.on(PacketsIpcChannels.status, subscription);

      return () => {
        ipcRenderer.removeListener(PacketsIpcChannels.status, subscription);
      };
    },
    onRequest: (listener) => {
      packetRequestListeners.add(listener);

      return () => {
        packetRequestListeners.delete(listener);
      };
    },
    respond: async (response: PacketsResponseMessage) => {
      ipcRenderer.send(PacketsIpcChannels.response, response);
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

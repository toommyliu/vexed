import type { WindowId } from "./windows";
import type {
  ArmyBarrierPayload,
  ArmyConfigPayload,
  ArmyLeavePayload,
  ArmySessionPayload,
  ArmyStartPayload,
  ArmyStatusPayload,
  ArmyStatusResult,
} from "./army";
import type {
  AppSettings,
  AppearancePatch,
  HotkeysPatch,
  PreferencesPatch,
} from "./settings";
import type {
  EnvironmentItemRules,
  EnvironmentQuestAutoRegisterOptions,
  EnvironmentState,
} from "./environment";

export type {
  ArmyBarrierPayload,
  ArmyConfigPayload,
  ArmyLeavePayload,
  ArmySessionPayload,
  ArmyStartPayload,
  ArmyStatusPayload,
  ArmyStatusResult,
} from "./army";

export type {
  AppSettings,
  Appearance,
  AppearancePatch,
  AppLaunchMode,
  Preferences,
  PreferencesPatch,
  HotkeyBindings,
  HotkeysPatch,
  HotkeysSettings,
  ThemeMode,
  ThemeProfile,
  ThemeProfilePatch,
  ThemeRgb,
  ThemeTokenName,
  ThemeVariant,
} from "./settings";

export type {
  EnvironmentItemRules,
  EnvironmentQuestAutoRegisterOptions,
  EnvironmentState,
} from "./environment";

export const ScriptingIpcChannels = {
  execute: "scripting:execute",
  stop: "scripting:stop",
  openFile: "scripting:open-file",
  readFile: "scripting:read-file",
} as const;

export const WindowIpcChannels = {
  open: "windows:open",
} as const;

export const AccountManagerIpcChannels = {
  getState: "account-manager:get-state",
  getServers: "account-manager:get-servers",
  refreshServers: "account-manager:refresh-servers",
  getGameLaunch: "account-manager:get-game-launch",
  createAccount: "account-manager:create-account",
  updateAccount: "account-manager:update-account",
  deleteAccount: "account-manager:delete-account",
  launch: "account-manager:launch",
  updateScriptStatus: "account-manager:update-script-status",
  changed: "account-manager:changed",
  gameLaunch: "account-manager:game-launch",
} as const;

export const ACCOUNT_SERVER_REFRESH_COOLDOWN_MS = 15_000;

export const SettingsIpcChannels = {
  get: "settings:get",
  updatePreferences: "settings:update-preferences",
  updateAppearance: "settings:update-appearance",
  updateHotkeys: "settings:update-hotkeys",
  resetAppearance: "settings:reset-appearance",
  resetHotkeys: "settings:reset-hotkeys",
  changed: "settings:changed",
} as const;

export const ArmyIpcChannels = {
  loadConfig: "army:load-config",
  start: "army:start",
  leave: "army:leave",
  barrier: "army:barrier",
  status: "army:status",
} as const;

export const EnvironmentIpcChannels = {
  getState: "environment:get-state",
  clear: "environment:clear",
  addQuest: "environment:add-quest",
  removeQuest: "environment:remove-quest",
  setQuestReward: "environment:set-quest-reward",
  clearQuestReward: "environment:clear-quest-reward",
  clearQuests: "environment:clear-quests",
  setQuestAutoRegister: "environment:set-quest-auto-register",
  addItem: "environment:add-item",
  removeItem: "environment:remove-item",
  setItemRules: "environment:set-item-rules",
  clearItems: "environment:clear-items",
  addBoost: "environment:add-boost",
  removeBoost: "environment:remove-boost",
  clearBoosts: "environment:clear-boosts",
  fetchBoosts: "environment:fetch-boosts",
  fetchBoostsRequest: "environment:fetch-boosts-request",
  fetchBoostsResponse: "environment:fetch-boosts-response",
  syncToAll: "environment:sync-to-all",
  changed: "environment:changed",
} as const;

export interface ScriptExecutePayload {
  readonly source: string;
  readonly path?: string;
  readonly name?: string;
}

export type AccountScriptStatus =
  | "idle"
  | "starting"
  | "running"
  | "stopped"
  | "failed";

export interface ManagedAccount {
  readonly label: string;
  readonly username: string;
  readonly password: string;
}

export interface ManagedAccountDraft {
  readonly label?: string;
  readonly username: string;
  readonly password: string;
}

export interface ManagedAccountPatch {
  readonly label?: string;
  readonly username?: string;
  readonly password?: string;
}

export interface AccountGameServer {
  readonly name: string;
  readonly language: string;
  readonly online: boolean;
  readonly upgrade: boolean;
  readonly playerCount: number;
  readonly maxPlayers: number;
}

export interface AccountGameServersResult {
  readonly servers: readonly AccountGameServer[];
  readonly refreshAvailableAt: number;
}

export interface AccountScriptSession {
  readonly username: string;
  readonly gameWindowId?: number;
  readonly scriptName?: string;
  readonly status: AccountScriptStatus;
  readonly message?: string;
  readonly updatedAt: number;
}

export interface AccountManagerState {
  readonly accounts: readonly ManagedAccount[];
  readonly sessions: readonly AccountScriptSession[];
  readonly storagePath: string;
}

export interface AccountLaunchRequest {
  readonly username: string;
  readonly script?: ScriptExecutePayload | null;
  readonly server?: string;
}

export interface AccountLaunchResult {
  readonly gameWindowId: number;
}

export interface AccountGameLaunchPayload {
  readonly account: ManagedAccount;
  readonly script?: ScriptExecutePayload;
  readonly server?: string;
  readonly gameWindowId: number;
  readonly requestedAt: number;
}

export interface AccountScriptStatusUpdate {
  readonly username: string;
  readonly gameWindowId: number;
  readonly scriptName?: string;
  readonly status: AccountScriptStatus;
  readonly message?: string;
}

export interface IpcInvokeDefinition<
  TArgs extends ReadonlyArray<unknown>,
  TReturn,
> {
  readonly args: TArgs;
  readonly return: TReturn;
}

export interface ScriptingInvokeChannels {
  readonly [ScriptingIpcChannels.openFile]: IpcInvokeDefinition<
    [],
    ScriptExecutePayload | null
  >;
  readonly [ScriptingIpcChannels.readFile]: IpcInvokeDefinition<
    [path: string],
    ScriptExecutePayload
  >;
}

export interface ScriptingRendererEventChannels {
  readonly [ScriptingIpcChannels.execute]: [payload: ScriptExecutePayload];
  readonly [ScriptingIpcChannels.stop]: [];
}

export interface ScriptingBridge {
  openFile(): Promise<ScriptExecutePayload | null>;
  readFile(path: string): Promise<ScriptExecutePayload>;
  onExecute(listener: (payload: ScriptExecutePayload) => void): () => void;
  onStop(listener: () => void): () => void;
}

export interface WindowInvokeChannels {
  readonly [WindowIpcChannels.open]: IpcInvokeDefinition<[id: WindowId], void>;
}

export interface WindowsBridge {
  open(id: WindowId): Promise<void>;
}

export interface AccountManagerInvokeChannels {
  readonly [AccountManagerIpcChannels.getState]: IpcInvokeDefinition<
    [],
    AccountManagerState
  >;
  readonly [AccountManagerIpcChannels.getServers]: IpcInvokeDefinition<
    [],
    AccountGameServersResult
  >;
  readonly [AccountManagerIpcChannels.refreshServers]: IpcInvokeDefinition<
    [],
    AccountGameServersResult
  >;
  readonly [AccountManagerIpcChannels.getGameLaunch]: IpcInvokeDefinition<
    [],
    AccountGameLaunchPayload | null
  >;
  readonly [AccountManagerIpcChannels.createAccount]: IpcInvokeDefinition<
    [draft: ManagedAccountDraft],
    AccountManagerState
  >;
  readonly [AccountManagerIpcChannels.updateAccount]: IpcInvokeDefinition<
    [username: string, patch: ManagedAccountPatch],
    AccountManagerState
  >;
  readonly [AccountManagerIpcChannels.deleteAccount]: IpcInvokeDefinition<
    [username: string],
    AccountManagerState
  >;
  readonly [AccountManagerIpcChannels.launch]: IpcInvokeDefinition<
    [request: AccountLaunchRequest],
    AccountLaunchResult
  >;
  readonly [AccountManagerIpcChannels.updateScriptStatus]: IpcInvokeDefinition<
    [update: AccountScriptStatusUpdate],
    void
  >;
}

export interface AccountManagerRendererEventChannels {
  readonly [AccountManagerIpcChannels.changed]: [state: AccountManagerState];
  readonly [AccountManagerIpcChannels.gameLaunch]: [
    payload: AccountGameLaunchPayload,
  ];
}

export interface AccountManagerBridge {
  getState(): Promise<AccountManagerState>;
  getServers(): Promise<AccountGameServersResult>;
  refreshServers(): Promise<AccountGameServersResult>;
  getGameLaunch(): Promise<AccountGameLaunchPayload | null>;
  createAccount(draft: ManagedAccountDraft): Promise<AccountManagerState>;
  updateAccount(
    username: string,
    patch: ManagedAccountPatch,
  ): Promise<AccountManagerState>;
  deleteAccount(username: string): Promise<AccountManagerState>;
  launch(request: AccountLaunchRequest): Promise<AccountLaunchResult>;
  updateScriptStatus(update: AccountScriptStatusUpdate): Promise<void>;
  onChanged(listener: (state: AccountManagerState) => void): () => void;
  onGameLaunch(
    listener: (payload: AccountGameLaunchPayload) => void,
  ): () => void;
}

export interface SettingsInvokeChannels {
  readonly [SettingsIpcChannels.get]: IpcInvokeDefinition<[], AppSettings>;
  readonly [SettingsIpcChannels.updatePreferences]: IpcInvokeDefinition<
    [patch: PreferencesPatch],
    AppSettings
  >;
  readonly [SettingsIpcChannels.updateAppearance]: IpcInvokeDefinition<
    [patch: AppearancePatch],
    AppSettings
  >;
  readonly [SettingsIpcChannels.updateHotkeys]: IpcInvokeDefinition<
    [patch: HotkeysPatch],
    AppSettings
  >;
  readonly [SettingsIpcChannels.resetAppearance]: IpcInvokeDefinition<
    [],
    AppSettings
  >;
  readonly [SettingsIpcChannels.resetHotkeys]: IpcInvokeDefinition<
    [],
    AppSettings
  >;
}

export interface SettingsRendererEventChannels {
  readonly [SettingsIpcChannels.changed]: [settings: AppSettings];
}

export interface SettingsBridge {
  get(): Promise<AppSettings>;
  updatePreferences(patch: PreferencesPatch): Promise<AppSettings>;
  updateAppearance(patch: AppearancePatch): Promise<AppSettings>;
  updateHotkeys(patch: HotkeysPatch): Promise<AppSettings>;
  resetAppearance(): Promise<AppSettings>;
  resetHotkeys(): Promise<AppSettings>;
  onChanged(listener: (settings: AppSettings) => void): () => void;
}

export interface ArmyInvokeChannels {
  readonly [ArmyIpcChannels.loadConfig]: IpcInvokeDefinition<
    [fileName: string],
    ArmyConfigPayload
  >;
  readonly [ArmyIpcChannels.start]: IpcInvokeDefinition<
    [payload: ArmyStartPayload],
    ArmySessionPayload
  >;
  readonly [ArmyIpcChannels.leave]: IpcInvokeDefinition<
    [payload: ArmyLeavePayload],
    void
  >;
  readonly [ArmyIpcChannels.barrier]: IpcInvokeDefinition<
    [payload: ArmyBarrierPayload],
    void
  >;
  readonly [ArmyIpcChannels.status]: IpcInvokeDefinition<
    [payload: ArmyStatusPayload],
    ArmyStatusResult
  >;
}

export interface ArmyBridge {
  loadConfig(fileName: string): Promise<ArmyConfigPayload>;
  start(payload: ArmyStartPayload): Promise<ArmySessionPayload>;
  leave(payload: ArmyLeavePayload): Promise<void>;
  barrier(payload: ArmyBarrierPayload): Promise<void>;
  status(payload: ArmyStatusPayload): Promise<ArmyStatusResult>;
}

export interface EnvironmentInvokeChannels {
  readonly [EnvironmentIpcChannels.getState]: IpcInvokeDefinition<
    [],
    EnvironmentState
  >;
  readonly [EnvironmentIpcChannels.clear]: IpcInvokeDefinition<
    [],
    EnvironmentState
  >;
  readonly [EnvironmentIpcChannels.addQuest]: IpcInvokeDefinition<
    [questId: number | string, rewardItemId?: number | string],
    EnvironmentState
  >;
  readonly [EnvironmentIpcChannels.removeQuest]: IpcInvokeDefinition<
    [questId: number | string],
    EnvironmentState
  >;
  readonly [EnvironmentIpcChannels.setQuestReward]: IpcInvokeDefinition<
    [questId: number | string, rewardItemId: number | string],
    EnvironmentState
  >;
  readonly [EnvironmentIpcChannels.clearQuestReward]: IpcInvokeDefinition<
    [questId: number | string],
    EnvironmentState
  >;
  readonly [EnvironmentIpcChannels.clearQuests]: IpcInvokeDefinition<
    [],
    EnvironmentState
  >;
  readonly [EnvironmentIpcChannels.setQuestAutoRegister]: IpcInvokeDefinition<
    [options: EnvironmentQuestAutoRegisterOptions],
    EnvironmentState
  >;
  readonly [EnvironmentIpcChannels.addItem]: IpcInvokeDefinition<
    [name: string],
    EnvironmentState
  >;
  readonly [EnvironmentIpcChannels.removeItem]: IpcInvokeDefinition<
    [name: string],
    EnvironmentState
  >;
  readonly [EnvironmentIpcChannels.setItemRules]: IpcInvokeDefinition<
    [rules: EnvironmentItemRules],
    EnvironmentState
  >;
  readonly [EnvironmentIpcChannels.clearItems]: IpcInvokeDefinition<
    [],
    EnvironmentState
  >;
  readonly [EnvironmentIpcChannels.addBoost]: IpcInvokeDefinition<
    [name: string],
    EnvironmentState
  >;
  readonly [EnvironmentIpcChannels.removeBoost]: IpcInvokeDefinition<
    [name: string],
    EnvironmentState
  >;
  readonly [EnvironmentIpcChannels.clearBoosts]: IpcInvokeDefinition<
    [],
    EnvironmentState
  >;
  readonly [EnvironmentIpcChannels.fetchBoosts]: IpcInvokeDefinition<
    [],
    readonly string[]
  >;
  readonly [EnvironmentIpcChannels.syncToAll]: IpcInvokeDefinition<
    [],
    EnvironmentState
  >;
}

export interface EnvironmentRendererEventChannels {
  readonly [EnvironmentIpcChannels.changed]: [state: EnvironmentState];
  readonly [EnvironmentIpcChannels.fetchBoostsRequest]: [requestId: string];
}

export interface EnvironmentMainEventChannels {
  readonly [EnvironmentIpcChannels.fetchBoostsResponse]: [
    requestId: string,
    boosts: readonly string[],
  ];
}

export interface EnvironmentBridge {
  getState(): Promise<EnvironmentState>;
  clear(): Promise<EnvironmentState>;
  addQuest(
    questId: number | string,
    rewardItemId?: number | string,
  ): Promise<EnvironmentState>;
  removeQuest(questId: number | string): Promise<EnvironmentState>;
  setQuestReward(
    questId: number | string,
    rewardItemId: number | string,
  ): Promise<EnvironmentState>;
  clearQuestReward(questId: number | string): Promise<EnvironmentState>;
  clearQuests(): Promise<EnvironmentState>;
  setQuestAutoRegister(
    options: EnvironmentQuestAutoRegisterOptions,
  ): Promise<EnvironmentState>;
  addItem(name: string): Promise<EnvironmentState>;
  removeItem(name: string): Promise<EnvironmentState>;
  setItemRules(rules: EnvironmentItemRules): Promise<EnvironmentState>;
  clearItems(): Promise<EnvironmentState>;
  addBoost(name: string): Promise<EnvironmentState>;
  removeBoost(name: string): Promise<EnvironmentState>;
  clearBoosts(): Promise<EnvironmentState>;
  fetchBoosts(): Promise<readonly string[]>;
  syncToAll(): Promise<EnvironmentState>;
  onChanged(listener: (state: EnvironmentState) => void): () => void;
  onFetchBoostsRequest(
    listener: () => Promise<readonly string[]> | readonly string[],
  ): () => void;
}

export type AppPlatform = "mac" | "windows" | "linux";

export interface PlatformBridge {
  readonly os: AppPlatform;
}

export interface AppBridge {
  readonly accounts: AccountManagerBridge;
  readonly army: ArmyBridge;
  readonly environment: EnvironmentBridge;
  readonly platform: PlatformBridge;
  readonly scripting: ScriptingBridge;
  readonly settings: SettingsBridge;
  readonly windows: WindowsBridge;
}

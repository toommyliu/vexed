import type { WindowId } from "./windows";
import type {
  ArmyBarrierPayload,
  ArmyConfigPayload,
  ArmyLeavePayload,
  ArmyLoopTauntCommandPayload,
  ArmyLoopTauntObservationPayload,
  ArmyLoopTauntStartPayload,
  ArmyLoopTauntStopPayload,
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
import type {
  FastTravel,
  FastTravelDraft,
  FastTravelWarpPayload,
} from "./fast-travels";
import type { FollowerStartPayload, FollowerState } from "./follower";
import type {
  PacketCapturedPayload,
  PacketQueuePayload,
  PacketsStatusPayload,
  PacketSendPayload,
} from "./packets";
import type {
  GrabbedData,
  LoaderGrabberGrabRequest,
  LoaderGrabberLoadRequest,
} from "./loader-grabber";
import type {
  CombatProfile,
  CombatProfileAutoAttackState,
  CombatProfileLibrary,
} from "./combat-profiles";
import type {
  ObservabilityInput,
  ObservabilitySnapshot,
} from "./observability";

export type {
  ArmyBarrierPayload,
  ArmyConfigPayload,
  ArmyLeavePayload,
  ArmyLoopTauntCastOutcomeReason,
  ArmyLoopTauntCommandPayload,
  ArmyLoopTauntObservationPayload,
  ArmyLoopTauntObservationType,
  ArmyLoopTauntParticipantPayload,
  ArmyLoopTauntStartPayload,
  ArmyLoopTauntStopPayload,
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
  CombatProfile,
  CombatProfileAutoAttackMode,
  CombatProfileAutoAttackState,
  CombatProfileAuraCondition,
  CombatProfileComparison,
  CombatProfileCondition,
  CombatProfileCooldownMode,
  CombatProfileLibrary,
  CombatProfileRef,
  CombatProfileRefSelected,
  CombatProfileStatCondition,
  CombatProfileStep,
  CombatProfileThresholdUnit,
} from "./combat-profiles";

export type {
  EnvironmentItemRules,
  EnvironmentQuestAutoRegisterOptions,
  EnvironmentState,
} from "./environment";

export type {
  FastTravel,
  FastTravelDraft,
  FastTravelWarpPayload,
} from "./fast-travels";

export type {
  FollowerConfig,
  FollowerLocationFallback,
  FollowerPhase,
  FollowerStartPayload,
  FollowerState,
} from "./follower";

export type {
  PacketCapturedPayload,
  PacketCaptureType,
  PacketQueuePayload,
  PacketSendPayload,
  PacketSendTarget,
  PacketsStatusPayload,
} from "./packets";

export type {
  ObservabilityErrorInfo,
  ObservabilityInput,
  ObservabilityLevel,
  ObservabilityRecord,
  ObservabilitySnapshot,
  ObservabilitySource,
} from "./observability";

export type {
  GrabbedData,
  GrabbedDataByType,
  LoaderGrabberGrabRequest,
  LoaderGrabberGrabType,
  LoaderGrabberLoadRequest,
  LoaderGrabberLoadType,
} from "./loader-grabber";

export const ScriptingIpcChannels = {
  execute: "scripting:execute",
  stop: "scripting:stop",
  openFile: "scripting:open-file",
  readFile: "scripting:read-file",
} as const;

export const WindowIpcChannels = {
  open: "windows:open",
  requestCloseGameWindow: "windows:request-close-game-window",
} as const;

export const AccountManagerIpcChannels = {
  getState: "account-manager:get-state",
  getServers: "account-manager:get-servers",
  refreshServers: "account-manager:refresh-servers",
  getGameLaunch: "account-manager:get-game-launch",
  createAccount: "account-manager:create-account",
  updateAccount: "account-manager:update-account",
  deleteAccount: "account-manager:delete-account",
  createGroup: "account-manager:create-group",
  updateGroup: "account-manager:update-group",
  deleteGroup: "account-manager:delete-group",
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
  loopTauntStart: "army:loop-taunt:start",
  loopTauntStop: "army:loop-taunt:stop",
  loopTauntObservation: "army:loop-taunt:observation",
  loopTauntCommand: "army:loop-taunt:command",
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

export const FastTravelsIpcChannels = {
  getAll: "fast-travels:get-all",
  create: "fast-travels:create",
  update: "fast-travels:update",
  delete: "fast-travels:delete",
  warp: "fast-travels:warp",
  changed: "fast-travels:changed",
  request: "fast-travels:request",
  response: "fast-travels:response",
} as const;

export const CombatProfilesIpcChannels = {
  getState: "combat-profiles:get-state",
  saveProfile: "combat-profiles:save-profile",
  deleteProfile: "combat-profiles:delete-profile",
  setAutoAttack: "combat-profiles:set-auto-attack",
  changed: "combat-profiles:changed",
} as const;

export const FollowerIpcChannels = {
  getState: "follower:get-state",
  me: "follower:me",
  start: "follower:start",
  stop: "follower:stop",
  changed: "follower:changed",
  request: "follower:request",
  response: "follower:response",
  publishState: "follower:publish-state",
} as const;

export const PacketsIpcChannels = {
  startCapture: "packets:start-capture",
  stopCapture: "packets:stop-capture",
  send: "packets:send",
  startQueue: "packets:start-queue",
  stopQueue: "packets:stop-queue",
  captured: "packets:captured",
  status: "packets:status",
  publishCaptured: "packets:publish-captured",
  publishStatus: "packets:publish-status",
  request: "packets:request",
  response: "packets:response",
} as const;

export const LoaderGrabberIpcChannels = {
  load: "loader-grabber:load",
  grab: "loader-grabber:grab",
  request: "loader-grabber:request",
  response: "loader-grabber:response",
} as const;

export const UpdatesIpcChannels = {
  getState: "updates:get-state",
  check: "updates:check",
  changed: "updates:changed",
} as const;

export const ObservabilityIpcChannels = {
  write: "observability:write",
  snapshot: "observability:snapshot",
} as const;

export type FollowerRequestKind = "getState" | "me" | "start" | "stop";

export type PacketsRequestKind =
  | "startCapture"
  | "stopCapture"
  | "send"
  | "startQueue"
  | "stopQueue";

export type LoaderGrabberRequestKind = "load" | "grab";

export type FastTravelsRequestKind = "warp";

export interface FollowerRequestMessage {
  readonly requestId: string;
  readonly kind: FollowerRequestKind;
  readonly payload?: unknown;
}

export type FollowerResponseMessage =
  | {
      readonly requestId: string;
      readonly ok: true;
      readonly value: unknown;
    }
  | {
      readonly requestId: string;
      readonly ok: false;
      readonly error: string;
    };

export interface PacketsRequestMessage {
  readonly requestId: string;
  readonly kind: PacketsRequestKind;
  readonly payload?: unknown;
}

export type PacketsResponseMessage =
  | {
      readonly requestId: string;
      readonly ok: true;
    }
  | {
      readonly error: string;
      readonly ok: false;
      readonly requestId: string;
    };

export type LoaderGrabberRequestMessage =
  | {
      readonly requestId: string;
      readonly kind: "load";
      readonly payload: LoaderGrabberLoadRequest;
    }
  | {
      readonly requestId: string;
      readonly kind: "grab";
      readonly payload: LoaderGrabberGrabRequest;
    };

export type LoaderGrabberResponseMessage =
  | {
      readonly requestId: string;
      readonly ok: true;
      readonly value?: GrabbedData | null;
    }
  | {
      readonly error: string;
      readonly ok: false;
      readonly requestId: string;
    };

export interface FastTravelsRequestMessage {
  readonly requestId: string;
  readonly kind: FastTravelsRequestKind;
  readonly payload: FastTravelWarpPayload;
}

export type FastTravelsResponseMessage =
  | {
      readonly requestId: string;
      readonly ok: true;
    }
  | {
      readonly error: string;
      readonly ok: false;
      readonly requestId: string;
    };

export interface ScriptOptions {
  readonly usePrivateRooms: boolean;
}

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

export interface UpdateReleaseInfo {
  readonly version: string;
  readonly tagName: string;
  readonly name?: string;
  readonly htmlUrl: string;
  readonly publishedAt?: string;
  readonly body?: string;
}

export type UpdateCheckState =
  | {
      readonly status: "idle";
      readonly currentVersion: string;
      readonly lastCheckedAt?: string;
    }
  | {
      readonly status: "checking";
      readonly currentVersion: string;
      readonly lastCheckedAt?: string;
    }
  | {
      readonly status: "current";
      readonly currentVersion: string;
      readonly latestVersion: string;
      readonly checkedAt: string;
    }
  | {
      readonly status: "available";
      readonly currentVersion: string;
      readonly latestVersion: string;
      readonly checkedAt: string;
      readonly release: UpdateReleaseInfo;
    }
  | {
      readonly status: "failed";
      readonly currentVersion: string;
      readonly checkedAt: string;
      readonly error: string;
    };

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

export type ManagedAccountGroups = Readonly<Record<string, readonly string[]>>;

export interface ManagedAccountGroupDraft {
  readonly name: string;
  readonly usernames: readonly string[];
}

export interface ManagedAccountGroupPatch {
  readonly name?: string;
  readonly usernames?: readonly string[];
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
  readonly groups: ManagedAccountGroups;
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
  readonly [WindowIpcChannels.requestCloseGameWindow]: IpcInvokeDefinition<
    [],
    void
  >;
}

export interface WindowsBridge {
  open(id: WindowId): Promise<void>;
  requestCloseGameWindow(): void;
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
  readonly [AccountManagerIpcChannels.createGroup]: IpcInvokeDefinition<
    [draft: ManagedAccountGroupDraft],
    AccountManagerState
  >;
  readonly [AccountManagerIpcChannels.updateGroup]: IpcInvokeDefinition<
    [name: string, patch: ManagedAccountGroupPatch],
    AccountManagerState
  >;
  readonly [AccountManagerIpcChannels.deleteGroup]: IpcInvokeDefinition<
    [name: string],
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
  createGroup(draft: ManagedAccountGroupDraft): Promise<AccountManagerState>;
  updateGroup(
    name: string,
    patch: ManagedAccountGroupPatch,
  ): Promise<AccountManagerState>;
  deleteGroup(name: string): Promise<AccountManagerState>;
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
  readonly [ArmyIpcChannels.loopTauntStart]: IpcInvokeDefinition<
    [payload: ArmyLoopTauntStartPayload],
    void
  >;
  readonly [ArmyIpcChannels.loopTauntStop]: IpcInvokeDefinition<
    [payload: ArmyLoopTauntStopPayload],
    void
  >;
  readonly [ArmyIpcChannels.loopTauntObservation]: IpcInvokeDefinition<
    [payload: ArmyLoopTauntObservationPayload],
    void
  >;
}

export interface ArmyRendererEventChannels {
  readonly [ArmyIpcChannels.loopTauntCommand]: [
    payload: ArmyLoopTauntCommandPayload,
  ];
}

export interface ArmyBridge {
  loadConfig(fileName: string): Promise<ArmyConfigPayload>;
  start(payload: ArmyStartPayload): Promise<ArmySessionPayload>;
  leave(payload: ArmyLeavePayload): Promise<void>;
  barrier(payload: ArmyBarrierPayload): Promise<void>;
  status(payload: ArmyStatusPayload): Promise<ArmyStatusResult>;
  startLoopTaunt(payload: ArmyLoopTauntStartPayload): Promise<void>;
  stopLoopTaunt(payload: ArmyLoopTauntStopPayload): Promise<void>;
  publishLoopTauntObservation(
    payload: ArmyLoopTauntObservationPayload,
  ): Promise<void>;
  onLoopTauntCommand(
    listener: (payload: ArmyLoopTauntCommandPayload) => void,
  ): () => void;
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

export interface FastTravelsInvokeChannels {
  readonly [FastTravelsIpcChannels.getAll]: IpcInvokeDefinition<
    [],
    readonly FastTravel[]
  >;
  readonly [FastTravelsIpcChannels.create]: IpcInvokeDefinition<
    [draft: FastTravelDraft],
    readonly FastTravel[]
  >;
  readonly [FastTravelsIpcChannels.update]: IpcInvokeDefinition<
    [originalName: string, draft: FastTravelDraft],
    readonly FastTravel[]
  >;
  readonly [FastTravelsIpcChannels.delete]: IpcInvokeDefinition<
    [name: string],
    readonly FastTravel[]
  >;
  readonly [FastTravelsIpcChannels.warp]: IpcInvokeDefinition<
    [payload: FastTravelWarpPayload],
    void
  >;
}

export interface FastTravelsRendererEventChannels {
  readonly [FastTravelsIpcChannels.changed]: [locations: readonly FastTravel[]];
  readonly [FastTravelsIpcChannels.request]: [
    request: FastTravelsRequestMessage,
  ];
}

export interface FastTravelsMainEventChannels {
  readonly [FastTravelsIpcChannels.response]: [
    response: FastTravelsResponseMessage,
  ];
}

export interface FastTravelsBridge {
  getAll(): Promise<readonly FastTravel[]>;
  create(draft: FastTravelDraft): Promise<readonly FastTravel[]>;
  update(
    originalName: string,
    draft: FastTravelDraft,
  ): Promise<readonly FastTravel[]>;
  delete(name: string): Promise<readonly FastTravel[]>;
  warp(payload: FastTravelWarpPayload): Promise<void>;
  onChanged(listener: (locations: readonly FastTravel[]) => void): () => void;
  onRequest(listener: (request: FastTravelsRequestMessage) => void): () => void;
  respond(response: FastTravelsResponseMessage): Promise<void>;
}

export interface CombatProfilesInvokeChannels {
  readonly [CombatProfilesIpcChannels.getState]: IpcInvokeDefinition<
    [],
    CombatProfileLibrary
  >;
  readonly [CombatProfilesIpcChannels.saveProfile]: IpcInvokeDefinition<
    [profile: CombatProfile],
    CombatProfileLibrary
  >;
  readonly [CombatProfilesIpcChannels.deleteProfile]: IpcInvokeDefinition<
    [profileId: string],
    CombatProfileLibrary
  >;
  readonly [CombatProfilesIpcChannels.setAutoAttack]: IpcInvokeDefinition<
    [state: CombatProfileAutoAttackState],
    CombatProfileLibrary
  >;
}

export interface CombatProfilesRendererEventChannels {
  readonly [CombatProfilesIpcChannels.changed]: [state: CombatProfileLibrary];
}

export interface CombatProfilesBridge {
  getState(): Promise<CombatProfileLibrary>;
  saveProfile(profile: CombatProfile): Promise<CombatProfileLibrary>;
  deleteProfile(profileId: string): Promise<CombatProfileLibrary>;
  setAutoAttack(
    state: CombatProfileAutoAttackState,
  ): Promise<CombatProfileLibrary>;
  onChanged(listener: (state: CombatProfileLibrary) => void): () => void;
}

export interface FollowerBridge {
  getState(): Promise<FollowerState>;
  me(): Promise<string>;
  start(payload: FollowerStartPayload): Promise<FollowerState>;
  stop(): Promise<FollowerState>;
  publishState(state: FollowerState): Promise<void>;
  onChanged(listener: (state: FollowerState) => void): () => void;
  onGetStateRequest(
    listener: () => Promise<FollowerState> | FollowerState,
  ): () => void;
  onMeRequest(listener: () => Promise<string> | string): () => void;
  onStartRequest(
    listener: (
      payload: FollowerStartPayload,
    ) => Promise<FollowerState> | FollowerState,
  ): () => void;
  onStopRequest(
    listener: () => Promise<FollowerState> | FollowerState,
  ): () => void;
}

export interface PacketsInvokeChannels {
  readonly [PacketsIpcChannels.startCapture]: IpcInvokeDefinition<[], void>;
  readonly [PacketsIpcChannels.stopCapture]: IpcInvokeDefinition<[], void>;
  readonly [PacketsIpcChannels.send]: IpcInvokeDefinition<
    [payload: PacketSendPayload],
    void
  >;
  readonly [PacketsIpcChannels.startQueue]: IpcInvokeDefinition<
    [payload: PacketQueuePayload],
    void
  >;
  readonly [PacketsIpcChannels.stopQueue]: IpcInvokeDefinition<[], void>;
  readonly [PacketsIpcChannels.publishCaptured]: IpcInvokeDefinition<
    [payload: PacketCapturedPayload],
    void
  >;
  readonly [PacketsIpcChannels.publishStatus]: IpcInvokeDefinition<
    [payload: PacketsStatusPayload],
    void
  >;
}

export interface LoaderGrabberInvokeChannels {
  readonly [LoaderGrabberIpcChannels.load]: IpcInvokeDefinition<
    [payload: LoaderGrabberLoadRequest],
    void
  >;
  readonly [LoaderGrabberIpcChannels.grab]: IpcInvokeDefinition<
    [payload: LoaderGrabberGrabRequest],
    GrabbedData | null
  >;
}

export interface LoaderGrabberRendererEventChannels {
  readonly [LoaderGrabberIpcChannels.request]: [
    request: LoaderGrabberRequestMessage,
  ];
}

export interface LoaderGrabberMainEventChannels {
  readonly [LoaderGrabberIpcChannels.response]: [
    response: LoaderGrabberResponseMessage,
  ];
}

export interface LoaderGrabberBridge {
  load(payload: LoaderGrabberLoadRequest): Promise<void>;
  grab(payload: LoaderGrabberGrabRequest): Promise<GrabbedData | null>;
  onRequest(
    listener: (request: LoaderGrabberRequestMessage) => void,
  ): () => void;
  respond(response: LoaderGrabberResponseMessage): Promise<void>;
}

export interface PacketsRendererEventChannels {
  readonly [PacketsIpcChannels.captured]: [payload: PacketCapturedPayload];
  readonly [PacketsIpcChannels.status]: [payload: PacketsStatusPayload];
  readonly [PacketsIpcChannels.request]: [request: PacketsRequestMessage];
}

export interface PacketsMainEventChannels {
  readonly [PacketsIpcChannels.response]: [response: PacketsResponseMessage];
}

export interface PacketsBridge {
  startCapture(): Promise<void>;
  stopCapture(): Promise<void>;
  send(payload: PacketSendPayload): Promise<void>;
  startQueue(payload: PacketQueuePayload): Promise<void>;
  stopQueue(): Promise<void>;
  publishCaptured(payload: PacketCapturedPayload): Promise<void>;
  publishStatus(payload: PacketsStatusPayload): Promise<void>;
  onCaptured(listener: (payload: PacketCapturedPayload) => void): () => void;
  onStatus(listener: (payload: PacketsStatusPayload) => void): () => void;
  onRequest(listener: (request: PacketsRequestMessage) => void): () => void;
  respond(response: PacketsResponseMessage): Promise<void>;
}

export interface UpdatesInvokeChannels {
  readonly [UpdatesIpcChannels.getState]: IpcInvokeDefinition<
    [],
    UpdateCheckState
  >;
  readonly [UpdatesIpcChannels.check]: IpcInvokeDefinition<
    [],
    UpdateCheckState
  >;
}

export interface UpdatesRendererEventChannels {
  readonly [UpdatesIpcChannels.changed]: [state: UpdateCheckState];
}

export interface UpdatesBridge {
  getState(): Promise<UpdateCheckState>;
  check(): Promise<UpdateCheckState>;
  onChanged(listener: (state: UpdateCheckState) => void): () => void;
}

export interface ObservabilityInvokeChannels {
  readonly [ObservabilityIpcChannels.write]: IpcInvokeDefinition<
    [record: ObservabilityInput],
    void
  >;
  readonly [ObservabilityIpcChannels.snapshot]: IpcInvokeDefinition<
    [],
    ObservabilitySnapshot
  >;
}

export interface ObservabilityBridge {
  write(record: ObservabilityInput): Promise<void>;
  snapshot(): Promise<ObservabilitySnapshot>;
}

export type AppPlatform = "mac" | "windows" | "linux";

export interface PlatformBridge {
  readonly os: AppPlatform;
}

export interface AppBridge {
  readonly accounts: AccountManagerBridge;
  readonly army: ArmyBridge;
  readonly combatProfiles: CombatProfilesBridge;
  readonly environment: EnvironmentBridge;
  readonly fastTravels: FastTravelsBridge;
  readonly follower: FollowerBridge;
  readonly loaderGrabber: LoaderGrabberBridge;
  readonly observability: ObservabilityBridge;
  readonly packets: PacketsBridge;
  readonly platform: PlatformBridge;
  readonly scripting: ScriptingBridge;
  readonly settings: SettingsBridge;
  readonly updates: UpdatesBridge;
  readonly windows: WindowsBridge;
}

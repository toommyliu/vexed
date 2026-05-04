import type { WindowId } from "./windows";
import type {
  AppSettings,
  AppearancePatch,
  PreferencesPatch,
} from "./settings";

export type {
  AppSettings,
  Appearance,
  AppearancePatch,
  AppLaunchMode,
  Preferences,
  PreferencesPatch,
  ThemeMode,
  ThemeProfile,
  ThemeProfilePatch,
  ThemeRgb,
  ThemeTokenName,
  ThemeVariant,
} from "./settings";

export const ScriptingIpcChannels = {
  execute: "scripting:execute",
  stop: "scripting:stop",
  openFile: "scripting:open-file",
  readFile: "scripting:read-file",
} as const;

export const WindowIpcChannels = {
  open: "windows:open",
} as const;

export const SettingsIpcChannels = {
  get: "settings:get",
  updatePreferences: "settings:update-preferences",
  updateAppearance: "settings:update-appearance",
  resetAppearance: "settings:reset-appearance",
  changed: "settings:changed",
} as const;

export interface ScriptExecutePayload {
  readonly source: string;
  readonly path?: string;
  readonly name?: string;
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
  readonly [SettingsIpcChannels.resetAppearance]: IpcInvokeDefinition<
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
  resetAppearance(): Promise<AppSettings>;
  onChanged(listener: (settings: AppSettings) => void): () => void;
}

export interface AppBridge {
  readonly scripting: ScriptingBridge;
  readonly settings: SettingsBridge;
  readonly windows: WindowsBridge;
}

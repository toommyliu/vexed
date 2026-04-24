import { ServiceMap } from "effect";
import type { Effect } from "effect";
import type { BridgeEffect } from "./Bridge";

export interface SettingsState {
  customName?: string;
  customGuild?: string;
  walkSpeed: number;
  deathAdsEnabled: boolean;
  collisionsEnabled: boolean;
  effectsEnabled: boolean;
  playersVisible: boolean;
  lagKillerEnabled: boolean;
  frameRate: number;
  enemyMagnetEnabled: boolean;
  infiniteRangeEnabled: boolean;
  provokeCellEnabled: boolean;
  skipCutscenesEnabled: boolean;
}

export type SettingsPatch = Partial<SettingsState>;

export type SettingsStateDisposer = () => void;

export type SettingsStateListener = (state: SettingsState) => void;

export interface SettingsStateSubscriptionOptions {
  readonly emitCurrent?: boolean;
}

export interface SettingsShape {
  enemyMagnet(): BridgeEffect<void>;
  infiniteRange(): BridgeEffect<void>;
  provokeCell(): BridgeEffect<void>;
  skipCutscenes(): BridgeEffect<void>;
  setEnemyMagnetEnabled(enabled: boolean): BridgeEffect<void>;
  setInfiniteRangeEnabled(enabled: boolean): BridgeEffect<void>;
  setProvokeCellEnabled(enabled: boolean): BridgeEffect<void>;
  setSkipCutscenesEnabled(enabled: boolean): BridgeEffect<void>;
  setCustomName(name: string): BridgeEffect<void>;
  setCustomGuild(name: string): BridgeEffect<void>;
  setWalkSpeed(speed: number): BridgeEffect<void>;
  setDeathAdsEnabled(enabled: boolean): BridgeEffect<void>;
  setCollisionsEnabled(enabled: boolean): BridgeEffect<void>;
  setEffectsEnabled(enabled: boolean): BridgeEffect<void>;
  setPlayersVisible(visible: boolean): BridgeEffect<void>;
  setLagKillerEnabled(enabled: boolean): BridgeEffect<void>;
  setFrameRate(fps: number): BridgeEffect<void>;

  apply(patch: SettingsPatch): BridgeEffect<void>;
  patchState(patch: SettingsPatch): BridgeEffect<SettingsState>;
  getState(): Effect.Effect<SettingsState>;
  onState(
    listener: SettingsStateListener,
    options?: SettingsStateSubscriptionOptions,
  ): Effect.Effect<SettingsStateDisposer>;
}

export class Settings extends ServiceMap.Service<Settings, SettingsShape>()(
  "flash/Services/Settings",
) {}

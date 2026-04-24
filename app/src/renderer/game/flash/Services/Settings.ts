import { ServiceMap } from "effect";
import type { BridgeEffect } from "./Bridge";

export interface SettingsShape {
  enemyMagnet(): BridgeEffect<void>;
  infiniteRange(): BridgeEffect<void>;
  provokeCell(): BridgeEffect<void>;
  skipCutscenes(): BridgeEffect<void>;

  setCustomName(name: string): BridgeEffect<void>;
  setCustomGuild(name: string): BridgeEffect<void>;
  setWalkSpeed(speed: number): BridgeEffect<void>;

  setDeathAdsEnabled(enabled: boolean): BridgeEffect<void>;
  setCollisionsEnabled(enabled: boolean): BridgeEffect<void>;
  setEffectsEnabled(enabled: boolean): BridgeEffect<void>;
  setPlayersVisible(visible: boolean): BridgeEffect<void>;
  setWorldVisible(visible: boolean): BridgeEffect<void>;
  setLagKillerEnabled(enabled: boolean): BridgeEffect<void>;
  setFrameRate(fps: number): BridgeEffect<void>;
}

export class Settings extends ServiceMap.Service<Settings, SettingsShape>()(
  "flash/Services/Settings",
) {}

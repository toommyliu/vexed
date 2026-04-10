import { ServiceMap } from "effect";
import type { BridgeEffect } from "./Bridge";

export interface SettingsShape {
  enemyMagnet(): BridgeEffect<void>;
  infiniteRange(): BridgeEffect<void>;
  lagKiller(on: boolean): BridgeEffect<void>;
  provokeCell(): BridgeEffect<void>;
  setAccessLevel(accessLevel: string): BridgeEffect<void>;
  setDeathAds(on: boolean): BridgeEffect<void>;
  setDisableCollisions(on: boolean): BridgeEffect<void>;
  setDisableFX(on: boolean): BridgeEffect<void>;
  setFPS(fps: number): BridgeEffect<void>;
  setGuild(name: string): BridgeEffect<void>;
  setHidePlayers(on: boolean): BridgeEffect<void>;
  setName(name: string): BridgeEffect<void>;
  setWalkSpeed(speed: number): BridgeEffect<void>;
  skipCutscenes(): BridgeEffect<void>;
}

export class Settings extends ServiceMap.Service<Settings, SettingsShape>()(
  "flash/Services/Settings",
) {}

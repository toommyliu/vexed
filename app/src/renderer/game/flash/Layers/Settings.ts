import { Effect, Layer } from "effect";
import { Bridge } from "../Services/Bridge";
import { Settings } from "../Services/Settings";
import type { SettingsShape } from "../Services/Settings";

const make = Effect.gen(function* () {
  const bridge = yield* Bridge;

  return {
    enemyMagnet: () => bridge.call("settings.enemyMagnet"),
    infiniteRange: () => bridge.call("settings.infiniteRange"),
    lagKiller: (on: boolean) => bridge.call("settings.lagKiller", [on]),
    provokeCell: () => bridge.call("settings.provokeCell"),
    setAccessLevel: (accessLevel: string) =>
      bridge.call("settings.setAccessLevel", [accessLevel]),
    setDeathAds: (on: boolean) => bridge.call("settings.setDeathAds", [on]),
    setDisableCollisions: (on: boolean) =>
      bridge.call("settings.setDisableCollisions", [on]),
    setDisableFX: (on: boolean) => bridge.call("settings.setDisableFX", [on]),
    setFPS: (fps: number) => bridge.call("settings.setFPS", [fps]),
    setGuild: (name: string) => bridge.call("settings.setGuild", [name]),
    setHidePlayers: (on: boolean) =>
      bridge.call("settings.setHidePlayers", [on]),
    setName: (name: string) => bridge.call("settings.setName", [name]),
    setWalkSpeed: (speed: number) => bridge.call("settings.setWalkSpeed", [speed]),
    skipCutscenes: () => bridge.call("settings.skipCutscenes"),
  } satisfies SettingsShape;
});

export const SettingsLive = Layer.effect(Settings, make);

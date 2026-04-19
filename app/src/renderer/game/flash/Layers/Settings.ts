import { Effect, Layer } from "effect";
import { Bridge } from "../Services/Bridge";
import { Settings } from "../Services/Settings";
import type { SettingsShape } from "../Services/Settings";

const make = Effect.gen(function* () {
  const bridge = yield* Bridge;

  const enemyMagnet: SettingsShape["enemyMagnet"] = () =>
    bridge.call("settings.enemyMagnet");

  const infiniteRange: SettingsShape["infiniteRange"] = () =>
    bridge.call("settings.infiniteRange");

  const provokeCell: SettingsShape["provokeCell"] = () =>
    bridge.call("settings.provokeCell");

  const skipCutscenes: SettingsShape["skipCutscenes"] = () =>
    bridge.call("settings.skipCutscenes");

  const setCustomName: SettingsShape["setCustomName"] = (name) =>
    bridge.call("settings.setCustomName", [name]);

  const setCustomGuild: SettingsShape["setCustomGuild"] = (name) =>
    bridge.call("settings.setCustomGuild", [name]);

  const setWalkSpeed: SettingsShape["setWalkSpeed"] = (speed) =>
    bridge.call("settings.setWalkSpeed", [speed]);

  const setDeathAdsEnabled: SettingsShape["setDeathAdsEnabled"] = (enabled) =>
    bridge.call("settings.setDeathAdsEnabled", [enabled]);

  const setCollisionsEnabled: SettingsShape["setCollisionsEnabled"] = (enabled) =>
    bridge.call("settings.setCollisionsEnabled", [enabled]);

  const setEffectsEnabled: SettingsShape["setEffectsEnabled"] = (enabled) =>
    bridge.call("settings.setEffectsEnabled", [enabled]);

  const setPlayersVisible: SettingsShape["setPlayersVisible"] = (visible) =>
    bridge.call("settings.setPlayersVisible", [visible]);

  const setWorldVisible: SettingsShape["setWorldVisible"] = (visible) =>
    bridge.call("settings.setWorldVisible", [visible]);

  const setLagKillerEnabled: SettingsShape["setLagKillerEnabled"] = (enabled) =>
    bridge.call("settings.setLagKillerEnabled", [enabled]);

  const setFrameRate: SettingsShape["setFrameRate"] = (fps) =>
    bridge.call("settings.setFrameRate", [fps]);

  return {
    enemyMagnet,
    infiniteRange,
    provokeCell,
    skipCutscenes,
    setCustomName,
    setCustomGuild,
    setWalkSpeed,
    setDeathAdsEnabled,
    setCollisionsEnabled,
    setEffectsEnabled,
    setPlayersVisible,
    setWorldVisible,
    setLagKillerEnabled,
    setFrameRate,
  } satisfies SettingsShape;
});

export const SettingsLive = Layer.effect(Settings, make);

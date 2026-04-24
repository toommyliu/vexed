import { positiveIntOr } from "@vexed/shared/number";
import { trim } from "@vexed/shared/string";
import { Effect, Layer, SynchronizedRef } from "effect";
import { Bridge } from "../Services/Bridge";
import { Settings } from "../Services/Settings";
import type {
  SettingsPatch,
  SettingsShape,
  SettingsState,
  SettingsStateListener,
} from "../Services/Settings";

const DEFAULT_STATE: SettingsState = {
  walkSpeed: 8,
  deathAdsEnabled: true,
  collisionsEnabled: true,
  effectsEnabled: true,
  playersVisible: true,
  lagKillerEnabled: false,
  frameRate: 24,
  enemyMagnetEnabled: false,
  infiniteRangeEnabled: false,
  provokeCellEnabled: false,
  skipCutscenesEnabled: false,
};

const cloneState = (state: SettingsState): SettingsState => ({ ...state });

const normalizePatch = (patch: SettingsPatch): SettingsPatch => {
  const normalized: SettingsPatch = {};

  if (patch.customName !== undefined) {
    normalized.customName = trim(patch.customName);
  }

  if (patch.customGuild !== undefined) {
    normalized.customGuild = trim(patch.customGuild);
  }

  if (patch.walkSpeed !== undefined) {
    normalized.walkSpeed = positiveIntOr(
      patch.walkSpeed,
      DEFAULT_STATE.walkSpeed,
    );
  }

  if (patch.deathAdsEnabled !== undefined) {
    normalized.deathAdsEnabled = patch.deathAdsEnabled;
  }

  if (patch.collisionsEnabled !== undefined) {
    normalized.collisionsEnabled = patch.collisionsEnabled;
  }

  if (patch.effectsEnabled !== undefined) {
    normalized.effectsEnabled = patch.effectsEnabled;
  }

  if (patch.playersVisible !== undefined) {
    normalized.playersVisible = patch.playersVisible;
  }

  if (patch.lagKillerEnabled !== undefined) {
    normalized.lagKillerEnabled = patch.lagKillerEnabled;
  }

  if (patch.frameRate !== undefined) {
    normalized.frameRate = positiveIntOr(
      patch.frameRate,
      DEFAULT_STATE.frameRate,
    );
  }

  if (patch.enemyMagnetEnabled !== undefined) {
    normalized.enemyMagnetEnabled = patch.enemyMagnetEnabled;
  }

  if (patch.infiniteRangeEnabled !== undefined) {
    normalized.infiniteRangeEnabled = patch.infiniteRangeEnabled;
  }

  if (patch.provokeCellEnabled !== undefined) {
    normalized.provokeCellEnabled = patch.provokeCellEnabled;
  }

  if (patch.skipCutscenesEnabled !== undefined) {
    normalized.skipCutscenesEnabled = patch.skipCutscenesEnabled;
  }

  return normalized;
};

const hasPatchChanges = (patch: SettingsPatch): boolean =>
  patch.customName !== undefined ||
  patch.customGuild !== undefined ||
  patch.walkSpeed !== undefined ||
  patch.deathAdsEnabled !== undefined ||
  patch.collisionsEnabled !== undefined ||
  patch.effectsEnabled !== undefined ||
  patch.playersVisible !== undefined ||
  patch.lagKillerEnabled !== undefined ||
  patch.frameRate !== undefined ||
  patch.enemyMagnetEnabled !== undefined ||
  patch.infiniteRangeEnabled !== undefined ||
  patch.provokeCellEnabled !== undefined ||
  patch.skipCutscenesEnabled !== undefined;

const make = Effect.gen(function* () {
  const bridge = yield* Bridge;
  const runFork = Effect.runForkWith(yield* Effect.services());
  const stateRef = yield* SynchronizedRef.make<SettingsState>(DEFAULT_STATE);
  const listenersRef = yield* SynchronizedRef.make<Set<SettingsStateListener>>(
    new Set(),
  );

  const emitState = (state: SettingsState) =>
    Effect.gen(function* () {
      const listeners = yield* SynchronizedRef.get(listenersRef);
      if (listeners.size === 0) {
        return;
      }

      const snapshot = cloneState(state);
      yield* Effect.forEach(
        Array.from(listeners),
        (listener, listenerIndex) =>
          Effect.sync(() => listener(snapshot)).pipe(
            Effect.catchCause((cause) =>
              Effect.logError({
                message: "settings listener failed",
                listenerIndex,
                cause,
              }),
            ),
          ),
        { discard: true },
      );
    });

  const applyPersistentPatchToBridge = (patch: SettingsPatch) =>
    Effect.gen(function* () {
      if (patch.customName !== undefined) {
        yield* bridge.call("settings.setCustomName", [patch.customName]);
      }

      if (patch.customGuild !== undefined) {
        yield* bridge.call("settings.setCustomGuild", [patch.customGuild]);
      }

      if (patch.walkSpeed !== undefined) {
        yield* bridge.call("settings.setWalkSpeed", [patch.walkSpeed]);
      }

      if (patch.deathAdsEnabled !== undefined) {
        yield* bridge.call("settings.setDeathAdsEnabled", [
          patch.deathAdsEnabled,
        ]);
      }

      if (patch.collisionsEnabled !== undefined) {
        yield* bridge.call("settings.setCollisionsEnabled", [
          patch.collisionsEnabled,
        ]);
      }

      if (patch.effectsEnabled !== undefined) {
        yield* bridge.call("settings.setEffectsEnabled", [
          patch.effectsEnabled,
        ]);
      }

      if (patch.playersVisible !== undefined) {
        yield* bridge.call("settings.setPlayersVisible", [
          patch.playersVisible,
        ]);
      }

      if (patch.lagKillerEnabled !== undefined) {
        yield* bridge.call("settings.setLagKillerEnabled", [
          patch.lagKillerEnabled,
        ]);
      }

      if (patch.frameRate !== undefined) {
        yield* bridge.call("settings.setFrameRate", [patch.frameRate]);
      }
    });

  const applyActionPatchToBridge = (patch: SettingsPatch) =>
    Effect.gen(function* () {
      if (patch.enemyMagnetEnabled === true) {
        yield* bridge.call("settings.enemyMagnet");
      }

      if (patch.infiniteRangeEnabled === true) {
        yield* bridge.call("settings.infiniteRange");
      }

      if (patch.provokeCellEnabled === true) {
        yield* bridge.call("settings.provokeCell");
      }

      if (patch.skipCutscenesEnabled === true) {
        yield* bridge.call("settings.skipCutscenes");
      }
    });

  const getState: SettingsShape["getState"] = () =>
    SynchronizedRef.get(stateRef).pipe(Effect.map(cloneState));

  const patchState: SettingsShape["patchState"] = (patch) =>
    Effect.gen(function* () {
      const normalizedPatch = normalizePatch(patch);
      if (!hasPatchChanges(normalizedPatch)) {
        return yield* getState();
      }

      yield* applyPersistentPatchToBridge(normalizedPatch);

      const nextState = yield* SynchronizedRef.modify(stateRef, (state) => {
        const updated = {
          ...state,
          ...normalizedPatch,
        } satisfies SettingsState;

        return [updated, updated] as const;
      });

      yield* emitState(nextState);
      return cloneState(nextState);
    });

  const onState: SettingsShape["onState"] = (listener, options) =>
    Effect.gen(function* () {
      yield* SynchronizedRef.update(listenersRef, (listeners) => {
        listeners.add(listener);
        return listeners;
      });

      if (options?.emitCurrent ?? true) {
        const state = yield* getState();
        yield* Effect.sync(() => listener(state));
      }

      return () => {
        runFork(
          SynchronizedRef.update(listenersRef, (listeners) => {
            listeners.delete(listener);
            return listeners;
          }),
        );
      };
    });

  const enemyMagnet: SettingsShape["enemyMagnet"] = () =>
    bridge.call("settings.enemyMagnet");

  const infiniteRange: SettingsShape["infiniteRange"] = () =>
    bridge.call("settings.infiniteRange");

  const provokeCell: SettingsShape["provokeCell"] = () =>
    bridge.call("settings.provokeCell");

  const skipCutscenes: SettingsShape["skipCutscenes"] = () =>
    bridge.call("settings.skipCutscenes");

  const setEnemyMagnetEnabled: SettingsShape["setEnemyMagnetEnabled"] = (
    enabled,
  ) => Effect.asVoid(patchState({ enemyMagnetEnabled: enabled }));

  const setInfiniteRangeEnabled: SettingsShape["setInfiniteRangeEnabled"] = (
    enabled,
  ) => Effect.asVoid(patchState({ infiniteRangeEnabled: enabled }));

  const setProvokeCellEnabled: SettingsShape["setProvokeCellEnabled"] = (
    enabled,
  ) => Effect.asVoid(patchState({ provokeCellEnabled: enabled }));

  const setSkipCutscenesEnabled: SettingsShape["setSkipCutscenesEnabled"] = (
    enabled,
  ) => Effect.asVoid(patchState({ skipCutscenesEnabled: enabled }));

  const setCustomName: SettingsShape["setCustomName"] = (name) =>
    Effect.asVoid(patchState({ customName: name }));

  const setCustomGuild: SettingsShape["setCustomGuild"] = (name) =>
    Effect.asVoid(patchState({ customGuild: name }));

  const setWalkSpeed: SettingsShape["setWalkSpeed"] = (speed) =>
    Effect.asVoid(patchState({ walkSpeed: speed }));

  const setDeathAdsEnabled: SettingsShape["setDeathAdsEnabled"] = (enabled) =>
    Effect.asVoid(patchState({ deathAdsEnabled: enabled }));

  const setCollisionsEnabled: SettingsShape["setCollisionsEnabled"] = (
    enabled,
  ) => Effect.asVoid(patchState({ collisionsEnabled: enabled }));

  const setEffectsEnabled: SettingsShape["setEffectsEnabled"] = (enabled) =>
    Effect.asVoid(patchState({ effectsEnabled: enabled }));

  const setPlayersVisible: SettingsShape["setPlayersVisible"] = (visible) =>
    Effect.asVoid(patchState({ playersVisible: visible }));

  const setLagKillerEnabled: SettingsShape["setLagKillerEnabled"] = (enabled) =>
    Effect.asVoid(patchState({ lagKillerEnabled: enabled }));

  const setFrameRate: SettingsShape["setFrameRate"] = (fps) =>
    Effect.asVoid(patchState({ frameRate: fps }));

  const apply: SettingsShape["apply"] = (patch) =>
    Effect.gen(function* () {
      const normalizedPatch = normalizePatch(patch);
      if (!hasPatchChanges(normalizedPatch)) {
        return;
      }

      yield* applyPersistentPatchToBridge(normalizedPatch);
      yield* applyActionPatchToBridge(normalizedPatch);
    });

  return {
    enemyMagnet,
    infiniteRange,
    provokeCell,
    skipCutscenes,
    setEnemyMagnetEnabled,
    setInfiniteRangeEnabled,
    setProvokeCellEnabled,
    setSkipCutscenesEnabled,
    setCustomName,
    setCustomGuild,
    setWalkSpeed,
    setDeathAdsEnabled,
    setCollisionsEnabled,
    setEffectsEnabled,
    setPlayersVisible,
    setLagKillerEnabled,
    setFrameRate,
    apply,
    patchState,
    getState,
    onState,
  } satisfies SettingsShape;
});

export const SettingsLive = Layer.effect(Settings, make);

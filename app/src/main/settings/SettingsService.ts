import { BrowserWindow, nativeTheme } from "electron";
import { Effect, Layer, ServiceMap, SynchronizedRef } from "effect";
import { SettingsIpcChannels } from "../../shared/ipc";
import {
  THEME_TOKEN_NAMES,
  isMotionMode,
  type AppSettings,
  type Appearance,
  type AppearancePatch,
  type HotkeysPatch,
  type Preferences,
  type PreferencesPatch,
  type ThemeMode,
  type ThemeProfile,
  type ThemeProfilePatch,
  type ThemeRgb,
  type ThemeTokenName,
  type ThemeVariant,
} from "../../shared/settings";
import { MainEnvironment } from "../app/MainEnvironment";
import { Observability } from "../app/MainObservability";
import {
  Persistence,
  type DocumentReadResult,
  type PersistenceError,
} from "../persistence/Persistence";
import * as AppearanceSettings from "./Appearance";
import * as HotkeysSettings from "./Hotkeys";
import * as PreferencesSettings from "./Preferences";

type SettingsChangeListener = (settings: AppSettings) => void;

export interface SettingsServiceShape {
  readonly load: Effect.Effect<AppSettings, PersistenceError>;
  readonly get: Effect.Effect<AppSettings, PersistenceError>;
  readonly updatePreferences: (
    patch: PreferencesPatch,
  ) => Effect.Effect<AppSettings, PersistenceError>;
  readonly updateAppearance: (
    patch: AppearancePatch,
  ) => Effect.Effect<AppSettings, PersistenceError>;
  readonly updateHotkeys: (
    patch: HotkeysPatch,
  ) => Effect.Effect<AppSettings, PersistenceError>;
  readonly resetAppearance: Effect.Effect<AppSettings, PersistenceError>;
  readonly resetHotkeys: Effect.Effect<AppSettings, PersistenceError>;
  readonly onChanged: (
    listener: SettingsChangeListener,
  ) => Effect.Effect<() => void>;
  readonly syncNativeTheme: (appearance: Appearance) => Effect.Effect<void>;
  readonly installNativeThemeChangeBroadcast: Effect.Effect<void>;
}

export class SettingsService extends ServiceMap.Service<
  SettingsService,
  SettingsServiceShape
>()("main/SettingsService") {}

const themeTokenNames = new Set<string>(THEME_TOKEN_NAMES);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isThemeMode = (value: unknown): value is ThemeMode =>
  value === "light" || value === "dark" || value === "system";

const isThemeVariant = (value: string): value is ThemeVariant =>
  value === "light" || value === "dark";

const isThemeTokenName = (value: string): value is ThemeTokenName =>
  themeTokenNames.has(value);

const applyThemeProfilePatch = (
  profile: ThemeProfile,
  patch: ThemeProfilePatch,
): ThemeProfile => {
  const tokens: Partial<Record<ThemeTokenName, ThemeRgb>> = {
    ...profile.tokens,
  };

  if (isRecord(patch.tokens)) {
    for (const [name, rawValue] of Object.entries(patch.tokens)) {
      if (!isThemeTokenName(name)) {
        continue;
      }

      if (rawValue === null) {
        delete tokens[name];
        continue;
      }

      const value = AppearanceSettings.normalizeRgb(rawValue);
      if (value !== undefined) {
        tokens[name] = value;
      }
    }
  }

  return {
    tokens,
    sansFont:
      AppearanceSettings.normalizeFont(patch.sansFont) ?? profile.sansFont,
    monoFont:
      AppearanceSettings.normalizeFont(patch.monoFont) ?? profile.monoFont,
    sansFontSize:
      AppearanceSettings.normalizeFontSize(patch.sansFontSize) ??
      profile.sansFontSize,
    monoFontSize:
      AppearanceSettings.normalizeFontSize(patch.monoFontSize) ??
      profile.monoFontSize,
    rounding:
      AppearanceSettings.normalizeRounding(patch.rounding) ?? profile.rounding,
  };
};

const readDocumentOrDefault = <A>(
  result: DocumentReadResult,
  defaults: A,
  normalize: (value: unknown) => A,
): A => (result.status === "ok" ? normalize(result.value) : defaults);

export const SettingsServiceLive = Layer.effect(SettingsService)(
  Effect.gen(function* () {
    const env = yield* MainEnvironment;
    const persistence = yield* Persistence;
    const observability = yield* Observability;
    const listeners = new Set<SettingsChangeListener>();
    let nativeThemeListenerInstalled = false;

    const preferencesPath = env.appDataPath(PreferencesSettings.fileName);
    const appearancePath = env.appDataPath(AppearanceSettings.fileName);
    const hotkeysPath = env.appDataPath(HotkeysSettings.fileName);

    const loadJson = <A>(
      path: string,
      label: string,
      defaults: A,
      normalize: (value: unknown) => A,
      serialize: (value: A) => unknown,
    ) =>
      Effect.gen(function* () {
        const result = yield* persistence.readJson(path);
        if (result.status === "malformed") {
          const quarantinePath = yield* persistence.quarantineMalformed(
            path,
            result.error.message,
          );
          yield* observability.warn("settings", "Malformed settings file", {
            label,
            path,
            quarantinePath,
            error: result.error,
          });
          yield* persistence.writeJson(path, serialize(defaults));
          return defaults;
        }

        return readDocumentOrDefault(result, defaults, normalize);
      });

    const loadSettings = Effect.gen(function* () {
      const preferences = yield* loadJson(
        preferencesPath,
        "preferences",
        PreferencesSettings.DEFAULT,
        PreferencesSettings.normalize,
        PreferencesSettings.serialize,
      );
      const appearance = yield* loadJson(
        appearancePath,
        "appearance",
        AppearanceSettings.DEFAULT,
        AppearanceSettings.normalize,
        AppearanceSettings.serialize,
      );
      const hotkeys = yield* loadJson(
        hotkeysPath,
        "hotkeys",
        HotkeysSettings.DEFAULT,
        HotkeysSettings.normalize,
        HotkeysSettings.serialize,
      );

      return { preferences, appearance, hotkeys } satisfies AppSettings;
    });

    const stateRef = yield* SynchronizedRef.make<AppSettings | null>(null);

    const syncNativeTheme = (appearance: Appearance) =>
      Effect.sync(() => {
        nativeTheme.themeSource = appearance.themeMode;
      });

    const broadcastSettings = (settings: AppSettings): void => {
      for (const win of BrowserWindow.getAllWindows()) {
        if (win.isDestroyed() || win.webContents.isDestroyed()) {
          continue;
        }

        win.webContents.send(SettingsIpcChannels.changed, settings);
      }
    };

    const publishSettings = (
      settings: AppSettings,
    ): Effect.Effect<AppSettings> =>
      Effect.gen(function* () {
        yield* syncNativeTheme(settings.appearance);
        yield* Effect.sync(() => {
          broadcastSettings(settings);
          for (const listener of listeners) {
            listener(settings);
          }
        });
        return settings;
      });

    const get = SynchronizedRef.get(stateRef).pipe(
      Effect.flatMap((current) =>
        current === null
          ? loadSettings.pipe(
              Effect.tap((settings) => SynchronizedRef.set(stateRef, settings)),
            )
          : Effect.succeed(current),
      ),
    );

    const setSettings = (settings: AppSettings) =>
      SynchronizedRef.set(stateRef, settings).pipe(
        Effect.flatMap(() => publishSettings(settings)),
      );

    const updatePreferences = (patch: PreferencesPatch) =>
      Effect.gen(function* () {
        const current = yield* get;
        const nextPreferences: Preferences = {
          checkForUpdates:
            typeof patch.checkForUpdates === "boolean"
              ? patch.checkForUpdates
              : current.preferences.checkForUpdates,
          launchMode: PreferencesSettings.isLaunchMode(patch.launchMode)
            ? patch.launchMode
            : current.preferences.launchMode,
        };

        yield* persistence.writeJson(
          preferencesPath,
          PreferencesSettings.serialize(nextPreferences),
        );
        return yield* setSettings({
          ...current,
          preferences: nextPreferences,
        });
      });

    const updateAppearance = (patch: AppearancePatch) =>
      Effect.gen(function* () {
        const current = yield* get;
        let light = current.appearance.themes.light;
        let dark = current.appearance.themes.dark;

        if (isRecord(patch.themes)) {
          for (const [variant, profilePatch] of Object.entries(patch.themes)) {
            if (!isThemeVariant(variant) || !isRecord(profilePatch)) {
              continue;
            }

            if (variant === "light") {
              light = applyThemeProfilePatch(light, profilePatch);
            } else {
              dark = applyThemeProfilePatch(dark, profilePatch);
            }
          }
        }

        const nextAppearance: Appearance = {
          themeMode: isThemeMode(patch.themeMode)
            ? patch.themeMode
            : current.appearance.themeMode,
          reduceMotion: isMotionMode(patch.reduceMotion)
            ? patch.reduceMotion
            : current.appearance.reduceMotion,
          useCursorPointers:
            typeof patch.useCursorPointers === "boolean"
              ? patch.useCursorPointers
              : current.appearance.useCursorPointers,
          themes: { light, dark },
        };

        yield* persistence.writeJson(
          appearancePath,
          AppearanceSettings.serialize(nextAppearance),
        );
        return yield* setSettings({
          ...current,
          appearance: AppearanceSettings.normalize(nextAppearance),
        });
      });

    const updateHotkeys = (patch: HotkeysPatch) =>
      Effect.gen(function* () {
        const current = yield* get;
        const nextHotkeys = Array.isArray(patch.bindings)
          ? HotkeysSettings.applyPatch(current.hotkeys, patch.bindings)
          : current.hotkeys;

        yield* persistence.writeJson(
          hotkeysPath,
          HotkeysSettings.serialize(nextHotkeys),
        );
        return yield* setSettings({
          ...current,
          hotkeys: nextHotkeys,
        });
      });

    const resetAppearance = Effect.gen(function* () {
      const current = yield* get;
      yield* persistence.writeJson(
        appearancePath,
        AppearanceSettings.serialize(AppearanceSettings.DEFAULT),
      );
      return yield* setSettings({
        ...current,
        appearance: AppearanceSettings.DEFAULT,
      });
    });

    const resetHotkeys = Effect.gen(function* () {
      const current = yield* get;
      yield* persistence.writeJson(
        hotkeysPath,
        HotkeysSettings.serialize(HotkeysSettings.DEFAULT),
      );
      return yield* setSettings({
        ...current,
        hotkeys: HotkeysSettings.DEFAULT,
      });
    });

    return {
      load: loadSettings.pipe(
        Effect.tap((settings) => SynchronizedRef.set(stateRef, settings)),
        Effect.tap((settings) => syncNativeTheme(settings.appearance)),
      ),
      get,
      updatePreferences,
      updateAppearance,
      updateHotkeys,
      resetAppearance,
      resetHotkeys,
      onChanged: (listener) =>
        Effect.sync(() => {
          listeners.add(listener);
          return () => {
            listeners.delete(listener);
          };
        }),
      syncNativeTheme,
      installNativeThemeChangeBroadcast: Effect.sync(() => {
        if (nativeThemeListenerInstalled) {
          return;
        }

        nativeThemeListenerInstalled = true;
        nativeTheme.on("updated", () => {
          void Effect.runPromise(
            get.pipe(
              Effect.map((settings) => {
                broadcastSettings(settings);
              }),
            ),
          );
        });
      }),
    };
  }),
);

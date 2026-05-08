import {
  applyAppearanceSnapshotToDocument,
  createAppearanceSnapshot,
  getTextSizeTokens,
  resolveThemeVariant,
  rgbToCssValue,
} from "../shared/appearance-snapshot";
import type { Appearance, AppSettings, ThemeVariant } from "../shared/settings";

let activeAppearance: Appearance | null = null;

export interface RendererSettingsSync {
  readonly ready: Promise<AppSettings | null>;
  readonly dispose: () => void;
}

export { getTextSizeTokens, rgbToCssValue };

export const resolveActiveThemeVariant = (
  appearance: Appearance,
): ThemeVariant => {
  return resolveThemeVariant(
    appearance,
    Boolean(globalThis.matchMedia?.("(prefers-color-scheme: dark)").matches),
  );
};

export const applyAppearance = (appearance: Appearance): void => {
  activeAppearance = appearance;

  const root = document.documentElement;
  const variant = resolveActiveThemeVariant(appearance);
  applyAppearanceSnapshotToDocument(
    root,
    createAppearanceSnapshot(appearance, variant === "dark"),
  );
};

export const applySettings = (settings: AppSettings): void => {
  applyAppearance(settings.appearance);
};

export const installSettingsSync = (): RendererSettingsSync => {
  const bridge = window.ipc?.settings;
  if (!bridge) {
    return {
      ready: Promise.resolve(null),
      dispose: () => {},
    };
  }

  let disposed = false;
  let initialSettled = false;
  let changedDuringInitialLoad = false;
  let latestSettings: AppSettings | null = null;
  const media = globalThis.matchMedia?.("(prefers-color-scheme: dark)") ?? null;
  const mediaListener = () => {
    if (activeAppearance?.themeMode === "system") {
      applyAppearance(activeAppearance);
    }
  };

  if (media) {
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", mediaListener);
    } else {
      media.addListener(mediaListener);
    }
  }

  const unsubscribeSettings = bridge.onChanged((settings) => {
    latestSettings = settings;
    if (!initialSettled) {
      changedDuringInitialLoad = true;
    }
    applySettings(settings);
  });

  const ready = bridge
    .get()
    .then((settings) => {
      latestSettings = changedDuringInitialLoad ? latestSettings : settings;

      if (!changedDuringInitialLoad && !disposed) {
        applySettings(settings);
      }

      initialSettled = true;
      return latestSettings;
    })
    .catch((error: unknown) => {
      initialSettled = true;
      console.error("Failed to load settings:", error);
      return null;
    });

  const dispose = () => {
    if (disposed) {
      return;
    }

    disposed = true;
    unsubscribeSettings();

    if (!media) {
      return;
    }

    if (typeof media.removeEventListener === "function") {
      media.removeEventListener("change", mediaListener);
    } else {
      media.removeListener(mediaListener);
    }
  };

  return { ready, dispose };
};

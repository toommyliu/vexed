import "../styles.css";
import { render } from "solid-js/web";
import type { JSX } from "solid-js";
import { installSettingsSync } from "../theme";
import type { AppPlatform } from "../../shared/ipc";
import type { AppSettings } from "../../shared/settings";

declare global {
  interface ImportMeta {
    readonly hot?: {
      dispose(callback: () => void): void;
    };
  }
}

export interface WindowMountContext {
  readonly initialSettings: AppSettings | null;
  readonly platform: AppPlatform;
}

const markReady = (): void => {
  document.documentElement.dataset["ready"] = "true";
};

export function mountWindow(
  App: (context: WindowMountContext) => JSX.Element,
): void {
  const root = document.getElementById("root");
  const settingsSync = installSettingsSync();
  let disposed = false;
  let disposeRender: (() => void) | undefined;

  const cleanup = () => {
    if (disposed) {
      return;
    }

    disposed = true;
    disposeRender?.();
    settingsSync.dispose();
    window.removeEventListener("beforeunload", cleanup);
  };

  window.addEventListener("beforeunload", cleanup, { once: true });

  if (import.meta.hot) {
    import.meta.hot.dispose(cleanup);
  }

  if (!root) {
    cleanup();
    markReady();
    return;
  }

  void settingsSync.ready
    .then((initialSettings) => {
      if (disposed) {
        return;
      }

      disposeRender = render(
        () => App({ initialSettings, platform: window.ipc.platform.os }),
        root,
      );
      markReady();
    })
    .catch((error: unknown) => {
      console.error("Failed to mount renderer window:", error);
      cleanup();
      markReady();
    });
}

import type { BrowserWindow } from "electron";
import type { ElectronWindowRuntime } from "./WindowTypes";

export type RevealSubscription = (listener: () => void) => void;

export const bindFirstRevealTrigger = (
  subscribers: readonly RevealSubscription[],
  reveal: () => void,
): void => {
  let revealed = false;
  const fire = () => {
    if (revealed) {
      return;
    }

    revealed = true;
    reveal();
  };

  for (const subscribe of subscribers) {
    subscribe(fire);
  }
};

export const revealWindow = (
  runtime: Pick<ElectronWindowRuntime, "focusApp" | "platform">,
  window: BrowserWindow,
): void => {
  if (window.isDestroyed()) {
    return;
  }

  if (window.isMinimized()) {
    window.restore();
  }

  if (!window.isVisible()) {
    window.show();
  }

  if (runtime.platform === "darwin") {
    runtime.focusApp();
  }

  window.focus();
};

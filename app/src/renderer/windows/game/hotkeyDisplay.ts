import { formatForDisplay } from "@tanstack/solid-hotkeys";
import type { AppPlatform } from "../../../shared/ipc";

export const formatGameShortcut = (
  value: string,
  platform: AppPlatform,
): string | null => {
  if (value === "") {
    return null;
  }

  return formatForDisplay(value, { platform });
};

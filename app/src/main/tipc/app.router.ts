import type { TipcInstance } from "@vexed/tipc";
import { IS_WINDOWS, IS_MAC, IS_LINUX } from "../constants";

export function createAppTipcRouter(tipc: TipcInstance) {
  return {
    platform: tipc.procedure.action(async () => ({
      isMac: IS_MAC,
      isWindows: IS_WINDOWS,
      isLinux: IS_LINUX,
    })),
  };
}

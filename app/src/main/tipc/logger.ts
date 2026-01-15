import type { TipcInstance } from "@vexed/tipc";
import type { MainLogEntry } from "~/shared/types";
import { logFromRenderer } from "../services/logger";

export function createLoggerTipcRouter(tipcInstance: TipcInstance) {
  return {
    logEntry: tipcInstance.procedure
      .input<MainLogEntry>()
      .event(async ({ input }) => {
        logFromRenderer(input);
      }),
  };
}

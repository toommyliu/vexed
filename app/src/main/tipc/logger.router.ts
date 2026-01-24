import type { TipcInstance } from "@vexed/tipc";
import type { MainLogEntry } from "~/shared/types";
import { logFromRenderer } from "../services/logger";

export function createLoggerTipcRouter(tipcInstance: TipcInstance) {
  return {
    // TODO: scope doesn't seem to work
    logEntry: tipcInstance.procedure
      .input<MainLogEntry>()
      .action(async ({ input }) => {
        logFromRenderer(input);
      }),
  };
}

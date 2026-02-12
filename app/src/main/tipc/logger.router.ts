import type { TipcInstance } from "@vexed/tipc";
import type { MainLogEntry } from "~/shared/types";
import { logFromRenderer } from "../services/logger";

export function createLoggerTipcRouter(tipc: TipcInstance) {
  return {
    logEntry: tipc.procedure.input<MainLogEntry>().action(async ({ input }) => {
      logFromRenderer(input);
    }),
  };
}

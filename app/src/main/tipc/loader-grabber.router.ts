import type { TipcInstance } from "@vexed/tipc";
import type { GrabberDataType, LoaderDataType } from "~/shared/types";
import { createLogger } from "../services/logger";
import { withParentGameHandlers } from "./forwarding";
import { TipcResult } from "./result";

const logger = createLogger("tipc:loader-grabber");

export function createLoaderGrabberTipcRouter(tipcInstance: TipcInstance) {
  return {
    load: tipcInstance.procedure
      .input<{ id: number; type: LoaderDataType }>()
      .requireSenderWindow()
      .action(async ({ input, context }) => {
        try {
          await withParentGameHandlers(context, (parentHandlers) =>
            parentHandlers.loaderGrabber.load.send(input),
          );
          return TipcResult.ok();
        } catch (error) {
          logger.error("Failed to send loader data", error);
          return TipcResult.err("FAILED");
        }
      }),

    grab: tipcInstance.procedure
      .input<{ type: GrabberDataType }>()
      .requireSenderWindow()
      .action(async ({ input, context }) => {
        try {
          const res = await withParentGameHandlers(
            context,
            async (parentHandlers) =>
              parentHandlers.loaderGrabber.grab.invoke({ type: input.type }),
          );
          if (!res) throw new Error("Received no data");
          return TipcResult.ok(res);
        } catch (error) {
          logger.error("Failed to grab loader data", error);
          return TipcResult.err("FAILED");
        }
      }),
  };
}

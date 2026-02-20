import type { TipcInstance } from "@vexed/tipc";
import { Result } from "better-result";
import type {
  LoaderGrabberGrabRequest,
  LoaderGrabberLoadRequest,
} from "~/shared/loader-grabber/types";
import { withParentGameHandlers } from "./forwarding";

export function createLoaderGrabberTipcRouter(tipc: TipcInstance) {
  return {
    load: tipc.procedure
      .input<LoaderGrabberLoadRequest>()
      .requireSenderWindow()
      .action(async ({ input, context }) =>
        withParentGameHandlers(context, async (parentHandlers) => {
          parentHandlers.loaderGrabber.load.send(input);
          return Result.serialize(Result.ok());
        }),
      ),

    grab: tipc.procedure
      .input<LoaderGrabberGrabRequest>()
      .requireSenderWindow()
      .action(async ({ input, context }) =>
        withParentGameHandlers(context, async (parentHandlers) => {
          const result = await parentHandlers.loaderGrabber.grab.invoke(input);
          return Result.serialize(Result.ok(result));
        }),
      ),
  };
}

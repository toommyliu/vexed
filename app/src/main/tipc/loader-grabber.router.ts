import type { TipcInstance } from "@vexed/tipc";
import { Result } from "better-result";
import {
  LoaderGrabberNoDataError,
  type LoaderGrabberError,
} from "~/shared/loader-grabber/errors";
import type {
  GrabbedData,
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
          return Result.serialize<void, LoaderGrabberError>(Result.ok());
        }),
      ),

    grab: tipc.procedure
      .input<LoaderGrabberGrabRequest>()
      .requireSenderWindow()
      .action(async ({ input, context }) =>
        withParentGameHandlers(context, async (parentHandlers) => {
          const res = await parentHandlers.loaderGrabber.grab.invoke(input);
          if (!res)
            return Result.serialize(
              Result.err<GrabbedData, LoaderGrabberError>(
                new LoaderGrabberNoDataError({ message: "No data received" }),
              ),
            );
          return Result.serialize<GrabbedData, LoaderGrabberError>(
            Result.ok(res),
          );
        }),
      ),
  };
}

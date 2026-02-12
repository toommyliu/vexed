import type { TipcInstance } from "@vexed/tipc";
import type { GrabberDataType, LoaderDataType } from "~/shared/types";
import { withParentGameHandlers } from "./forwarding";

export function createLoaderGrabberTipcRouter(tipcInstance: TipcInstance) {
  return {
    load: tipcInstance.procedure
      .input<{ id: number; type: LoaderDataType }>()
      .requireSenderWindow()
      .action(async ({ input, context }) => {
        await withParentGameHandlers(context, (parentHandlers) =>
          parentHandlers.loaderGrabber.load.send(input),
        );
      }),
    grab: tipcInstance.procedure
      .input<{ type: GrabberDataType }>()
      .requireSenderWindow()
      .action(async ({ input, context }) =>
        withParentGameHandlers(context, async (parentHandlers) =>
          parentHandlers.loaderGrabber.grab.invoke({ type: input.type }),
        ),
      ),
  };
}

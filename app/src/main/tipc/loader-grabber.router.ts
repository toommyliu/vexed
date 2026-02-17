import type { TipcInstance } from "@vexed/tipc";
import type { GrabberDataType, LoaderDataType } from "~/shared/types";
import { withParentGameHandlers } from "./forwarding";
import { TipcResult } from "./result";

export function createLoaderGrabberTipcRouter(tipc: TipcInstance) {
  return {
    load: tipc.procedure
      .input<{ id: number; type: LoaderDataType }>()
      .requireSenderWindow()
      .action(async ({ input, context }) => {
        await withParentGameHandlers(context, (parentHandlers) =>
          parentHandlers.loaderGrabber.load.send(input),
        );
        return TipcResult.ok();
      }),

    grab: tipc.procedure
      .input<{ type: GrabberDataType }>()
      .requireSenderWindow()
      .action(async ({ input, context }) => {
        const res = await withParentGameHandlers(
          context,
          async (parentHandlers) =>
            parentHandlers.loaderGrabber.grab.invoke({ type: input.type }),
        );
        if (!res) return;
        return TipcResult.ok(res);
      }),
  };
}

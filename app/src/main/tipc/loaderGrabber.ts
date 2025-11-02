import type { TipcInstance } from "@vexed/tipc";
import type { LoaderDataType, GrabberDataType } from "../../shared/types";
import type { RendererHandlers } from "../tipc";
import { windowStore } from "../windows";

export function createLoaderGrabberTipcRouter(tipcInstance: TipcInstance) {
  return {
    load: tipcInstance.procedure
      .input<{ id: number; type: LoaderDataType }>()
      .action(async ({ input, context }) => {
        const parent = context.senderParentWindow;
        if (!parent || !windowStore.has(parent.id)) return;

        const parentHandlers =
          context.getRendererHandlers<RendererHandlers>(parent);

        parentHandlers.loaderGrabber.load.send(input);
      }),
    grab: tipcInstance.procedure
      .input<{ type: GrabberDataType }>()
      .action(async ({ input, context }) => {
        const parent = context.senderParentWindow;
        if (!parent || !windowStore.has(parent.id)) return;

        const parentHandlers =
          context.getRendererHandlers<RendererHandlers>(parent);
        return parentHandlers.loaderGrabber.grab.invoke({ type: input.type });
      }),
  };
}

import type { TipcInstance } from "@vexed/tipc";
import type { GrabberDataType, LoaderDataType } from "~/shared/types";
import { windowsService } from "../services/windows";
import type { RendererHandlers } from "../tipc";

export function createLoaderGrabberTipcRouter(tipcInstance: TipcInstance) {
  return {
    load: tipcInstance.procedure
      .input<{ id: number; type: LoaderDataType }>()
      .requireSenderWindow()
      .action(async ({ input, context }) => {
        const parent = windowsService.resolveGameWindow(
          context.senderWindowId,
        );
        if (!parent) return;

        const parentHandlers =
          context.getRendererHandlers<RendererHandlers>(parent);
        parentHandlers.loaderGrabber.load.send(input);
      }),
    grab: tipcInstance.procedure
      .input<{ type: GrabberDataType }>()
      .requireSenderWindow()
      .action(async ({ input, context }) => {
        const parent = windowsService.resolveGameWindow(
          context.senderWindowId,
        );
        if (!parent) return;

        const parentHandlers =
          context.getRendererHandlers<RendererHandlers>(parent);
        return parentHandlers.loaderGrabber.grab.invoke({ type: input.type });
      }),
  };
}

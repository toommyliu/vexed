import type { TipcInstance } from "@vexed/tipc";
import type { GrabberDataType, LoaderDataType } from "~/shared/types";
import { windowsService } from "../services/windows";
import type { RendererHandlers } from "../tipc";

export function createLoaderGrabberTipcRouter(tipcInstance: TipcInstance) {
  return {
    load: tipcInstance.procedure
      .input<{ id: number; type: LoaderDataType }>()
      .action(async ({ input, context }) => {
        const senderWindow = context.senderWindow;
        if (!senderWindow) return;

        const parent = windowsService.resolveGameWindow(senderWindow.id);
        if (!parent) return;

        const parentHandlers =
          context.getRendererHandlers<RendererHandlers>(parent);
        parentHandlers.loaderGrabber.load.send(input);
      }),
    grab: tipcInstance.procedure
      .input<{ type: GrabberDataType }>()
      .action(async ({ input, context }) => {
        const senderWindow = context.senderWindow;
        if (!senderWindow) return;

        const parent = windowsService.resolveGameWindow(senderWindow.id);
        if (!parent) return;

        const parentHandlers =
          context.getRendererHandlers<RendererHandlers>(parent);
        return parentHandlers.loaderGrabber.grab.invoke({ type: input.type });
      }),
  };
}

import type { TipcInstance } from "@vexed/tipc";
import type { LoaderDataType, GrabberDataType } from "../../shared/types";
import type { RendererHandlers } from "../tipc";
import { getGameWindow, getGameWindowId, windowStore } from "../windows";

export function createLoaderGrabberTipcRouter(tipcInstance: TipcInstance) {
  return {
    load: tipcInstance.procedure
      .input<{ id: number; type: LoaderDataType }>()
      .action(async ({ input, context }) => {
        const senderWindow = context.senderWindow;
        if (!senderWindow) return;

        const gameWindowId = getGameWindowId(senderWindow.id);
        if (!gameWindowId || !windowStore.has(gameWindowId)) return;

        const parent = getGameWindow(senderWindow.id);
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

        const gameWindowId = getGameWindowId(senderWindow.id);
        if (!gameWindowId || !windowStore.has(gameWindowId)) return;

        const parent = getGameWindow(senderWindow.id);
        if (!parent) return;

        const parentHandlers =
          context.getRendererHandlers<RendererHandlers>(parent);
        return parentHandlers.loaderGrabber.grab.invoke({ type: input.type });
      }),
  };
}

import type { tipc } from "@vexed/tipc";
import { getRendererHandlers } from "@vexed/tipc";
import { BrowserWindow } from "electron";
import type { LoaderDataType, GrabberDataType } from "../../shared/types";
import type { RendererHandlers } from "../tipc";
import { windowStore } from "../windows";

type TipcInstance = ReturnType<typeof tipc.create>;

export function createLoaderGrabberTipcRouter(tipcInstance: TipcInstance) {
  return {
    load: tipcInstance.procedure
      .input<{ id: number; type: LoaderDataType }>()
      .action(async ({ input, context }) => {
        const browserWindow = BrowserWindow.fromWebContents(context.sender);
        if (!browserWindow) return;

        const parent = browserWindow.getParentWindow();
        if (!parent || !windowStore.has(parent.id)) return;

        const parentHandlers = getRendererHandlers<RendererHandlers>(
          parent.webContents,
        );

        parentHandlers.loaderGrabber.load.send(input);
      }),
    grab: tipcInstance.procedure
      .input<{ type: GrabberDataType }>()
      .action(async ({ input, context }) => {
        const browserWindow = BrowserWindow.fromWebContents(context.sender);
        if (!browserWindow) return;

        const parent = browserWindow.getParentWindow();
        if (!parent || !windowStore.has(parent.id)) return;

        const parentHandlers = getRendererHandlers<RendererHandlers>(
          parent.webContents,
        );

        return parentHandlers.loaderGrabber.grab.invoke({ type: input.type });
      }),
  };
}

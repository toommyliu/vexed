import type { tipc } from "@vexed/tipc";
import { getRendererHandlers } from "@vexed/tipc";
import { BrowserWindow } from "electron";
import type { RendererHandlers } from "../tipc";
import { windowStore } from "../windows";

type TipcInstance = ReturnType<typeof tipc.create>;

export function createHotkeysTipcRouter(tipcInstance: TipcInstance) {
  return {
    updateHotkey: tipcInstance.procedure
      .input<{
        id: string;
        value: string;
      }>()
      .action(async ({ input, context }) => {
        const browserWindow = BrowserWindow.fromWebContents(context.sender);
        if (!browserWindow) {
          console.log("No browser window found for hotkey update");
          return;
        }

        const parent = browserWindow.getParentWindow();
        if (!parent || !windowStore.has(parent.id)) {
          console.log("No parent window found for hotkey update");
          return;
        }

        const parentHandlers = getRendererHandlers<RendererHandlers>(
          parent.webContents,
        );
        await parentHandlers.hotkeys.updateHotkey.invoke(input);
      }),
  };
}
